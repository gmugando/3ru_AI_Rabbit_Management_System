<!-- components/NaturalLanguageQuery.vue -->
<template>
  <div class="nl-query-container">
    <div class="query-header">
      <h2>Ask About Your Farm</h2>
      <p>Ask questions in plain English about your farm data</p>
    </div>

    <!-- Query Input -->
    <div class="query-input-section">
      <div class="input-group">
        <textarea
          v-model="queryText"
          @keydown.enter.ctrl="executeQuery"
          placeholder="e.g., 'Show me all rabbits' or 'Which does are expected to kindle this month?'"
          class="query-input"
          rows="3"
        ></textarea>
        <button 
          @click="executeQuery" 
          :disabled="loading || !queryText.trim()"
          class="query-button"
        >
          <span v-if="loading">Analyzing...</span>
          <span v-else>Ask</span>
        </button>
      </div>
      
      <!-- Quick Query Suggestions -->
      <div class="suggestions">
        <span class="suggestions-label">Try asking:</span>
        <button 
          v-for="suggestion in suggestions" 
          :key="suggestion"
          @click="queryText = suggestion"
          class="suggestion-chip"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="currentResult" class="results-section">
      <div class="result-header">
        <h3>Results</h3>
        <div class="result-meta">
          <span class="query-text">{{ currentResult.originalQuery }}</span>
          <span v-if="currentResult.success" class="row-count">
            {{ currentResult.rowCount }} rows
          </span>
        </div>
        <div v-if="currentResult.formattedSummary || currentResult.combinedSummary" class="result-summary">
          {{ currentResult.formattedSummary || currentResult.combinedSummary }}
        </div>
        
        <!-- Multi-Agent Result Type Display -->
        <div v-if="currentResult.agentsUsed || currentResult.queryType" class="agent-info">
          <template v-if="currentResult.agentsUsed">
            <span v-for="agent in currentResult.agentsUsed" 
                  :key="agent" 
                  class="agent-badge" 
                  :class="agent + '_agent'">
              {{ getAgentDisplayName(agent) }}
            </span>
          </template>
          <span v-else-if="currentResult.queryType" 
                class="agent-badge" 
                :class="currentResult.queryType">
            {{ getAgentTypeDisplay(currentResult.queryType) }}
          </span>
        </div>
      </div>

      <!-- PDF Insights Display (for pdf_only or both queries) -->
      <div v-if="currentResult.success && currentResult.answer" class="pdf-insights">
        <h4><i class="pi pi-book"></i> Document Insights</h4>
        <div class="insights-content">
          {{ currentResult.answer }}
        </div>
        <div v-if="currentResult.sources && currentResult.sources.length" class="sources">
          <strong>Sources:</strong>
          <ul>
            <li v-for="source in currentResult.sources" :key="source">{{ source }}</li>
          </ul>
        </div>
      </div>

      <!-- Weather Display (for weather_only or both queries) -->
      <div v-if="currentResult.success && currentResult.weather" class="weather-display">
        <h4><i class="pi pi-sun"></i> Weather Analysis for {{ currentResult.location }}</h4>
        
        <!-- Current Weather -->
        <div class="weather-current">
          <div class="weather-main">
            <div class="temperature">
              <span class="temp-value">{{ currentResult.weather.current.temperature }}{{ currentResult.weather.temperatureUnit || '°F' }}</span>
              <span class="feels-like">Feels like {{ currentResult.weather.current.feelsLike }}{{ currentResult.weather.temperatureUnit || '°F' }}</span>
            </div>
            <div class="weather-description">{{ currentResult.weather.current.description }}</div>
          </div>
          
          <div class="weather-details">
            <div class="weather-detail">
              <span class="label">Humidity:</span>
              <span class="value">{{ currentResult.weather.current.humidity }}%</span>
            </div>
            <div class="weather-detail">
              <span class="label">Wind:</span>
              <span class="value">{{ currentResult.weather.current.windSpeed }} mph</span>
            </div>
          </div>
        </div>

        <!-- Farm Analysis -->
        <div v-if="currentResult.analysis" class="weather-analysis">
          <h5><i class="pi pi-info-circle"></i> Farm Impact Analysis</h5>
          <div class="analysis-content">{{ currentResult.analysis }}</div>
        </div>

        <!-- Recommendations -->
        <div v-if="currentResult.recommendations && currentResult.recommendations.length" class="weather-recommendations">
          <h5><i class="pi pi-lightbulb"></i> Recommendations</h5>
          <ul class="recommendations-list">
            <li v-for="recommendation in currentResult.recommendations" :key="recommendation">
              {{ recommendation }}
            </li>
          </ul>
        </div>

        <!-- Weather Forecast -->
        <div v-if="currentResult.weather.forecast" class="weather-forecast">
          <h5><i class="pi pi-calendar"></i> Upcoming Forecast</h5>
          <div class="forecast-grid">
            <div v-for="forecast in currentResult.weather.forecast.slice(0, 4)" :key="forecast.time" class="forecast-item">
              <div class="forecast-time">{{ forecast.time }}</div>
              <div class="forecast-temp">{{ forecast.temperature }}{{ forecast.temperatureUnit || currentResult.weather.temperatureUnit || '°F' }}</div>
              <div class="forecast-desc">{{ forecast.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vision Display (for vision-only or combined queries) -->
      <div v-if="currentResult.success && (currentResult.visionSummary || (currentResult.visionAlerts && currentResult.visionAlerts.length))" class="vision-display">
        <h4><i class="pi pi-video"></i> Vision Monitoring Insights</h4>

        <div v-if="currentResult.visionSummary" class="vision-summary">
          {{ currentResult.visionSummary }}
        </div>

        <div v-if="currentResult.visionAlerts && currentResult.visionAlerts.length" class="vision-alerts">
          <h5><i class="pi pi-exclamation-triangle"></i> Top Alerts</h5>
          <ul class="vision-alert-list">
            <li v-for="alert in currentResult.visionAlerts.slice(0, 5)" :key="alert.id || `${alert.event_type}-${alert.event_time}`">
              <span class="alert-badge" :class="`severity-${alert.severity}`">{{ alert.severity }}</span>
              <span class="alert-event">{{ (alert.event_type || '').replace(/_/g, ' ') }}</span>
              <span class="alert-confidence">{{ Math.round((alert.confidence || 0) * 100) }}%</span>
              <span class="alert-context" v-if="alert.rabbit_id || alert.cage_id">
                {{ alert.rabbit_id ? `Rabbit: ${alert.rabbit_id}` : `Cage: ${alert.cage_id}` }}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="!currentResult.success" class="error-display">
        <p><strong>Error:</strong> {{ currentResult.error }}</p>
        <details v-if="currentResult.query">
          <summary>Generated SQL</summary>
          <code>{{ currentResult.query }}</code>
        </details>
      </div>

      <!-- Success Display -->
      <div v-else class="success-display">
        <!-- Toggle between Card and Table View -->
        <div class="view-controls">
          <button 
            @click="viewMode = 'cards'" 
            :class="['view-btn', { active: viewMode === 'cards' }]"
          >
            <i class="pi pi-th-large"></i> Cards
          </button>
          <button 
            @click="viewMode = 'table'" 
            :class="['view-btn', { active: viewMode === 'table' }]"
          >
            <i class="pi pi-table"></i> Table
          </button>
        </div>

        <!-- Card View -->
        <div v-if="viewMode === 'cards' && currentResult.data && currentResult.data.length > 0" class="cards-container">
          <div v-for="(row, index) in currentResult.data" :key="index" class="data-card">
            <div class="card-header">
              <h4>{{ getCardTitle(row) }}</h4>
              <span v-if="getCardStatus(row)" :class="['status-badge', getCardStatus(row).type]">
                {{ getCardStatus(row).display }}
              </span>
            </div>
            
            <div class="card-content">
              <div 
                v-for="(cell, key) in row" 
                :key="key"
                v-show="!isHiddenField(key)"
                class="card-field"
                :class="`field-type-${getValueType(cell)}`"
              >
                <label>{{ formatColumnName(key) }}</label>
                <span class="field-value">{{ formatCellValue(cell) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Table View -->
        <div v-else-if="viewMode === 'table' && currentResult.data && currentResult.data.length > 0" class="table-container">
          <div class="table-wrapper">
            <table class="enhanced-data-table">
              <thead>
                <tr>
                  <th 
                    v-for="column in visibleColumns" 
                    :key="column.key"
                    :class="['table-header', `width-${column.width}`]"
                  >
                    {{ column.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in currentResult.data" :key="index" class="table-row">
                  <td 
                    v-for="column in visibleColumns" 
                    :key="column.key"
                    :class="['table-cell', `cell-type-${row[column.key]?.type || 'text'}`]"
                  >
                    <span class="cell-content">
                      {{ formatTableCellValue(row[column.key]) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Raw Data Fallback (when data exists but not properly formatted) -->
        <div v-else-if="currentResult.data && currentResult.data.length > 0" class="raw-data-view">
          <div class="raw-data-header">
            <h4><i class="pi pi-database"></i> Raw Data View ({{ currentResult.data.length }} records)</h4>
            <p>Data is being displayed in raw format. Check console for debugging info.</p>
          </div>
          
          <div v-for="(row, index) in currentResult.data" :key="index" class="raw-data-card">
            <div class="raw-data-title">Record {{ index + 1 }}</div>
            <div class="key-value-pairs">
              <div v-for="(value, key) in row" :key="key" class="key-value-pair">
                <span class="key">{{ formatColumnName(key) }}:</span>
                <span class="value" :class="getValueClass(value)">{{ formatDisplayValue(value) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- No Data -->
        <div v-else class="no-data">
          <div class="no-data-content">
            <i class="pi pi-info-circle"></i>
            <p>No data found for your query.</p>
            <p class="no-data-suggestion">Try rephrasing your question or check if the data exists.</p>
          </div>
        </div>

        <!-- SQL Query Display -->
        <details class="sql-display">
          <summary>View Generated SQL</summary>
          <pre><code>{{ getSqlQuery() }}</code></pre>
          <!-- Debug info -->
          <div v-if="!getSqlQuery()" class="debug-info">
            <small>Debug: Available properties: {{ Object.keys(currentResult) }}</small>
          </div>
        </details>
      </div>
    </div>

    <!-- Query History -->
    <div v-if="queryHistory.length > 0" class="history-section">
      <h3>Recent Queries</h3>
      <div class="history-list">
        <div 
          v-for="(item, index) in queryHistory.slice(0, 5)" 
          :key="index"
          @click="rerunQuery(item)"
          class="history-item"
          :class="{ 'error': !item.success }"
        >
          <span class="history-query">{{ item.originalQuery }}</span>
          <span class="history-result">
            {{ item.success ? `${item.rowCount} rows` : 'Error' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Quick Insights -->
    <div v-if="insights.length > 0" class="insights-section">
      <h3>Quick Insights</h3>
      <div class="insights-grid">
        <div v-for="insight in insights" :key="insight.label" class="insight-card">
          <span class="insight-value">{{ insight.value }}</span>
          <span class="insight-label">{{ insight.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FarmManagementOrchestrator from '@/services/agentOrchestrator'

export default {
  name: 'NaturalLanguageQuery',
  
  data() {
    return {
      queryText: '',
      loading: false,
      currentResult: null,
      queryHistory: [],
      insights: [],
      orchestrator: null,
      viewMode: 'cards', // 'cards' or 'table'
      suggestions: [
        "Show me all rabbits",
        "Which does are expected to kindle this month?",
        "Show me breeding plans",
        "How many rabbits do we have?",
        "What's the weather like?",
        "Is it too hot for my rabbits today?",
        "Will it rain tomorrow?",
        "What does the rabbit care manual say about housing?",
        "Compare our breeding rates with industry standards",
        "Show me critical vision alerts from today",
        "Any reduced movement or posture issues from camera monitoring?"
      ]
    }
  },

  computed: {
    visibleColumns() {
      if (!this.currentResult?.displayColumns) return []
      
      // Filter out less important columns for table view
      return this.currentResult.displayColumns.filter(col => 
        !this.isHiddenField(col.key)
      )
    }
  },

  async mounted() {
    await this.initializeService()
    await this.loadInsights()
  },

  methods: {
    async initializeService() {
      try {
        const openaiApiKey = process.env.VUE_APP_OPENAI_API_KEY;
        const weatherApiKey = process.env.VUE_APP_WEATHER_API_KEY;
        const farmLocation = process.env.VUE_APP_FARM_LOCATION ;
        

        console.log('Vue Component - API Keys:', {
          openai: openaiApiKey ? 'Present' : 'Missing',
          weather: weatherApiKey ? 'Present' : 'Missing (will use mock data)',
          farmLocation: farmLocation
        });
        
        this.orchestrator = new FarmManagementOrchestrator(
          process.env.VUE_APP_SUPABASE_URL,
          process.env.VUE_APP_SUPABASE_ANON_KEY,
          openaiApiKey,
          weatherApiKey,
          farmLocation
        )
        await this.orchestrator.initialize()
        console.log('Multi-agent orchestrator initialized successfully')
      } catch (error) {
        console.error('Failed to initialize orchestrator:', error)
      }
    },

    async executeQuery() {
      if (!this.queryText.trim() || this.loading) return

      this.loading = true
      try {
        // Use the multi-agent orchestrator
        const result = await this.orchestrator.query(this.queryText.trim())
        
        console.log('Multi-agent result:', result)
        console.log('Result data:', result?.data)
        console.log('Result displayColumns:', result?.displayColumns)
        console.log('Data length:', result?.data?.length)
        
        // Debug first row structure
        if (result?.data && result.data.length > 0) {
          console.log('First row structure:', result.data[0])
          console.log('First row keys:', Object.keys(result.data[0]))
          
          // Check if data is properly formatted
          const firstValue = Object.values(result.data[0])[0]
          console.log('First cell value:', firstValue)
          console.log('Is properly formatted?', firstValue && typeof firstValue === 'object' && firstValue.display !== undefined)
        }
        this.currentResult = result
        
        // Add to history
        this.queryHistory.unshift(result)
        if (this.queryHistory.length > 10) {
          this.queryHistory = this.queryHistory.slice(0, 10)
        }

        // Clear input on success
        if (result.success) {
          this.queryText = ''
        }
      } catch (error) {
        console.error('Query execution failed:', error)
        this.currentResult = {
          success: false,
          error: error.message,
          originalQuery: this.queryText,
          agent: 'vue_component'
        }
      } finally {
        this.loading = false
      }
    },

    async loadInsights() {
      if (!this.orchestrator) return
      
      try {
        this.insights = await this.orchestrator.getQuickInsights()
      } catch (error) {
        console.error('Failed to load insights:', error)
      }
    },

    rerunQuery(historyItem) {
      this.queryText = historyItem.originalQuery
      this.executeQuery()
    },

    formatColumnName(column) {
      // For now, use simple formatting since orchestrator doesn't have formatColumnLabel
      // TODO: Add formatting utilities to orchestrator when needed
      return column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    },

    getAgentTypeDisplay(queryType) {
      const typeMap = {
        'sql_only': 'Database Query',
        'pdf_only': 'Document Analysis',
        'weather_only': 'Weather Analysis',
        'vision_only': 'Vision Monitoring',
        'sql_pdf': 'Database + Document Analysis',
        'sql_weather': 'Database + Weather Analysis',
        'sql_vision': 'Database + Vision Monitoring',
        'unclear': 'Auto-Routed'
      }
      return typeMap[queryType] || queryType
    },

    getAgentDisplayName(agentName) {
      const agentMap = {
        'sql': 'Database',
        'pdf': 'Documents', 
        'weather': 'Weather',
        'vision': 'Vision'
      }
      return agentMap[agentName] || agentName.charAt(0).toUpperCase() + agentName.slice(1)
    },

    // Format cell value - handles both formatted objects and raw values
    formatCellValue(cell) {
      // If it's a formatted object with display property
      if (cell && typeof cell === 'object' && cell.display !== undefined) {
        return cell.display
      }
      
      // If it's a raw value, format it
      return this.formatRawValue(cell)
    },

    // Format raw values for display
    formatRawValue(value) {
      if (value === null || value === undefined) {
        return '—'
      }
      
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No'
      }
      
      if (typeof value === 'number') {
        return value.toLocaleString()
      }
      
      if (typeof value === 'object' && value !== null) {
        // For objects, show a more readable format
        if (Array.isArray(value)) {
          return value.join(', ')
        }
        // For regular objects, create a readable key-value format
        return Object.entries(value)
          .map(([key, val]) => `${key}: ${val}`)
          .join(' | ')
      }
      
      return String(value)
    },

    // Get value type for styling
    getValueType(cell) {
      // If it's a formatted object with type property
      if (cell && typeof cell === 'object' && cell.type !== undefined) {
        return cell.type
      }
      
      // Determine type from raw value
      if (cell === null || cell === undefined) return 'empty'
      if (typeof cell === 'boolean') return 'boolean'
      if (typeof cell === 'number') return 'number'
      if (typeof cell === 'object') return 'object'
      return 'text'
    },

    // Format table cell value (for table view)
    formatTableCellValue(cell) {
      return this.formatCellValue(cell)
    },

    // Format value for display in raw data view
    formatDisplayValue(value) {
      if (value === null || value === undefined) {
        return '—'
      }
      
      // Format dates
      if (typeof value === 'string' && value.includes('T') && value.includes(':')) {
        try {
          const date = new Date(value)
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
          }
        } catch (e) {
          // Not a date, continue
        }
      }
      
      if (typeof value === 'boolean') {
        return value ? '✅ Yes' : '❌ No'
      }
      
      if (typeof value === 'number') {
        return value.toLocaleString()
      }
      
      return String(value)
    },

    // Get CSS class for value type
    getValueClass(value) {
      if (value === null || value === undefined) return 'null-value'
      if (typeof value === 'boolean') return 'boolean-value'
      if (typeof value === 'number') return 'number-value'
      if (typeof value === 'string' && value.includes('T') && value.includes(':')) return 'date-value'
      return 'text-value'
    },

    getCardTitle(row) {
      // Try to find a good title field
      if (row.name?.display) return row.name.display
      if (row.rabbit_id?.display) return row.rabbit_id.display
      if (row.plan_id?.display) return row.plan_id.display
      if (row.id?.display) return `Record ${row.id.display}`
      return 'Record'
    },

    getCardStatus(row) {
      if (row.status?.display) {
        return {
          display: row.status.display,
          type: this.getStatusType(row.status.raw)
        }
      }
      return null
    },

    getStatusType(status) {
      const statusTypes = {
        'Active': 'success',
        'Inactive': 'danger',
        'Planned': 'info',
        'Completed': 'success',
        'Failed': 'danger',
        'Cancelled': 'warning',
        'Breeding': 'info',
        'Growing': 'info',
        'Retired': 'secondary'
      }
      return statusTypes[status] || 'secondary'
    },

         isHiddenField(key) {
       // Hide less important fields in both views
       const hiddenFields = ['id', 'created_at', 'updated_at', 'created_by']
       return hiddenFields.includes(key)
     },

     getSqlQuery() {
       // Check multiple possible locations for the SQL query
       if (this.currentResult?.query) {
         return this.currentResult.query
       }
       if (this.currentResult?.sqlData?.query) {
         return this.currentResult.sqlData.query
       }
       if (this.currentResult?.sqlData?.data && this.currentResult.sqlData.data.length > 0) {
         // If we have SQL data but no explicit query, show a generic message
         return 'SQL query executed successfully (query details not available)'
       }
       return null
     },


  }
}
</script>

<style scoped>
.nl-query-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.query-header {
  text-align: center;
  margin-bottom: 30px;
}

.query-header h2 {
  color: #2d5a27;
  margin-bottom: 5px;
}

.query-header p {
  color: #666;
}

.query-input-section {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.input-group {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.query-input {
  flex: 1;
  padding: 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  font-family: inherit;
}

.query-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.query-button {
  padding: 15px 25px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  min-width: 100px;
}

.query-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.suggestions {
  margin-top: 15px;
}

.suggestions-label {
  color: #666;
  margin-right: 10px;
  font-size: 14px;
}

.suggestion-chip {
  background: #f0f7f0;
  border: 1px solid #4CAF50;
  color: #2d5a27;
  padding: 5px 12px;
  margin: 3px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
}

.suggestion-chip:hover {
  background: #4CAF50;
  color: white;
}

.results-section {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.result-header {
  margin-bottom: 20px;
}

.result-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
}

.query-text {
  font-style: italic;
  color: #666;
}

.row-count {
  background: #e8f5e8;
  color: #2d5a27;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.error-display {
  background: #ffeaea;
  border: 1px solid #ffb3b3;
  border-radius: 8px;
  padding: 15px;
  color: #d32f2f;
}

.data-table-container {
  overflow-x: auto;
  margin-bottom: 15px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e1e5e9;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2d5a27;
}

.sql-display {
  margin-top: 15px;
}

.sql-display pre {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
}

.history-section,
.insights-section {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 5px;
}

.history-item:hover {
  background: #f8f9fa;
}

.history-item.error {
  background: #ffeaea;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.insight-card {
  background: #f0f7f0;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e8f5e8;
}

.insight-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #2d5a27;
}

.insight-label {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 14px;
}

.no-data {
  text-align: center;
  color: #666;
  padding: 40px 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #e2e8f0;
}

.no-data-content i {
  font-size: 48px;
  color: #cbd5e1;
  margin-bottom: 15px;
}

.no-data-content p {
  margin: 10px 0;
  font-size: 16px;
}

.no-data-suggestion {
  font-size: 14px;
  color: #94a3b8;
}

.view-controls {
  margin-bottom: 15px;
}

.view-btn {
  padding: 10px 20px;
  background: #f0f7f0;
  border: 1px solid #e8f5e8;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
}

.view-btn.active {
  background: #4CAF50;
  color: white;
}

.cards-container {
  margin-bottom: 15px;
}

.data-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-header h4 {
  margin: 0;
  font-size: 18px;
  color: #2d5a27;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.status-badge.success {
  background: #e8f5e8;
  color: #2d5a27;
}

.status-badge.danger {
  background: #ffeaea;
  color: #d32f2f;
}

.status-badge.info {
  background: #f0f7f0;
  color: #2d5a27;
}

.status-badge.warning {
  background: #fff3e8;
  color: #ffa500;
}

.status-badge.secondary {
  background: #f8f9fa;
  color: #666;
}

.card-content {
  display: flex;
  flex-wrap: wrap;
}

.card-field {
  width: 50%;
  margin-bottom: 15px;
  padding-right: 10px;
  box-sizing: border-box;
}

.card-field:nth-child(odd) {
  padding-right: 15px;
}

.card-field label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-value {
  display: block;
  color: #1e293b;
  font-size: 15px;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .card-field {
    width: 100%;
    padding-right: 0;
  }
}

.field-type-date .field-value {
  color: #2563eb;
  font-weight: 500;
}

.field-type-currency .field-value {
  color: #059669;
  font-weight: 600;
}

.field-type-status .field-value {
  font-weight: 500;
}

.field-type-gender .field-value {
  font-weight: 500;
}

.field-type-id .field-value {
  font-family: monospace;
  color: #6b7280;
  font-size: 12px;
}

.field-type-empty .field-value {
  color: #9ca3af;
  font-style: italic;
}

.table-container {
  margin-bottom: 15px;
}

.table-wrapper {
  overflow-x: auto;
}

.enhanced-data-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background: #f8f9fa;
  font-weight: 600;
  color: #2d5a27;
  padding: 12px;
  text-align: left;
}

.table-cell {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e1e5e9;
}

.table-row:hover {
  background: #f8f9fa;
}

.cell-content {
  /* Add appropriate styles for cell content */
}

.cell-type-date .cell-content {
  color: #2563eb;
  font-weight: 500;
}

.cell-type-currency .cell-content {
  color: #059669;
  font-weight: 600;
}

.cell-type-status .cell-content {
  font-weight: 500;
}

.cell-type-gender .cell-content {
  font-weight: 500;
}

.cell-type-id .cell-content {
  font-family: monospace;
  color: #6b7280;
  font-size: 12px;
}

.cell-type-empty .cell-content {
  color: #9ca3af;
  font-style: italic;
}

.cell-type-number .cell-content {
  text-align: right;
  font-weight: 500;
}

.result-summary {
  margin-top: 10px;
  color: #666;
  font-style: italic;
}

/* Multi-Agent Styles */
.agent-info {
  margin-top: 10px;
}

.agent-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.agent-badge.sql_only {
  background: #dbeafe;
  color: #1e40af;
}

.agent-badge.pdf_only {
  background: #f3e8ff;
  color: #7c3aed;
}

.agent-badge.weather_only {
  background: #fef3c7;
  color: #d97706;
}

.agent-badge.sql_pdf {
  background: #ecfdf5;
  color: #059669;
}

.agent-badge.sql_weather {
  background: #e0f2fe;
  color: #0277bd;
}

.agent-badge.unclear {
  background: #f1f5f9;
  color: #64748b;
}

/* Individual agent badges */
.agent-badge.sql_agent {
  background: #dbeafe;
  color: #1e40af;
  margin-right: 8px;
}

.agent-badge.pdf_agent {
  background: #f3e8ff;
  color: #7c3aed;
  margin-right: 8px;
}

.agent-badge.weather_agent {
  background: #fef3c7;
  color: #d97706;
  margin-right: 8px;
}

.agent-badge.vision_agent {
  background: #fee2e2;
  color: #b91c1c;
  margin-right: 8px;
}

.pdf-insights {
  background: #f8fafc;
  border-left: 4px solid #7c3aed;
  padding: 20px;
  margin: 20px 0;
  border-radius: 0 8px 8px 0;
}

.pdf-insights h4 {
  margin: 0 0 15px 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.insights-content {
  background: white;
  padding: 15px;
  border-radius: 6px;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 15px;
}

.sources {
  font-size: 14px;
  color: #6b7280;
}

.sources ul {
  margin: 5px 0 0 0;
  padding-left: 20px;
}

.sources li {
  margin: 2px 0;
}

/* Weather Display Styles */
.weather-display {
  background: #f0f9ff;
  border-left: 4px solid #0ea5e9;
  padding: 20px;
  margin: 20px 0;
  border-radius: 0 8px 8px 0;
}

.weather-display h4 {
  margin: 0 0 20px 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.weather-current {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: center;
}

.weather-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.temperature {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.temp-value {
  font-size: 48px;
  font-weight: bold;
  color: #0ea5e9;
}

.feels-like {
  font-size: 14px;
  color: #6b7280;
}

.weather-description {
  font-size: 18px;
  color: #374151;
  text-transform: capitalize;
}

.weather-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weather-detail {
  display: flex;
  justify-content: space-between;
  min-width: 120px;
}

.weather-detail .label {
  color: #6b7280;
  font-weight: 500;
}

.weather-detail .value {
  color: #374151;
  font-weight: 600;
}

.weather-analysis {
  background: white;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.weather-analysis h5 {
  margin: 0 0 10px 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
}

.analysis-content {
  color: #374151;
  line-height: 1.6;
  white-space: pre-line;
}

.weather-recommendations {
  background: white;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.weather-recommendations h5 {
  margin: 0 0 10px 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
}

.recommendations-list {
  margin: 0;
  padding-left: 20px;
  color: #374151;
}

.recommendations-list li {
  margin: 5px 0;
}

.weather-forecast {
  background: white;
  padding: 15px;
  border-radius: 6px;
}

.weather-forecast h5 {
  margin: 0 0 15px 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Vision Display Styles */
.vision-display {
  background: #fff7ed;
  border-left: 4px solid #ea580c;
  padding: 20px;
  margin: 20px 0;
  border-radius: 0 8px 8px 0;
}

.vision-display h4 {
  margin: 0 0 14px 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.vision-summary {
  background: #ffffff;
  border-radius: 8px;
  padding: 14px;
  color: #374151;
  line-height: 1.55;
  margin-bottom: 14px;
}

.vision-alerts h5 {
  margin: 0 0 10px 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.vision-alert-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.vision-alert-list li {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  background: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  border: 1px solid #fed7aa;
}

.alert-badge {
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  padding: 2px 8px;
}

.alert-badge.severity-low {
  background: #dcfce7;
  color: #166534;
}

.alert-badge.severity-medium {
  background: #ffedd5;
  color: #9a3412;
}

.alert-badge.severity-high {
  background: #fee2e2;
  color: #b91c1c;
}

.alert-badge.severity-critical {
  background: #7f1d1d;
  color: #ffffff;
}

.alert-event {
  font-weight: 600;
  color: #111827;
}

.alert-confidence,
.alert-context {
  color: #6b7280;
  font-size: 13px;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.forecast-item {
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
}

.forecast-time {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.forecast-temp {
  font-size: 18px;
  font-weight: bold;
  color: #0ea5e9;
  margin-bottom: 4px;
}

.forecast-desc {
  font-size: 12px;
  color: #374151;
  text-transform: capitalize;
}

/* Responsive adjustments for weather */
@media (max-width: 768px) {
  .weather-current {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .weather-details {
    flex-direction: row;
    justify-content: space-around;
  }
  
  .forecast-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Raw Data View Styles */
.raw-data-view {
  margin: 20px 0;
}

.raw-data-header {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 15px;
  border-radius: 8px 8px 0 0;
  border-bottom: none;
}

.raw-data-header h4 {
  margin: 0 0 8px 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.raw-data-header p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.raw-data-card {
  background: white;
  border: 1px solid #e2e8f0;
  margin-bottom: 15px;
  border-radius: 0 0 8px 8px;
}

.raw-data-card:first-of-type {
  border-radius: 0 0 8px 8px;
}

.raw-data-card:not(:first-of-type) {
  border-radius: 8px;
}

.raw-data-title {
  background: #f1f5f9;
  padding: 12px 20px;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.key-value-pairs {
  padding: 20px;
}

.key-value-pair {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.key-value-pair:last-child {
  border-bottom: none;
}

.key {
  font-weight: 500;
  color: #374151;
  text-align: right;
  padding-right: 15px;
}

.value {
  color: #111827;
  word-break: break-word;
}

/* Value type styles */
.null-value {
  color: #9ca3af;
  font-style: italic;
}

.boolean-value {
  font-weight: 500;
}

.number-value {
  font-family: monospace;
  color: #059669;
}

.date-value {
  color: #2563eb;
  font-weight: 500;
}

.text-value {
  color: #374151;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .key-value-pair {
    grid-template-columns: 1fr;
    gap: 5px;
  }
  
  .key {
    text-align: left;
    padding-right: 0;
    font-weight: 600;
  }
}
</style> 