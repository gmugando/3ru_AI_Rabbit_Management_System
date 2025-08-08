import { createClient } from '@supabase/supabase-js'
import apiConfig from '@/utils/apiConfig.js'

class NaturalLanguageQueryService {
  constructor(supabaseUrl, supabaseKey, openaiApiKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.openaiApiKey = openaiApiKey
    this.schema = null
  }

  // Initialize by fetching database schema
  async initialize() {
    try {
      this.schema = await this.getSchemaInfo()
    } catch (error) {
      console.error('Failed to load schema:', error)
      throw error
    }
  }

  // Get database schema information
  async getSchemaInfo() {
    try {
      // Try to get comprehensive schema info including relationships
      const { data: schemaData, error: schemaError } = await this.supabase
        .rpc('get_schema_info')
        .select()

      if (!schemaError && schemaData) {
        return schemaData
      }
    } catch (e) {
      console.warn('Custom schema function not available, using fallback')
    }

    // Enhanced fallback: get detailed table info and relationships
    const tableNames = ['breeding_plans', 'rabbits', 'transfers', 'transactions', 'feed_records', 'feeding_schedules']
    const schema = {
      tables: {},
      relationships: []
    }
    
    // Get detailed table columns using information_schema
    for (const tableName of tableNames) {
      try {
        // First try to get column info from information_schema
        const { data: columnInfo, error: columnError } = await this.supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')
          .order('ordinal_position')

        if (!columnError && columnInfo && columnInfo.length > 0) {
          schema.tables[tableName] = columnInfo.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES'
          }))
        } else {
          // Fallback: try to get from actual data
          const { data, error } = await this.supabase
            .from(tableName)
            .select('*')
            .limit(1)
          
          if (!error && data) {
            schema.tables[tableName] = Object.keys(data[0] || {}).map(col => ({
              name: col,
              type: 'unknown',
              nullable: true
            }))
          }
        }
      } catch (e) {
        console.warn(`Could not fetch schema for ${tableName}`)
        // Add known columns for critical tables if can't fetch from DB
        if (tableName === 'breeding_plans') {
          schema.tables[tableName] = [
            { name: 'id', type: 'uuid', nullable: false },
            { name: 'plan_id', type: 'text', nullable: false },
            { name: 'doe_id', type: 'uuid', nullable: false },
            { name: 'buck_id', type: 'uuid', nullable: false },
            { name: 'planned_date', type: 'date', nullable: false },
            { name: 'expected_kindle_date', type: 'date', nullable: false },
            { name: 'actual_mating_date', type: 'date', nullable: true },
            { name: 'actual_kindle_date', type: 'date', nullable: true },
            { name: 'status', type: 'text', nullable: false },
            { name: 'kits_born', type: 'integer', nullable: true },
            { name: 'kits_survived', type: 'integer', nullable: true },
            { name: 'notes', type: 'text', nullable: true },
            { name: 'created_at', type: 'timestamp', nullable: false },
            { name: 'updated_at', type: 'timestamp', nullable: false }
          ]
        }
      }
    }

    // Get foreign key relationships from information_schema
    try {
      const { data: relationships, error: relError } = await this.supabase
        .from('information_schema.key_column_usage')
        .select(`
          table_name,
          column_name,
          referenced_table_name,
          referenced_column_name
        `)
        .not('referenced_table_name', 'is', null)

      if (!relError && relationships) {
        schema.relationships = relationships.map(rel => ({
          from_table: rel.table_name,
          from_column: rel.column_name,
          to_table: rel.referenced_table_name,
          to_column: rel.referenced_column_name
        }))
      }
    } catch (e) {
      console.warn('Could not fetch foreign key relationships')
      // Provide comprehensive known relationships as fallback
      schema.relationships = [
        { from_table: 'breeding_plans', from_column: 'doe_id', to_table: 'rabbits', to_column: 'id' },
        { from_table: 'breeding_plans', from_column: 'buck_id', to_table: 'rabbits', to_column: 'id' },
        { from_table: 'transfers', from_column: 'rabbit_id', to_table: 'rabbits', to_column: 'id' },
        { from_table: 'feed_records', from_column: 'rabbit_id', to_table: 'rabbits', to_column: 'id' },
        { from_table: 'feeding_schedules', from_column: 'user_id', to_table: 'auth.users', to_column: 'id' }
      ]
    }

    return schema
  }

  // Convert natural language to SQL using OpenAI
  async convertToSQL(naturalLanguageQuery) {
    const systemPrompt = this.buildSystemPrompt()
    
    try {
      const response = await apiConfig.makeChatCompletionRequest(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: naturalLanguageQuery }
        ],
        this.openaiApiKey,
        {
          temperature: 0.1,
          max_tokens: 500
        }
      )

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const result = await response.json()
      const sqlQuery = result.choices[0].message.content.trim()
      
      // Clean up the SQL (remove markdown formatting if present)
      return sqlQuery.replace(/```sql\n?|\n?```/g, '').trim()
    } catch (error) {
      console.error('Error converting to SQL:', error)
      throw error
    }
  }

  // Build system prompt with schema context
  buildSystemPrompt() {
    // Handle both old format (direct table->columns mapping) and new format (structured schema)
    let schemaDescription = ''
    let relationshipsDescription = ''

    if (this.schema && this.schema.tables) {
      // New structured format with detailed column info
      schemaDescription = Object.entries(this.schema.tables)
        .map(([table, columns]) => {
          if (Array.isArray(columns) && columns.length > 0 && typeof columns[0] === 'object') {
            // Detailed column info
            const columnList = columns.map(col => 
              `${col.name} (${col.type}${col.nullable ? ', nullable' : ', required'})`
            ).join(', ')
            return `${table}: ${columnList}`
          } else {
            // Simple column names
            return `${table}: ${Array.isArray(columns) ? columns.join(', ') : 'unknown columns'}`
          }
        })
        .join('\n')

      // Build relationships description dynamically
      if (this.schema.relationships && this.schema.relationships.length > 0) {
        relationshipsDescription = this.schema.relationships
          .map(rel => `- ${rel.from_table}.${rel.from_column} → ${rel.to_table}.${rel.to_column}`)
          .join('\n')
      }
    } else {
      // Fallback to old format
      schemaDescription = Object.entries(this.schema || {})
        .map(([table, columns]) => `${table}: ${Array.isArray(columns) ? columns.join(', ') : 'unknown columns'}`)
        .join('\n')
    }

    const relationshipsSection = relationshipsDescription 
      ? `Table Relationships:\n${relationshipsDescription}\n\n`
      : ''

    return `You are a SQL expert for a farm management system. Convert natural language queries to PostgreSQL SQL queries.

Database Schema:
${schemaDescription}

${relationshipsSection}Farm Management Context:
- breeding_plans: Contains breeding plans for rabbits, including doe and buck references
- rabbits: Contains rabbit information (id, name, status, etc.)
- transfers: Contains transfer information for rabbits between locations

CRITICAL COLUMN NAMES - Use these exact column names:
- breeding_plans.expected_kindle_date (NOT expected_kindling_date)
- breeding_plans.actual_kindle_date (NOT actual_kindling_date)
- breeding_plans.doe_id (female rabbit reference)
- breeding_plans.buck_id (male rabbit reference)
- breeding_plans.plan_id (unique plan identifier)
- breeding_plans.planned_date (planned mating date)
- breeding_plans.actual_mating_date (actual mating date)
- breeding_plans.kits_born (number of baby rabbits born)
- breeding_plans.kits_survived (number surviving)

Rabbit Farming Terminology:

Physiological Terminology:
- Kits: A collection of baby rabbits
- Doe: A female rabbit
- Buck: A male rabbit
- Dam: The mother of a particular rabbit
- Sire: The father of a particular rabbit

Anatomical Terminology:
- Belled ears: Ears that droop, can happen in developing rabbits in hot weather
- Dewlap: Loose skin under the rabbit's chin
- Hock: The first joint on the rabbit's hind leg
- Quick: The sensitive pink part of a rabbit's nails with blood vessels and nerves
- Scut: A rabbit's tail

Breeding Terminology:
- Kindling: The act of a female rabbit giving birth to her babies
- Nest box: A box provided for a pregnant rabbit to nest and give birth
- Foster: Placing newborn rabbits with a different doe to mother them
- Gestation period: Time a doe is pregnant (28-31 days in rabbits)
- Litter: A group of baby rabbits born to the same mother in the same kindling
- Colony raising: Management system raising many rabbits together in one area
- Crossbreed: Breeding two or more breeds of rabbits
- Outcrossing: Breeding two rabbits from unrelated pedigrees
- Palpate: Feeling for developing embryos to check if doe is pregnant

General Terminology:
- Hutch: Housing for rabbits
- Malocclusion: Genetic defect where teeth are misaligned
- Moult: The act of a rabbit shedding fur
- Wool block: Digestive tract blockage caused by fur
- Weaning: Separating rabbit from mother, transitioning from milk to solid food
- Warren: Large fenced area where rabbits can burrow and live
- Rabbitry: A place where rabbits are kept
- Binkies: Rabbit running and jumping into the air
- Carriage: The manner in which the rabbit carries itself
- Chinning: Rabbit marking territory by rubbing scent glands under chin

Rules:
1. Only generate SELECT queries (no INSERT, UPDATE, DELETE)
2. Use proper PostgreSQL syntax
3. Do not Include LIMIT clauses 
4. Use appropriate JOINs when querying multiple tables based on the relationships defined above
5. Handle dates properly (use DATE() functions when needed)
6. Return only the SQL query, no explanations
7. Use table and column names exactly as shown in schema - VERIFY column names match the schema
8. Always use the correct foreign key relationships when joining tables
9. When users mention rabbit terminology (doe, buck, kits, kindling, etc.), translate to appropriate database terms
10. On the breeding_plans we have doe_id and buck_id, so we need to use those when querying the rabbits table to get the doe and buck information
11. ALWAYS use expected_kindle_date NOT expected_kindling_date
12. ALWAYS use actual_kindle_date NOT actual_kindling_date

Examples:
"Show me all rabbits with their breeding plans" → 
  SELECT r.*, bp.* 
  FROM rabbits r 
  LEFT JOIN breeding_plans bp ON r.id = bp.rabbit_id;

"Find all rabbits that have been transferred" → 
  SELECT r.*, t.* 
  FROM rabbits r 
  INNER JOIN transfers t ON r.id = t.rabbit_id;

"Show breeding pairs" → 
  SELECT 
    doe.name as doe_name,
    buck.name as buck_name,
    bp.expected_kindle_date
  FROM breeding_plans bp
  JOIN rabbits doe ON bp.doe_id = doe.id
  JOIN rabbits buck ON bp.buck_id = buck.id;

"Show expected kindle dates" →
  SELECT bp.*, bp.expected_kindle_date 
  FROM breeding_plans bp;`
  }

  // Execute the SQL query against Supabase
  async executeQuery(sqlQuery) {
    try {
      // Basic validation
      if (!sqlQuery.toLowerCase().trim().startsWith('select')) {
        throw new Error('Only SELECT queries are allowed')
      }

      // Execute using Supabase RPC function for raw SQL
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: sqlQuery
      })

      if (error) {
        console.error('Query execution error:', error)
        throw error
      }

      return {
        success: true,
        data: data,
        query: sqlQuery,
        rowCount: data?.length || 0
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        query: sqlQuery
      }
    }
  }

  // Main method: natural language to results
  async query(naturalLanguageQuery) {
    try {
      if (!this.schema) {
        await this.initialize()
      }

      const sqlQuery = await this.convertToSQL(naturalLanguageQuery)
      const result = await this.executeQuery(sqlQuery)

      return {
        ...result,
        originalQuery: naturalLanguageQuery
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        originalQuery: naturalLanguageQuery
      }
    }
  }

  // Helper method for common farm queries
  async getQuickInsights() {
    const insights = []
    
    try {
       // Total Rabbits
      const rabbitsResult = await this.query("How many rabbits do we have?")
      if (rabbitsResult.success) {
        insights.push({ label: "Total Rabbits", value: rabbitsResult.data[0]?.count || 0 })
      }

      // Active rabbits
      const activeResult = await this.query("What rabbits are currently in the breeding program?")
      if (activeResult.success) {
        insights.push({ label: "Active rabbits", value: activeResult.rowCount })
      }

      // This month's expenses
      const expensesResult = await this.query("Total transactions this month")
      if (expensesResult.success) {
        insights.push({ label: "Monthly Expenses", value: expensesResult.data[0]?.total_expenses || 0 })
      } 

    } catch (error) {
      console.error('Error getting insights:', error)
    }

    return insights
  }

  // Format query results in a user-friendly way
  formatResults(result) {
    if (!result.success || !result.data || result.data.length === 0) {
      return result
    }

    const formattedData = result.data.map(row => this.formatRow(row))
    
    return {
      ...result,
      data: formattedData,
      formattedSummary: this.generateSummary(result.data, result.originalQuery),
      displayColumns: this.getDisplayColumns(result.data[0])
    }
  }

  // Format a single row of data
  formatRow(row) {
    const formatted = {}
    
    for (const [key, value] of Object.entries(row)) {
      formatted[key] = {
        raw: value,
        display: this.formatValue(key, value),
        type: this.getValueType(key, value)
      }
    }
    
    return formatted
  }

  // Format individual values based on column name and value type
  formatValue(columnName, value) {
    if (value === null || value === undefined) {
      return '—'
    }

    // Handle specific column patterns
    if (columnName.includes('date')) {
      return this.formatDate(value)
    }
    
    if (columnName.includes('weight')) {
      return `${value} lbs`
    }
    
    if (columnName.includes('price') || columnName.includes('cost') || columnName.includes('amount')) {
      return this.formatCurrency(value)
    }
    
    if (columnName.includes('phone')) {
      return this.formatPhone(value)
    }
    
    if (columnName.includes('email')) {
      return value.toLowerCase()
    }

    // Handle data types
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }

    // Handle specific farm data
    if (columnName === 'gender') {
      return value === 'Male' ? '♂ Male' : value === 'Female' ? '♀ Female' : value
    }
    
    if (columnName === 'status') {
      return this.formatStatus(value)
    }
    
    if (columnName.includes('id') && typeof value === 'string') {
      return value.substring(0, 8) + '...'
    }

    return String(value)
  }

  // Get value type for styling purposes
  getValueType(columnName, value) {
    if (value === null || value === undefined) return 'empty'
    if (columnName.includes('date')) return 'date'
    if (columnName.includes('price') || columnName.includes('cost') || columnName.includes('amount')) return 'currency'
    if (columnName === 'status') return 'status'
    if (columnName === 'gender') return 'gender'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (columnName.includes('id')) return 'id'
    return 'text'
  }

  // Format date values
  formatDate(dateValue) {
    if (!dateValue) return '—'
    
    try {
      const date = new Date(dateValue)
      const today = new Date()
      const diffTime = date.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      
      // Add relative time for dates close to today
      if (Math.abs(diffDays) <= 30) {
        if (diffDays === 0) return `${formatted} (Today)`
        if (diffDays === 1) return `${formatted} (Tomorrow)`
        if (diffDays === -1) return `${formatted} (Yesterday)`
        if (diffDays > 0) return `${formatted} (in ${diffDays} days)`
        if (diffDays < 0) return `${formatted} (${Math.abs(diffDays)} days ago)`
      }
      
      return formatted
    } catch (e) {
      return String(dateValue)
    }
  }

  // Format currency values
  formatCurrency(value) {
    if (typeof value !== 'number') return String(value)
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  // Format phone numbers
  formatPhone(phone) {
    if (!phone) return '—'
    
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  // Format status with visual indicators
  formatStatus(status) {
    const statusMap = {
      'Active': '🟢 Active',
      'Inactive': '🔴 Inactive',
      'Planned': '📅 Planned',
      'Completed': '✅ Completed',
      'Failed': '❌ Failed',
      'Cancelled': '🚫 Cancelled',
      'Breeding': '🐰 Breeding',
      'Growing': '🌱 Growing',
      'Retired': '🏖️ Retired'
    }
    
    return statusMap[status] || status
  }

  // Generate a summary of the results
  generateSummary(data, originalQuery) {
    const rowCount = data.length
    const tableName = this.guessTableFromQuery(originalQuery)
    
    if (rowCount === 0) {
      return `No ${tableName} found matching your query.`
    }
    
    if (rowCount === 1) {
      return `Found 1 ${tableName.slice(0, -1)} matching your query.`
    }
    
    return `Found ${rowCount} ${tableName} matching your query.`
  }

  // Guess the main table from the query for better summary
  guessTableFromQuery(query) {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('rabbit')) return 'rabbits'
    if (lowerQuery.includes('breeding') || lowerQuery.includes('plan')) return 'breeding plans'
    if (lowerQuery.includes('transaction') || lowerQuery.includes('expense') || lowerQuery.includes('cost')) return 'transactions'
    if (lowerQuery.includes('feed')) return 'feeding records'
    if (lowerQuery.includes('transfer')) return 'transfers'
    
    return 'records'
  }

  // Get display-friendly column configuration
  getDisplayColumns(sampleRow) {
    if (!sampleRow) return []
    
    return Object.keys(sampleRow).map(key => ({
      key,
      label: this.formatColumnLabel(key),
      sortable: !key.includes('notes') && !key.includes('description'),
      width: this.getColumnWidth(key)
    }))
  }

  // Format column labels for display
  formatColumnLabel(columnName) {
    // Handle specific columns
    const labelMap = {
      'rabbit_id': 'Rabbit ID',
      'plan_id': 'Plan ID',
      'doe_id': 'Doe',
      'buck_id': 'Buck',
      'expected_kindle_date': 'Expected Kindle',
      'actual_kindle_date': 'Actual Kindle',
      'planned_date': 'Planned Date',
      'actual_mating_date': 'Actual Mating',
      'kits_born': 'Kits Born',
      'kits_survived': 'Kits Survived',
      'date_of_birth': 'Date of Birth',
      'cage_number': 'Cage',
      'created_at': 'Created',
      'updated_at': 'Updated',
      'created_by': 'Created By'
    }
    
    if (labelMap[columnName]) {
      return labelMap[columnName]
    }
    
    // Convert snake_case to Title Case
    return columnName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Suggest column widths based on content type
  getColumnWidth(columnName) {
    if (columnName.includes('id')) return 'narrow'
    if (columnName.includes('date')) return 'medium'
    if (columnName.includes('notes') || columnName.includes('description')) return 'wide'
    if (columnName === 'name') return 'medium'
    return 'auto'
  }

  // Enhanced query method that includes formatting
  async queryFormatted(naturalLanguageQuery) {
    const result = await this.query(naturalLanguageQuery)
    return this.formatResults(result)
  }

  // Fallback formatting for already processed results
  ensureFormatted(result) {
    if (!result.success || !result.data || result.data.length === 0) {
      return result
    }

    // Check if data is already formatted (has .display properties)
    const firstRow = result.data[0]
    const isAlreadyFormatted = firstRow && typeof firstRow === 'object' && 
      Object.values(firstRow).some(val => val && typeof val === 'object' && val.display !== undefined)

    if (isAlreadyFormatted) {
      return result
    }

    // If not formatted, apply formatting
    return this.formatResults(result)
  }
}

export default NaturalLanguageQueryService 