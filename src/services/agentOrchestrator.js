import RouterAgent from './agents/routerAgent.js';
import SqlAgent from './agents/sqlAgent.js';
import PdfAgent from './agents/pdfAgent.js';
import WeatherAgent from './agents/weatherAgent.js';
import { createClient } from '@supabase/supabase-js';

// Shared Context for agent communication
class AgentContext {
  constructor() {
    this.sharedData = new Map();
    this.agentResults = new Map();
    this.metadata = new Map();
  }

  setData(key, value) {
    this.sharedData.set(key, value);
  }

  getData(key) {
    return this.sharedData.get(key);
  }

  setAgentResult(agentName, result) {
    this.agentResults.set(agentName, result);
  }

  getAgentResult(agentName) {
    return this.agentResults.get(agentName);
  }

  setMetadata(key, value) {
    this.metadata.set(key, value);
  }

  getMetadata(key) {
    return this.metadata.get(key);
  }

  getAllData() {
    return {
      sharedData: Object.fromEntries(this.sharedData),
      agentResults: Object.fromEntries(this.agentResults),
      metadata: Object.fromEntries(this.metadata)
    };
  }
}

class FarmManagementOrchestrator {
  constructor(supabaseUrl, supabaseKey, openaiApiKey, weatherApiKey = null, defaultLocation = 'Denver, CO') {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.openaiApiKey = openaiApiKey;
    this.weatherApiKey = weatherApiKey;
    this.defaultLocation = defaultLocation;
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.userPreferences = null;
    
    // Debug API key
    console.log('Initializing orchestrator with API keys:', {
      openai: openaiApiKey ? 'Present' : 'Missing',
      weather: weatherApiKey ? 'Present' : 'Missing',
      defaultLocation: defaultLocation
    });
    
    // Initialize router
    this.routerAgent = new RouterAgent(openaiApiKey);
    
    // Agent registry - dynamic system for easy addition of agents
    this.agents = new Map();
    this.registerAgent('sql', new SqlAgent(supabaseUrl, supabaseKey, openaiApiKey));
    this.registerAgent('pdf', new PdfAgent(openaiApiKey, supabaseUrl, supabaseKey));
    
    // Initialize weather agent with default preferences (will be updated when user preferences are loaded)
    this.registerAgent('weather', new WeatherAgent(openaiApiKey, weatherApiKey, defaultLocation, null));
    
    // Shared context for agent communication
    this.context = new AgentContext();

    // Agent dependencies - which agents need data from other agents
    this.agentDependencies = {
      'weather': ['sql'], // Weather agent can use SQL results for date-specific forecasts
      'pdf': [] // PDF agent is independent
    };
  }

  async initialize() {
    try {
      // Load user preferences first
      await this.loadUserPreferences();
      
      // Initialize all agents that need async initialization
      const initPromises = [];
      
      for (const [name, agent] of this.agents) {
        if (agent.initialize && typeof agent.initialize === 'function') {
          console.log(`Initializing ${name} agent...`);
          initPromises.push(agent.initialize());
        }
      }
      
      await Promise.all(initPromises);
      console.log('Farm Management Orchestrator initialized successfully');
    } catch (error) {
      console.error('Failed to initialize orchestrator:', error);
      throw error;
    }
  }

  async loadUserPreferences() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        console.log('Orchestrator: No user logged in, using default preferences');
        return;
      }

      // Use the get_user_preferences function which returns existing prefs or creates defaults
      const { data, error } = await this.supabase.rpc('get_user_preferences', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Orchestrator: Error loading user preferences:', error);
        return;
      }

      if (data && data.length > 0) {
        this.userPreferences = data[0];
        console.log('Orchestrator: Loaded user preferences:', {
          farmLocation: this.userPreferences.farm_location,
          temperatureUnit: this.userPreferences.temperature_unit,
          hasWeatherApiKey: !!this.userPreferences.weather_api_key
        });

        // Update weather agent with user preferences
        this.updateWeatherAgentWithPreferences();
      }
    } catch (error) {
      console.error('Orchestrator: Error loading user preferences:', error);
    }
  }

  updateWeatherAgentWithPreferences() {
    if (!this.userPreferences) return;

    // Use user's farm location or fall back to default
    const farmLocation = this.userPreferences.farm_location || this.defaultLocation;
    
    // Use user's weather API key if provided, otherwise use system key
    const weatherApiKey = this.userPreferences.weather_api_key || this.weatherApiKey;

    // Re-register weather agent with updated preferences
    console.log('Orchestrator: Updating weather agent with preferences:', {
      farmLocation,
      temperatureUnit: this.userPreferences.temperature_unit,
      hasUserApiKey: !!this.userPreferences.weather_api_key
    });
    
    this.registerAgent('weather', new WeatherAgent(this.openaiApiKey, weatherApiKey, farmLocation, this.userPreferences));
  }

  // Register a new agent in the system
  registerAgent(name, agentInstance) {
    this.agents.set(name.toLowerCase(), agentInstance);
    // Also register with router for query classification
    this.routerAgent.registerAgent(name, agentInstance.description || `${name} agent`);
    console.log(`Orchestrator: Registered agent '${name}'`);
  }

  async query(naturalLanguageQuery) {
    try {
      console.log('Orchestrator: Starting dynamic query processing:', naturalLanguageQuery);
      
      // Reset context for new query
      this.context = new AgentContext();
      this.context.setMetadata('originalQuery', naturalLanguageQuery);
      
      // Step 1: Get agent selection from router
      const selectedAgents = await this.routerAgent.selectAgents(naturalLanguageQuery);
      console.log('Orchestrator: Router selected agents:', selectedAgents);
      this.context.setMetadata('selectedAgents', selectedAgents);
      
      // Step 2: Execute agents in dependency order
      const executionResults = await this.executeAgentsPipeline(selectedAgents, naturalLanguageQuery);
      
      // Step 3: Combine results dynamically
      const finalResult = this.combineAgentResults(selectedAgents, executionResults, naturalLanguageQuery);
      
      console.log('Orchestrator: Final result prepared:', {
        success: finalResult.success,
        agentsUsed: selectedAgents,
        hasData: !!finalResult.data
      });
      
      return finalResult;
      
    } catch (error) {
      console.error('Orchestrator query error:', error);
      return {
        success: false,
        error: error.message,
        originalQuery: naturalLanguageQuery,
        agent: 'orchestrator'
      };
    }
  }

  async executeAgentsPipeline(selectedAgents, query) {
    const results = new Map();
    const executionOrder = this.determineExecutionOrder(selectedAgents);
    
    console.log('Orchestrator: Execution order:', executionOrder);
    
    for (const agentName of executionOrder) {
      try {
        console.log(`Orchestrator: Executing ${agentName} agent`);
        
        const agent = this.agents.get(agentName);
        if (!agent) {
          console.error(`Agent '${agentName}' not found in registry`);
          continue;
        }
        
        // Prepare enhanced query with context from previous agents
        const enhancedQuery = await this.enhanceQueryWithContext(query, agentName, results);
        
        console.log(`Orchestrator: Executing ${agentName} with query:`, enhancedQuery);
        
        // Execute agent
        const result = await agent.processQuery(enhancedQuery).catch(err => ({
          success: false,
          error: err.message,
          agent: agentName
        }));
        
        result.agent = agentName; // Ensure agent name is set
        results.set(agentName, result);
        this.context.setAgentResult(agentName, result);
        
        console.log(`Orchestrator: ${agentName} agent completed:`, { 
          success: result.success, 
          hasData: !!result.data,
          error: result.error,
          dataLength: result.data?.length,
          rowCount: result.rowCount
        });
        
        // Note: Date extraction will happen after formatting in combineAgentResults
        
      } catch (error) {
        console.error(`Error executing ${agentName} agent:`, error);
        results.set(agentName, {
          success: false,
          error: error.message,
          agent: agentName
        });
      }
    }
    
    return results;
  }

  determineExecutionOrder(selectedAgents) {
    // Sort agents by dependencies (dependencies first)
    const ordered = [];
    const remaining = [...selectedAgents];
    
    // Add agents with no dependencies first
    const independentAgents = remaining.filter(agent => 
      !this.agentDependencies[agent] || this.agentDependencies[agent].length === 0
    );
    ordered.push(...independentAgents);
    remaining.splice(0, remaining.length, ...remaining.filter(a => !independentAgents.includes(a)));
    
    // Add remaining agents (those with dependencies)
    ordered.push(...remaining);
    
    return ordered;
  }

  async enhanceQueryWithContext(originalQuery, agentName, previousResults) {
    // If this agent has dependencies, enhance the query with context
    const dependencies = this.agentDependencies[agentName] || [];
    
    if (dependencies.length === 0 || previousResults.size === 0) {
      // No dependencies - decompose the original query for this agent
      return await this.decomposeQueryForAgent(originalQuery, agentName);
    }
    
    // Special handling for weather agent that depends on SQL
    if (agentName === 'weather' && previousResults.has('sql')) {
      return this.enhanceWeatherQueryWithSqlContext(originalQuery);
    }
    
    return await this.decomposeQueryForAgent(originalQuery, agentName);
  }

  async decomposeQueryForAgent(originalQuery, agentName) {
    try {
      console.log(`Orchestrator: Decomposing query for ${agentName} agent`);
      
      // Use OpenAI to decompose the query into agent-specific parts
      const systemPrompt = `You are a query decomposer for a multi-agent farm management system. Break down complex queries into agent-specific sub-queries.

AGENT CAPABILITIES:
- sql: Database queries about rabbits, breeding plans, transactions, feeding schedules (NO weather data)
- pdf: Document analysis and rabbit care knowledge
- weather: Weather forecasts and climate analysis (NO database data)

YOUR TASK: Extract only the part of the query that the specified agent can handle.

EXAMPLES:
Original: "Which does are expected to kindle next month? For each one, list the expected kindle date and the forecasted temperature on that date"
→ sql: "Which does are expected to kindle next month? For each one, list the expected kindle date"
→ weather: "Get weather forecast and temperature information"

Original: "Show me breeding plans and tell me if the weather will be good for outdoor activities"
→ sql: "Show me breeding plans"
→ weather: "Will the weather be good for outdoor activities"

Original: "How many rabbits do we have and what does the manual say about optimal housing?"
→ sql: "How many rabbits do we have"
→ pdf: "What does the manual say about optimal housing"

RULES:
1. Return ONLY the part relevant to the specified agent
2. Remove any cross-agent requirements (e.g., remove weather from SQL queries)
3. Keep the query natural and complete for that agent
4. If the original query has no relevant part for this agent, return a related fallback query`;

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
            { role: 'user', content: `Original query: "${originalQuery}"\nAgent: ${agentName}\n\nDecompose this query for the ${agentName} agent:` }
          ],
          temperature: 0.1,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        console.log(`Orchestrator: Query decomposition failed for ${agentName}, using original query`);
        return originalQuery;
      }

      const result = await response.json();
      const decomposedQuery = result.choices[0].message.content.trim();
      
      console.log(`Orchestrator: Query decomposed for ${agentName}:`, {
        original: originalQuery,
        decomposed: decomposedQuery
      });
      
      return decomposedQuery;
      
    } catch (error) {
      console.error(`Error decomposing query for ${agentName}:`, error);
      return originalQuery; // Fallback to original
    }
  }

  enhanceWeatherQueryWithSqlContext(originalQuery) {
    const extractedData = this.context.getData('extractedData');
    
    console.log('Orchestrator: enhanceWeatherQueryWithSqlContext called with:', {
      hasExtractedData: !!extractedData,
      datesCount: extractedData?.dates?.length || 0,
      dates: extractedData?.dates,
      entitiesCount: extractedData?.entities?.length || 0
    });
    
    if (!extractedData || !extractedData.dates || extractedData.dates.length === 0) {
      console.log('Orchestrator: No dates found for weather enhancement, using original query');
      return originalQuery;
    }
    
    const dateStrings = extractedData.dates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }).join(', ');
    
    const enhancedQuery = `Weather forecast for these specific dates: ${dateStrings}. Context: ${originalQuery}`;
    console.log('Orchestrator: Enhanced weather query:', enhancedQuery);
    return enhancedQuery;
  }

  extractStructuredDataFromFormattedSql(formattedSqlResult) {
    console.log('Orchestrator: extractStructuredDataFromFormattedSql called with:', {
      success: formattedSqlResult.success,
      hasData: !!formattedSqlResult.data,
      dataLength: formattedSqlResult.data?.length,
      firstRow: formattedSqlResult.data?.[0]
    });
    
    if (!formattedSqlResult.success || !formattedSqlResult.data) {
      console.log('Orchestrator: No valid formatted SQL data to extract from');
      return { dates: [], entities: [] };
    }

    const dates = new Set();
    const entities = [];
    const dateColumns = ['expected_kindle_date', 'actual_kindle_date', 'planned_date', 'actual_mating_date', 'date', 'scheduled_date'];
    
    formattedSqlResult.data.forEach((row, index) => {
      console.log(`Orchestrator: Processing formatted row ${index}:`, {
        rowType: typeof row,
        rowKeys: Object.keys(row),
        sampleColumn: Object.keys(row)[0] ? row[Object.keys(row)[0]] : 'No columns'
      });
      
      const entity = { rowIndex: index, dates: [], data: row };
      
      dateColumns.forEach(column => {
        let dateValue = null;
        
        // Check if the row has this column and it's formatted properly
        if (row[column] && typeof row[column] === 'object' && row[column].raw !== undefined) {
          dateValue = row[column].raw;
          console.log(`Orchestrator: Found formatted date in ${column}:`, dateValue);
        }
        
        if (dateValue && dateValue !== null && dateValue !== '') {
          dates.add(dateValue);
          entity.dates.push({ column, date: dateValue });
        }
      });
      
      if (entity.dates.length > 0) {
        entities.push(entity);
        console.log(`Orchestrator: Added entity for row ${index} with ${entity.dates.length} dates`);
      }
    });
    
    const result = {
      dates: Array.from(dates).slice(0, 10), // Limit dates
      entities: entities,
      totalRows: formattedSqlResult.data.length
    };
    
    console.log('Orchestrator: Final extracted data from formatted SQL:', result);
    return result;
  }

  extractStructuredDataFromSql(sqlResult) {
    console.log('Orchestrator: extractStructuredDataFromSql called with:', {
      success: sqlResult.success,
      hasData: !!sqlResult.data,
      dataLength: sqlResult.data?.length,
      dataType: typeof sqlResult.data,
      firstRow: sqlResult.data?.[0]
    });
    
    if (!sqlResult.success || !sqlResult.data) {
      console.log('Orchestrator: No valid SQL data to extract from');
      return { dates: [], entities: [] };
    }

    const dates = new Set();
    const entities = [];
    const dateColumns = ['expected_kindle_date', 'actual_kindle_date', 'planned_date', 'actual_mating_date', 'date', 'scheduled_date'];
    
    sqlResult.data.forEach((row, index) => {
      console.log(`Orchestrator: Processing row ${index}:`, {
        rowType: typeof row,
        rowKeys: Object.keys(row),
        hasRawProperty: 'raw' in Object.values(row)[0] || {}
      });
      
      const entity = { rowIndex: index, dates: [], data: row };
      
      dateColumns.forEach(column => {
        let dateValue = null;
        
        // Check if the row has formatted data (with .raw property)
        if (row[column] && typeof row[column] === 'object' && row[column].raw !== undefined) {
          dateValue = row[column].raw;
          console.log(`Orchestrator: Found formatted date in ${column}:`, dateValue);
        } else if (row[column]) {
          dateValue = row[column];
          console.log(`Orchestrator: Found direct date in ${column}:`, dateValue);
        }
        
        if (dateValue && dateValue !== null && dateValue !== '') {
          dates.add(dateValue);
          entity.dates.push({ column, date: dateValue });
        }
      });
      
      if (entity.dates.length > 0) {
        entities.push(entity);
        console.log(`Orchestrator: Added entity for row ${index} with ${entity.dates.length} dates`);
      }
    });
    
    const result = {
      dates: Array.from(dates).slice(0, 10), // Limit dates
      entities: entities,
      totalRows: sqlResult.data.length
    };
    
    console.log('Orchestrator: Final extracted data:', result);
    return result;
  }

  combineAgentResults(selectedAgents, executionResults, originalQuery) {
    console.log('Orchestrator: Combining results from agents:', selectedAgents);
    
    const successfulResults = Array.from(executionResults.values()).filter(r => r.success);
    const failedResults = Array.from(executionResults.values()).filter(r => !r.success);
    
    if (successfulResults.length === 0) {
      return {
        success: false,
        error: 'All agents failed to process the query',
        originalQuery: originalQuery,
        agentsUsed: selectedAgents,
        failedAgents: failedResults.map(r => ({ agent: r.agent, error: r.error }))
      };
    }
    
    // Start with base result structure
    let combinedResult = {
      success: true,
      originalQuery: originalQuery,
      agentsUsed: selectedAgents,
      combinedSummary: this.generateDynamicSummary(selectedAgents, executionResults)
    };
    
    // Add specific agent results
    if (executionResults.has('sql')) {
      const sqlResult = executionResults.get('sql');
      if (sqlResult.success) {
        const formattedSqlResult = this.formatSqlResults(sqlResult);
        combinedResult.sqlData = formattedSqlResult;
        combinedResult.data = formattedSqlResult.data || [];
        combinedResult.displayColumns = formattedSqlResult.displayColumns || [];
        
        // Extract dates from formatted data for weather enhancement
        const extractedData = this.extractStructuredDataFromFormattedSql(formattedSqlResult);
        this.context.setData('extractedData', extractedData);
        console.log('Orchestrator: Extracted structured data from formatted SQL:', extractedData);
      }
    }
    
    if (executionResults.has('weather')) {
      const weatherResult = executionResults.get('weather');
      if (weatherResult.success) {
        // Only include weather data if it's meaningful for this query
        const shouldIncludeWeather = this.shouldDisplayWeatherWidget(originalQuery, selectedAgents);
        
        if (shouldIncludeWeather) {
          combinedResult.weatherData = weatherResult;
          combinedResult.weather = weatherResult.weather;
          combinedResult.analysis = weatherResult.analysis;
          combinedResult.recommendations = weatherResult.recommendations;
          combinedResult.location = weatherResult.location;
        }
        
        console.log('Orchestrator: Weather inclusion decision:', {
          weatherSuccess: weatherResult.success,
          shouldInclude: shouldIncludeWeather,
          reason: shouldIncludeWeather ? 'Weather relevant to query' : 'Weather not needed for this query'
        });
      }
    }
    
    if (executionResults.has('pdf')) {
      const pdfResult = executionResults.get('pdf');
      if (pdfResult.success) {
        combinedResult.pdfInsights = pdfResult;
        combinedResult.answer = pdfResult.answer;
        combinedResult.sources = pdfResult.sources;
      }
    }
    
    // Special handling for SQL + Weather combination (merge data)
    if (executionResults.has('sql') && executionResults.has('weather')) {
      combinedResult = this.enhanceSqlWeatherCombination(combinedResult, executionResults);
    }
    
    // Add failed agents info if any
    if (failedResults.length > 0) {
      combinedResult.warnings = failedResults.map(r => `${r.agent} agent failed: ${r.error}`);
    }
    
    return combinedResult;
  }

  enhanceSqlWeatherCombination(combinedResult, executionResults) {
    const sqlResult = executionResults.get('sql');
    const weatherResult = executionResults.get('weather');
    const extractedData = this.context.getData('extractedData');
    
    console.log('Orchestrator: Enhancing SQL-Weather combination:', {
      sqlSuccess: sqlResult?.success,
      weatherSuccess: weatherResult?.success,
      hasExtractedData: !!extractedData,
      extractedDates: extractedData?.dates?.length || 0,
      weatherType: typeof weatherResult,
      weatherKeys: weatherResult ? Object.keys(weatherResult) : []
    });
    
    if (!sqlResult.success || !weatherResult.success) {
      console.log('Orchestrator: Skipping weather enhancement - agent failures');
      return combinedResult;
    }
    
    if (!extractedData) {
      console.log('Orchestrator: Skipping weather enhancement - no extracted data');
      return combinedResult;
    }
    
    // Create enhanced data with weather information
    if (combinedResult.data && extractedData.entities) {
      console.log('Orchestrator: Merging weather data with', combinedResult.data.length, 'SQL rows');
      combinedResult.data = this.mergeDataWithWeather(
        combinedResult.data, 
        weatherResult, 
        extractedData
      );
      
      // Add weather forecast column to display
      if (combinedResult.displayColumns && !combinedResult.displayColumns.some(col => col.key === 'weather_forecast')) {
        combinedResult.displayColumns.push({
          key: 'weather_forecast',
          label: 'Weather Forecast',
          sortable: false,
          width: 'wide'
        });
      }
      
      console.log('Orchestrator: Weather enhancement completed');
    } else {
      console.log('Orchestrator: No data to enhance or no entities');
    }
    
    return combinedResult;
  }

  mergeDataWithWeather(sqlData, weatherResult, extractedData) {
    console.log('Orchestrator: mergeDataWithWeather called with:', {
      sqlDataLength: sqlData?.length,
      hasEntities: !!extractedData?.entities,
      entitiesCount: extractedData?.entities?.length || 0,
      weatherResultStructure: weatherResult ? Object.keys(weatherResult) : 'null'
    });
    
    if (!extractedData?.entities) {
      console.log('Orchestrator: No entities to merge weather data with');
      return sqlData;
    }

    return sqlData.map((row, index) => {
      const entity = extractedData.entities.find(e => e.rowIndex === index);
      if (!entity) {
        console.log(`Orchestrator: No entity found for row ${index}`);
        return row;
      }

      const enhancedRow = { ...row };
      
      // Try to get date-specific weather first
      if (entity.dates && entity.dates.length > 0) {
        const weatherForDates = [];
        
        entity.dates.forEach(dateInfo => {
          // Check if we have date-specific weather data
          if (weatherResult.dateSpecificWeather) {
            const dateWeather = weatherResult.dateSpecificWeather.find(w => w.date === dateInfo.date);
            if (dateWeather && dateWeather.success) {
              const temp = dateWeather.weather?.weather?.current?.temperature || 'N/A';
              const desc = dateWeather.weather?.weather?.current?.description || 'N/A';
              const tempUnit = dateWeather.weather?.weather?.temperatureUnit || weatherResult.weather?.temperatureUnit || '°F';
              weatherForDates.push(`${temp}${tempUnit} (${desc})`);
            }
          }
        });
        
        if (weatherForDates.length > 0) {
          enhancedRow.weather_forecast = {
            raw: weatherForDates,
            display: weatherForDates.join(', '),
            type: 'weather'
          };
        } else {
          // Fallback to general weather
          this.addGeneralWeatherToRow(enhancedRow, weatherResult);
        }
      } else {
        // No dates, use general weather
        this.addGeneralWeatherToRow(enhancedRow, weatherResult);
      }

      return enhancedRow;
    });
  }

  addGeneralWeatherToRow(row, weatherResult) {
    if (weatherResult.weather?.current) {
      const temp = weatherResult.weather.current.temperature;
      const desc = weatherResult.weather.current.description;
      const tempUnit = weatherResult.weather.temperatureUnit || '°F';
      row.weather_forecast = {
        raw: { temperature: temp, description: desc },
        display: `${temp}${tempUnit} (${desc}) - Current`,
        type: 'weather'
      };
    } else if (weatherResult.generalWeather?.weather?.current) {
      const temp = weatherResult.generalWeather.weather.current.temperature;
      const desc = weatherResult.generalWeather.weather.current.description;
      const tempUnit = weatherResult.generalWeather.weather.temperatureUnit || '°F';
      row.weather_forecast = {
        raw: { temperature: temp, description: desc },
        display: `${temp}${tempUnit} (${desc}) - Current`,
        type: 'weather'
      };
    } else {
      row.weather_forecast = {
        raw: 'unavailable',
        display: 'Weather unavailable',
        type: 'weather'
      };
    }
  }

  generateDynamicSummary(selectedAgents, executionResults) {
    const parts = [];
    
    if (selectedAgents.includes('sql')) {
      const sqlResult = executionResults.get('sql');
      if (sqlResult?.success) {
        const rowCount = sqlResult.rowCount || 0;
        parts.push(`Found ${rowCount} database record${rowCount === 1 ? '' : 's'}`);
      }
    }
    
    if (selectedAgents.includes('weather')) {
      const weatherResult = executionResults.get('weather');
      if (weatherResult?.success) {
        const location = weatherResult.location || 'your area';
        parts.push(`weather data for ${location}`);
      }
    }
    
    if (selectedAgents.includes('pdf')) {
      const pdfResult = executionResults.get('pdf');
      if (pdfResult?.success) {
        parts.push('document analysis from rabbit care manuals');
      }
    }
    
    if (parts.length === 0) {
      return 'Query processed with mixed results.';
    }
    
    if (parts.length === 1) {
      return parts[0] + '.';
    }
    
    return parts.join(', ') + ' combined for comprehensive insights.';
  }

  shouldDisplayWeatherWidget(originalQuery, selectedAgents) {
    // Always show weather for weather-only queries
    if (selectedAgents.length === 1 && selectedAgents[0] === 'weather') {
      return true;
    }
    
    // For SQL+Weather combination, don't show standalone weather widget since weather is integrated into table
    if (selectedAgents.includes('sql') && selectedAgents.includes('weather')) {
      console.log('Orchestrator: Weather widget not needed - weather data integrated into SQL table');
      return false;
    }
    
    // Check if query explicitly asks for weather information (for non-SQL queries)
    const lowerQuery = originalQuery.toLowerCase();
    const weatherKeywords = [
      'weather', 'temperature', 'forecast', 'climate', 'rain', 'sunny', 'cloudy', 
      'hot', 'cold', 'warm', 'degrees', 'humidity', 'wind', 'conditions'
    ];
    
    const hasWeatherIntent = weatherKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // Show weather if query explicitly mentions weather (for non-SQL combinations)
    if (hasWeatherIntent) {
      console.log('Orchestrator: Weather widget needed - explicit weather intent detected');
      return true;
    }
    
    // Default: show weather if agent was selected and succeeded
    return true;
  }

  // Existing utility methods remain the same...
  formatSqlResults(result) {
    console.log('Orchestrator: formatSqlResults called with result:', {
      success: result?.success,
      dataLength: result?.data?.length,
      firstRowKeys: result?.data?.[0] ? Object.keys(result?.data?.[0]) : 'No first row'
    });
    
    if (!result?.success || !result?.data) {
      console.log('Orchestrator: formatSqlResults - No valid data to format');
      return result;
    }

    let actualData = result.data;
    
    // Check if data is wrapped (Supabase RPC sometimes returns wrapped results)
    if (Array.isArray(actualData) && actualData.length > 0) {
      // Case 1: Single wrapper with array - [{result: [row1, row2, row3]}]
      if (actualData.length === 1 && actualData[0].result && Array.isArray(actualData[0].result)) {
        console.log('Orchestrator: formatSqlResults - Detected array-wrapped data, unwrapping');
        actualData = actualData[0].result;
      }
      // Case 2: Each row is wrapped - [{result: row1}, {result: row2}]
      else if (actualData.every(item => item && typeof item === 'object' && 'result' in item && Object.keys(item).length === 1)) {
        console.log('Orchestrator: formatSqlResults - Detected individual row wrapping, unwrapping');
        actualData = actualData.map(item => item.result);
      }
    }
    
    if (!Array.isArray(actualData) || actualData.length === 0) {
      console.log('Orchestrator: formatSqlResults - No actual data found after unwrapping');
      return {
        ...result,
        data: [],
        formattedSummary: 'No records found',
        displayColumns: []
      };
    }

    console.log('Orchestrator: formatSqlResults - Processing', actualData.length, 'rows');

    const formattedData = actualData.map(row => this.formatRow(row));
    
    return {
      ...result,
      data: formattedData,
      rowCount: actualData.length,
      formattedSummary: this.generateDataSummary(actualData, result.originalQuery),
      displayColumns: this.getDisplayColumns(actualData[0])
    };
  }

  formatRow(row) {
    const formatted = {};
    
    for (const [key, value] of Object.entries(row)) {
      formatted[key] = {
        raw: value,
        display: this.formatValue(key, value),
        type: this.getValueType(key, value)
      };
    }
    
    return formatted;
  }

  formatValue(columnName, value) {
    if (value === null || value === undefined) {
      return '—';
    }

    // Handle specific column patterns
    if (columnName.includes('date')) {
      return this.formatDate(value);
    }
    
    if (columnName.includes('weight')) {
      return `${value} lbs`;
    }
    
    if (columnName.includes('price') || columnName.includes('cost') || columnName.includes('amount')) {
      return this.formatCurrency(value);
    }
    
    if (columnName === 'gender') {
      return value === 'Male' ? '♂ Male' : value === 'Female' ? '♀ Female' : value;
    }
    
    if (columnName === 'status') {
      return this.formatStatus(value);
    }
    
    if (columnName.includes('id') && typeof value === 'string') {
      return value.substring(0, 8) + '...';
    }

    // Handle data types
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    return String(value);
  }

  getValueType(columnName, value) {
    if (value === null || value === undefined) return 'empty';
    if (columnName.includes('date')) return 'date';
    if (columnName.includes('price') || columnName.includes('cost') || columnName.includes('amount')) return 'currency';
    if (columnName === 'status') return 'status';
    if (columnName === 'gender') return 'gender';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (columnName.includes('id')) return 'id';
    return 'text';
  }

  formatDate(dateValue) {
    if (!dateValue) return '—';
    
    try {
      const date = new Date(dateValue);
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Add relative time for dates close to today
      if (Math.abs(diffDays) <= 30) {
        if (diffDays === 0) return `${formatted} (Today)`;
        if (diffDays === 1) return `${formatted} (Tomorrow)`;
        if (diffDays === -1) return `${formatted} (Yesterday)`;
        if (diffDays > 0) return `${formatted} (in ${diffDays} days)`;
        if (diffDays < 0) return `${formatted} (${Math.abs(diffDays)} days ago)`;
      }
      
      return formatted;
    } catch (e) {
      return String(dateValue);
    }
  }

  formatCurrency(value) {
    if (typeof value !== 'number') return String(value);
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

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
    };
    
    return statusMap[status] || status;
  }

  generateDataSummary(data, originalQuery) {
    const rowCount = data.length;
    const tableName = this.guessTableFromQuery(originalQuery);
    
    if (rowCount === 0) {
      return `No ${tableName} found matching your query.`;
    }
    
    if (rowCount === 1) {
      return `Found 1 ${tableName.slice(0, -1)} matching your query.`;
    }
    
    return `Found ${rowCount} ${tableName} matching your query.`;
  }

  guessTableFromQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('rabbit')) return 'rabbits';
    if (lowerQuery.includes('breeding') || lowerQuery.includes('plan')) return 'breeding plans';
    if (lowerQuery.includes('transaction') || lowerQuery.includes('expense') || lowerQuery.includes('cost')) return 'transactions';
    if (lowerQuery.includes('feed')) return 'feeding records';
    if (lowerQuery.includes('transfer')) return 'transfers';
    
    return 'records';
  }

  getDisplayColumns(sampleRow) {
    if (!sampleRow) return [];
    
    return Object.keys(sampleRow).map(key => ({
      key,
      label: this.formatColumnLabel(key),
      sortable: !key.includes('notes') && !key.includes('description'),
      width: this.getColumnWidth(key)
    }));
  }

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
      'weather_forecast': 'Weather Forecast'
    };
    
    if (labelMap[columnName]) {
      return labelMap[columnName];
    }
    
    // Convert snake_case to Title Case
    return columnName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getColumnWidth(columnName) {
    if (columnName.includes('id')) return 'narrow';
    if (columnName.includes('date')) return 'medium';
    if (columnName.includes('notes') || columnName.includes('description') || columnName === 'weather_forecast') return 'wide';
    if (columnName === 'name') return 'medium';
    return 'auto';
  }

  // Get current state for debugging
  getState() {
    return {
      agentRegistry: Array.from(this.agents.keys()),
      context: this.context.getAllData()
    };
  }

  getContext() {
    return this.context.getAllData();
  }

  // Helper method to get quick insights (moved from SQL service)
  async getQuickInsights() {
    const insights = [];
    
    try {
      const sqlAgent = this.agents.get('sql');
      if (!sqlAgent) {
        console.error('SQL agent not available for insights');
        return insights;
      }

      if (!sqlAgent.schema) {
        await sqlAgent.initialize();
      }
      
      // Total Rabbits
      const rabbitsResult = await sqlAgent.processQuery("How many rabbits do we have?");
      if (rabbitsResult.success && rabbitsResult.data?.[0]) {
        insights.push({ 
          label: "Total Rabbits", 
          value: rabbitsResult.data[0]?.count || 0 
        });
      }

      // Active rabbits
      const activeResult = await sqlAgent.processQuery("What rabbits are currently in the breeding program?");
      if (activeResult.success) {
        insights.push({ 
          label: "Active rabbits", 
          value: activeResult.rowCount 
        });
      }

      // This month's expenses
      const expensesResult = await sqlAgent.processQuery("Total transactions this month");
      if (expensesResult.success && expensesResult.data?.[0]) {
        insights.push({ 
          label: "Monthly Expenses", 
          value: expensesResult.data[0]?.total_expenses || 0 
        });
      }

    } catch (error) {
      console.error('Error getting insights:', error);
    }

    return insights;
  }
}

export default FarmManagementOrchestrator; 