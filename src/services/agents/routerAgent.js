// Router Agent - Determines which agents should process the query

class RouterAgent {
  constructor(openaiApiKey) {
    this.openaiApiKey = openaiApiKey;
    console.log('RouterAgent - API key:', openaiApiKey ? 'Present' : 'Missing');
    
    // Registry of available agents
    this.availableAgents = {
      'sql': 'Database queries about rabbits, breeding plans, transactions, feeding schedules, transfers',
      'pdf': 'Document analysis, manual reading, research questions about rabbit care best practices', 
      'weather': 'Weather conditions, temperature forecasts, climate impact analysis'
    };
  }

  async selectAgents(query) {
    try {
      console.log('RouterAgent: Selecting agents for query:', query);
      
      // Use OpenAI to determine which agents should process this query
      const systemPrompt = `You are an intelligent agent router for a farm management system. Your job is to determine which agents should process a given query.

AVAILABLE AGENTS:
- sql: Database queries about rabbits, breeding plans, transactions, feeding schedules, transfers
- pdf: Document analysis, manual reading, research questions about rabbit care best practices
- weather: Weather conditions, temperature forecasts, climate impact analysis

RULES:
1. Return a JSON array of agent names that should process the query
2. Use multiple agents when the query requires combining different types of information
3. Always include 'sql' for any database-related questions
4. Include 'weather' when weather/climate information is requested
5. Include 'pdf' when asking about best practices, guidelines, or research
6. Return agents in order of execution priority (dependencies first)

EXAMPLES:
"Show me breeding plans for next month" → ["sql"]
"What's the weather like?" → ["weather"]  
"What are the best practices for rabbit housing?" → ["pdf"]
"Which does are expected to kindle next month? and tell me the weather" → ["sql", "weather"]
"Compare our breeding data with industry best practices" → ["sql", "pdf"]
"Which does are expected to kindle next month? For each one, list the expected kindle date and the forecasted temperature on that date" → ["sql", "weather"]
"Show me this week's feeding schedule and weather forecast" → ["sql", "weather"]
"How many rabbits do we have and what does the manual say about optimal population size?" → ["sql", "pdf"]

IMPORTANT: 
- Always return valid JSON array format: ["agent1", "agent2"]
- Only use agent names from the available list: sql, pdf, weather
- Consider data dependencies (sql data often needed before weather for specific dates)`;

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
            { role: 'user', content: `Select agents for this farm management query: "${query}"\n\nReturn JSON array of agent names.` }
          ],
          temperature: 0.1,
          max_tokens: 100
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      const agentSelectionText = result.choices[0].message.content.trim();
      
      console.log('RouterAgent: Raw agent selection:', agentSelectionText);
      
      // Parse the JSON response
      let selectedAgents;
      try {
        // Clean up the response and parse JSON
        const cleanedResponse = agentSelectionText.replace(/```json\n?|\n?```/g, '').trim();
        selectedAgents = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Error parsing agent selection JSON:', parseError);
        // Fallback to text parsing
        selectedAgents = this.parseAgentsFromText(agentSelectionText);
      }
      
      // Validate and filter agents
      const validAgents = this.validateAgents(selectedAgents);
      
      console.log('RouterAgent: Selected agents:', validAgents);
      return validAgents;
      
    } catch (error) {
      console.error('Error selecting agents:', error);
      return ['sql']; // Default fallback
    }
  }

  parseAgentsFromText(text) {
    // Fallback parser for non-JSON responses
    const lowerText = text.toLowerCase();
    const agents = [];
    
    if (lowerText.includes('sql') || lowerText.includes('database')) {
      agents.push('sql');
    }
    if (lowerText.includes('pdf') || lowerText.includes('document') || lowerText.includes('manual')) {
      agents.push('pdf');
    }
    if (lowerText.includes('weather') || lowerText.includes('climate') || lowerText.includes('forecast')) {
      agents.push('weather');
    }
    
    return agents.length > 0 ? agents : ['sql'];
  }

  validateAgents(agentList) {
    if (!Array.isArray(agentList)) {
      return ['sql']; // Default fallback
    }
    
    const validAgentNames = Object.keys(this.availableAgents);
    const validatedAgents = agentList.filter(agent => 
      typeof agent === 'string' && validAgentNames.includes(agent.toLowerCase())
    ).map(agent => agent.toLowerCase());
    
    // Ensure we have at least one agent
    return validatedAgents.length > 0 ? validatedAgents : ['sql'];
  }

  // Register a new agent in the system
  registerAgent(name, description) {
    this.availableAgents[name.toLowerCase()] = description;
    console.log(`RouterAgent: Registered new agent '${name}': ${description}`);
  }

  // Get list of available agents
  getAvailableAgents() {
    return { ...this.availableAgents };
  }

  // Legacy method for backwards compatibility
  async classifyQuery(query) {
    const agents = await this.selectAgents(query);
    
    // Convert back to old format for compatibility
    if (agents.length === 1) {
      return `${agents[0]}_only`;
    } else if (agents.includes('sql') && agents.includes('pdf')) {
      return 'sql_pdf';
    } else if (agents.includes('sql') && agents.includes('weather')) {
      return 'sql_weather';
    } else {
      return 'multi_agent';
    }
  }
}

export default RouterAgent; 