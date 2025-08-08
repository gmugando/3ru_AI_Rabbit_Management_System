import { createClient } from '@supabase/supabase-js';
import apiConfig from '@/utils/apiConfig.js';

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

  // Convert natural language to SQL using LangChain
  async convertToSQL(naturalLanguageQuery) {
    try {
      const systemPrompt = this.buildSystemPrompt();
      
      // Use the centralized API configuration
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
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      const rawSqlResponse = result.choices[0].message.content.trim();
      console.log('SqlAgent: Raw OpenAI response:', rawSqlResponse);
      
      // Clean up the SQL (remove markdown formatting if present)
      const cleanedSql = rawSqlResponse.replace(/```sql\n?|\n?```/g, '').trim();
      console.log('SqlAgent: Cleaned SQL query:', cleanedSql);
      
      return cleanedSql;
    } catch (error) {
      console.error('Error converting to SQL:', error);
      throw error;
    }
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
12. ALWAYS use actual_kindle_date NOT actual_kindling_date`;
  }

  // Execute the SQL query against Supabase
  async executeQuery(sqlQuery) {
    try {
      console.log('SqlAgent: Generated SQL query:', sqlQuery);
      console.log('SqlAgent: Query validation check:', {
        query: sqlQuery,
        trimmed: sqlQuery.trim(),
        lowercase: sqlQuery.toLowerCase().trim(),
        startsWithSelect: sqlQuery.toLowerCase().trim().startsWith('select')
      });
      
      // Basic validation
      if (!sqlQuery.toLowerCase().trim().startsWith('select')) {
        console.error('SqlAgent: Query validation failed - not a SELECT query');
        throw new Error('Only SELECT queries are allowed');
      }

      // Execute using Supabase RPC function for raw SQL
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: sqlQuery
      });

      if (error) {
        console.error('Query execution error:', error);
        throw error;
      }

      console.log('SqlAgent: Raw SQL result:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: data?.length,
        firstItem: data?.[0],
        firstItemKeys: data?.[0] ? Object.keys(data[0]) : 'No keys'
      });

      return {
        success: true,
        data: data,
        query: sqlQuery,
        rowCount: data?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        query: sqlQuery
      };
    }
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