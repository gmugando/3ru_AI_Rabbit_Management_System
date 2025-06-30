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
        <div v-if="currentResult.formattedSummary" class="result-summary">
          {{ currentResult.formattedSummary }}
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
                :class="`field-type-${cell.type}`"
              >
                <label>{{ formatColumnName(key) }}</label>
                <span class="field-value">{{ cell.display }}</span>
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
          <pre><code>{{ currentResult.query }}</code></pre>
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
import NaturalLanguageQueryService from '@/services/nlToSqlService'

export default {
  name: 'NaturalLanguageQuery',
  
  data() {
    return {
      queryText: '',
      loading: false,
      currentResult: null,
      queryHistory: [],
      insights: [],
      nlService: null,
      viewMode: 'cards', // 'cards' or 'table'
      suggestions: [
        "Show me all rabbits",
        "Which does are expected to kindle this month?",
        "Show me breeding plans",
        "How many rabbits do we have?",
        "Show me active rabbits",
        "Recent breeding activity"
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
        this.nlService = new NaturalLanguageQueryService(
          process.env.VUE_APP_SUPABASE_URL,
          process.env.VUE_APP_SUPABASE_ANON_KEY,
          process.env.VUE_APP_OPENAI_API_KEY
        )
        await this.nlService.initialize()
      } catch (error) {
        console.error('Failed to initialize NL service:', error)
      }
    },

    async executeQuery() {
      if (!this.queryText.trim() || this.loading) return

      this.loading = true
      try {
        // Use the enhanced formatting method
        let result = await this.nlService.queryFormatted(this.queryText.trim())
        
        // Ensure result is properly formatted (fallback safety)
        result = this.nlService.ensureFormatted(result)
        
        console.log("Enhanced result", result)
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
          originalQuery: this.queryText
        }
      } finally {
        this.loading = false
      }
    },

    async loadInsights() {
      if (!this.nlService) return
      
      try {
        this.insights = await this.nlService.getQuickInsights()
      } catch (error) {
        console.error('Failed to load insights:', error)
      }
    },

    rerunQuery(historyItem) {
      this.queryText = historyItem.originalQuery
      this.executeQuery()
    },

    formatColumnName(column) {
      return this.nlService?.formatColumnLabel(column) || 
             column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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

    formatTableCellValue(cellData) {
      // Handle the enhanced formatting structure
      if (cellData && typeof cellData === 'object' && cellData.display !== undefined) {
        return cellData.display
      }
      
      // Handle raw values that might not be formatted
      if (cellData === null || cellData === undefined) {
        return '—'
      }
      
      // Handle objects that need JSON formatting
      if (typeof cellData === 'object') {
        try {
          // If it's a simple object with just a few keys, try to display more nicely
          if (Object.keys(cellData).length <= 3) {
            return Object.values(cellData).join(', ')
          }
          return JSON.stringify(cellData, null, 2)
        } catch {
          return '[Complex Object]'
        }
      }
      
      // Handle arrays
      if (Array.isArray(cellData)) {
        return cellData.join(', ')
      }
      
      // Handle other primitive types
      if (typeof cellData === 'boolean') {
        return cellData ? 'Yes' : 'No'
      }
      
      if (typeof cellData === 'number') {
        return cellData.toLocaleString()
      }
      
      return String(cellData)
    }
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
</style> 