import { createClient } from '@supabase/supabase-js';

class SqlAgent {
  constructor(supabaseUrl, supabaseKey, openaiApiKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openaiApiKey = openaiApiKey;
    this.schema = null;
    
    console.log('SqlAgent - API key:', openaiApiKey ? 'Present' : 'Missing');
  }

  async initialize() {
    try {
      this.schema = await this.getSchemaInfo();
    } catch (error) {
      console.error('Failed to load schema:', error);
      throw error;
    }
  }

  async processQuery(query) {
    try {
      if (!this.schema) {
        await this.initialize();
      }

      const sqlQuery = await this.convertToSQL(query);
      const result = await this.executeQuery(sqlQuery);

      return {
        ...result,
        originalQuery: query,
        agent: 'sql'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        originalQuery: query,
        agent: 'sql'
      };
    }
  }

  // Get database schema information (copied from original service)
  async getSchemaInfo() {
    try {
      // Try to get comprehensive schema info including relationships
      const { data: schemaData, error: schemaError } = await this.supabase
        .rpc('get_schema_info')
        .select();

      if (!schemaError && schemaData) {
        return schemaData;
      }
    } catch (e) {
      console.warn('Custom schema function not available, using fallback');
    }

    // Enhanced fallback: get detailed table info and relationships
    const tableNames = ['breeding_plans', 'rabbits', 'transfers', 'transactions', 'feed_records', 'feeding_schedules'];
    const schema = {
      tables: {},
      relationships: []
    };
    
    // Get detailed table columns using information_schema
    for (const tableName of tableNames) {
      try {
        // First try to get column info from information_schema
        const { data: columnInfo, error: columnError } = await this.supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', tableName)
          .eq('table_schema', 'public')
          .order('ordinal_position');

        if (!columnError && columnInfo && columnInfo.length > 0) {
          schema.tables[tableName] = columnInfo.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES'
          }));
        } else {
          // Fallback: try to get from actual data
          const { data, error } = await this.supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!error && data) {
            schema.tables[tableName] = Object.keys(data[0] || {}).map(col => ({
              name: col,
              type: 'unknown',
              nullable: true
            }));
          }
        }
      } catch (e) {
        console.warn(`Could not fetch schema for ${tableName}`);
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
          ];
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
        .not('referenced_table_name', 'is', null);

      if (!relError && relationships) {
        schema.relationships = relationships.map(rel => ({
          from_table: rel.table_name,
          from_column: rel.column_name,
          to_table: rel.referenced_table_name,
          to_column: rel.referenced_column_name
        }));
      }
    } catch (e) {
      console.warn('Could not fetch foreign key relationships');
      // Provide comprehensive known relationships as fallback
      schema.relationships = [
        { from_table: 'breeding_plans', from_column: 'doe_id', to_table: 'rabbits', to_column: 'id' },
        { from_table: 'breeding_plans', from_column: 'buck_id', to_table: 'rabbits', to_column: 'id' },
        { from_table: 'transfers', from_column: 'rabbit_id', to_table: 'rabbits', to_column: 'id' },
        { from_table: 'feed_records', from_column: 'rabbit_id', to_table: 'rabbits', to_column: 'id' },
        { from_table: 'feeding_schedules', from_column: 'user_id', to_table: 'auth.users', to_column: 'id' }
      ];
    }

    return schema;
  }

  // Convert natural language to SQL using pattern matching or OpenAI
  async convertToSQL(naturalLanguageQuery) {
    try {
      // Get current user for filtering
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Try OpenAI first if available
      if (this.openaiApiKey) {
        try {
          return await this.convertToSQLWithOpenAI(naturalLanguageQuery);
        } catch (openaiError) {
          console.warn('OpenAI conversion failed, falling back to pattern matching:', openaiError.message);
        }
      }

      // Fallback to pattern matching
      return this.convertToSQLWithPatterns(naturalLanguageQuery);
    } catch (error) {
      console.error('Error converting to SQL:', error);
      throw error;
    }
  }

  // Convert using OpenAI API
  async convertToSQLWithOpenAI(naturalLanguageQuery) {
    const systemPrompt = this.buildSystemPrompt();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: naturalLanguageQuery }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const rawSqlResponse = result.choices[0].message.content.trim();
    console.log('SqlAgent: Raw OpenAI response:', rawSqlResponse);
    
    // Clean up the SQL (remove markdown formatting if present)
    let cleanedSql = rawSqlResponse.replace(/```sql\n?|\n?```/g, '').trim();
    console.log('SqlAgent: Cleaned SQL query:', cleanedSql);
    
    return cleanedSql;
  }

  // Convert using pattern matching
  convertToSQLWithPatterns(naturalLanguageQuery) {
    const query = naturalLanguageQuery.toLowerCase();
    console.log('SqlAgent: Using pattern matching for query:', query);

    // Define patterns for common queries
    const patterns = [
      {
        pattern: /(show|list|get|display|find).*?(all\s+)?(rabbit|bunny|bunnies)/i,
        sql: 'SELECT * FROM rabbits'
      },
      {
        pattern: /(show|list|get|display|find).*?(all\s+)?(breeding|breed|mating)/i,
        sql: 'SELECT * FROM breeding_plans'
      },
      {
        pattern: /(show|list|get|display|find).*?(all\s+)?(transaction|expense|cost|money)/i,
        sql: 'SELECT * FROM transactions'
      },
      {
        pattern: /(show|list|get|display|find).*?(all\s+)?(health|medical|vet)/i,
        sql: 'SELECT * FROM health_records'
      },
      {
        pattern: /(show|list|get|display|find).*?(all\s+)?(weight|weigh)/i,
        sql: 'SELECT * FROM weight_records'
      },
      {
        pattern: /(show|list|get|display|find).*?(all\s+)?(schedule|event|task)/i,
        sql: 'SELECT * FROM schedule_events'
      },
      {
        pattern: /(show|list|get|display|find).*?(all\s+)?(kit|baby|young)/i,
        sql: 'SELECT * FROM kit_records'
      },
      {
        pattern: /(count|how many).*?(rabbit|bunny|bunnies)/i,
        sql: 'SELECT COUNT(*) FROM rabbits'
      },
      {
        pattern: /(count|how many).*?(breeding|breed|mating)/i,
        sql: 'SELECT COUNT(*) FROM breeding_plans'
      },
      {
        pattern: /(count|how many).*?(transaction|expense)/i,
        sql: 'SELECT COUNT(*) FROM transactions'
      }
    ];

    // Find matching pattern
    for (const { pattern, sql } of patterns) {
      if (pattern.test(query)) {
        console.log('SqlAgent: Pattern matched, generated SQL:', sql);
        return sql;
      }
    }

    // Default fallback - try to extract table name from query
    const tableNames = ['rabbits', 'breeding_plans', 'transactions', 'health_records', 'weight_records', 'schedule_events', 'kit_records'];
    for (const table of tableNames) {
      if (query.includes(table.replace('_', ' ')) || query.includes(table)) {
        const sql = `SELECT * FROM ${table}`;
        console.log('SqlAgent: Table name extracted, generated SQL:', sql);
        return sql;
      }
    }

    // Ultimate fallback
    console.log('SqlAgent: No pattern matched, using default query');
    return 'SELECT * FROM rabbits';
  }



  // Build system prompt with schema context (copied from original service)
  buildSystemPrompt() {
    // Handle both old format (direct table->columns mapping) and new format (structured schema)
    let schemaDescription = '';
    let relationshipsDescription = '';

    if (this.schema && this.schema.tables) {
      // New structured format with detailed column info
      schemaDescription = Object.entries(this.schema.tables)
        .map(([table, columns]) => {
          if (Array.isArray(columns) && columns.length > 0 && typeof columns[0] === 'object') {
            // Detailed column info
            const columnList = columns.map(col => 
              `${col.name} (${col.type}${col.nullable ? ', nullable' : ', required'})`
            ).join(', ');
            return `${table}: ${columnList}`;
          } else {
            // Simple column names
            return `${table}: ${Array.isArray(columns) ? columns.join(', ') : 'unknown columns'}`;
          }
        })
        .join('\n');

      // Build relationships description dynamically
      if (this.schema.relationships && this.schema.relationships.length > 0) {
        relationshipsDescription = this.schema.relationships
          .map(rel => `- ${rel.from_table}.${rel.from_column} → ${rel.to_table}.${rel.to_column}`)
          .join('\n');
      }
    } else {
      // Fallback to old format
      schemaDescription = Object.entries(this.schema || {})
        .map(([table, columns]) => `${table}: ${Array.isArray(columns) ? columns.join(', ') : 'unknown columns'}`)
        .join('\n');
    }

    const relationshipsSection = relationshipsDescription 
      ? `Table Relationships:\n${relationshipsDescription}\n\n`
      : '';

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

Breeding Terminology:
- Kindling: The act of a female rabbit giving birth to her babies
- Nest box: A box provided for a pregnant rabbit to nest and give birth
- Foster: Placing newborn rabbits with a different doe to mother them
- Gestation period: Time a doe is pregnant (28-31 days in rabbits)
- Litter: A group of baby rabbits born to the same mother in the same kindling

IMPORTANT: This is a multi-tenant system where each user can only see their own data. The system uses Row Level Security (RLS) policies to automatically filter data by user, so you do NOT need to include user filtering conditions in your SQL. Just write the basic query as if you're querying all data.

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
13. DO NOT include user filtering conditions - RLS policies handle this automatically
14. Keep queries simple - the system will extract the table name and use the query builder`;
  }

  // Execute the SQL query against Supabase using query builder
  async executeQuery(sqlQuery) {
    try {
      console.log('SqlAgent: Generated SQL query:', sqlQuery);
      
      // Basic validation
      if (!sqlQuery.toLowerCase().trim().startsWith('select')) {
        console.error('SqlAgent: Query validation failed - not a SELECT query');
        throw new Error('Only SELECT queries are allowed');
      }

      // Parse the SQL to determine which table to query
      const tableName = this.extractTableName(sqlQuery);
      if (!tableName) {
        throw new Error('Could not determine table name from query');
      }

      console.log('SqlAgent: Extracted table name:', tableName);

      // Get current user to ensure RLS policies are applied
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('SqlAgent: Current user ID:', user.id);

      // Use Supabase query builder with explicit user filtering to ensure RLS policies are applied
      let query = this.supabase.from(tableName).select('*');
      
      // Add explicit user filtering based on table structure
      if (tableName === 'rabbits' || tableName === 'breeding_plans' || tableName === 'kit_records' || tableName === 'kit_health_records') {
        query = query.eq('created_by', user.id).eq('is_deleted', false);
      } else if (tableName === 'transactions' || tableName === 'health_records' || tableName === 'weight_records' || tableName === 'schedule_events') {
        query = query.eq('user_id', user.id).eq('is_deleted', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Query execution error:', error);
        throw error;
      }

      console.log('SqlAgent: Query builder result:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: data?.length,
        firstItem: data?.[0],
        firstItemKeys: data?.[0] ? Object.keys(data[0]) : 'No keys',
        userFilterApplied: true
      });

      const result = {
        success: true,
        data: data,
        query: sqlQuery,
        rowCount: data?.length || 0
      };
      
      console.log('SqlAgent: Final result object:', result);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        query: sqlQuery
      };
    }
  }

  // Extract table name from SQL query
  extractTableName(sqlQuery) {
    const upperQuery = sqlQuery.toUpperCase();
    
    // Simple regex to extract table name from SELECT ... FROM table
    const fromMatch = upperQuery.match(/FROM\s+(\w+)/);
    if (fromMatch) {
      return fromMatch[1].toLowerCase();
    }
    
    // Check for common table names
    const tableNames = ['rabbits', 'breeding_plans', 'transactions', 'health_records', 'weight_records', 'schedule_events', 'kit_records', 'kit_health_records'];
    for (const table of tableNames) {
      if (upperQuery.includes(table.toUpperCase())) {
        return table;
      }
    }
    
    return null;
  }

  // Future enhancement: Use LangChain SQL Toolkit for more advanced SQL operations
  async processQueryWithSqlToolkit(query) {
    // For future implementation with LangChain SQL Toolkit:
    // Note: SQL Toolkit requires additional setup and TypeORM dependencies
    console.log('SQL Toolkit not yet implemented');
    console.log('Query:', query);
    
    // For now, use the standard processQuery method
    return await this.processQuery(query);
  }
}

export default SqlAgent; 