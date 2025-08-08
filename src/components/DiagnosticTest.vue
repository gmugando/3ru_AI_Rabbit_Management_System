<template>
  <div class="diagnostic-test">
    <h3>System Diagnostic Test</h3>
    
    <div class="test-section">
      <h4>API Keys Status</h4>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">OpenAI API Key:</span>
          <span :class="['status', openaiStatus]">{{ openaiStatus }}</span>
        </div>
        <div class="status-item">
          <span class="label">Supabase URL:</span>
          <span :class="['status', supabaseStatus]">{{ supabaseStatus }}</span>
        </div>
        <div class="status-item">
          <span class="label">Weather API Key:</span>
          <span :class="['status', weatherStatus]">{{ weatherStatus }}</span>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h4>Agent Tests</h4>
      <button @click="testPdfAgent" :disabled="testing" class="test-btn">
        Test PDF Agent
      </button>
      <button @click="testRouterAgent" :disabled="testing" class="test-btn">
        Test Router Agent
      </button>
      <button @click="testOpenAI" :disabled="testing" class="test-btn">
        Test OpenAI Direct
      </button>
    </div>

    <div v-if="testResults.length" class="test-results">
      <h4>Test Results</h4>
      <div v-for="(result, index) in testResults" :key="index" class="test-result">
        <div class="result-header">
          <strong>{{ result.test }}</strong>
          <span :class="['result-status', result.success ? 'success' : 'error']">
            {{ result.success ? 'PASS' : 'FAIL' }}
          </span>
        </div>
        <div class="result-details">
          <pre>{{ result.details }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FarmManagementOrchestrator from '@/services/agentOrchestrator'
import apiConfig from '@/utils/apiConfig.js'

export default {
  name: 'DiagnosticTest',
  
  data() {
    return {
      testing: false,
      testResults: [],
      openaiStatus: 'Unknown',
      supabaseStatus: 'Unknown',
      weatherStatus: 'Unknown',
      orchestrator: null
    }
  },
  
  mounted() {
    this.checkApiKeys()
    this.initializeOrchestrator()
  },
  
  methods: {
    checkApiKeys() {
      const openaiKey = process.env.VUE_APP_OPENAI_API_KEY
      const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
      const weatherKey = process.env.VUE_APP_WEATHER_API_KEY
      
      this.openaiStatus = openaiKey ? 'Present' : 'Missing'
      this.supabaseStatus = supabaseUrl ? 'Present' : 'Missing'
      this.weatherStatus = weatherKey ? 'Present' : 'Optional'
      
      console.log('API Keys Check:', {
        openai: this.openaiStatus,
        supabase: this.supabaseStatus,
        weather: this.weatherStatus
      })
    },
    
    async initializeOrchestrator() {
      try {
        this.orchestrator = new FarmManagementOrchestrator(
          process.env.VUE_APP_SUPABASE_URL,
          process.env.VUE_APP_SUPABASE_ANON_KEY,
          process.env.VUE_APP_OPENAI_API_KEY,
          process.env.VUE_APP_WEATHER_API_KEY,
          process.env.VUE_APP_FARM_LOCATION
        )
        await this.orchestrator.initialize()
      } catch (error) {
        this.addTestResult('Orchestrator Initialization', false, error.message)
      }
    },
    
    async testOpenAI() {
      this.testing = true
      try {
        const response = await apiConfig.makeChatCompletionRequest(
          [
            { role: 'user', content: 'Say "Hello, OpenAI is working!"' }
          ],
          process.env.VUE_APP_OPENAI_API_KEY,
          {
            max_tokens: 20
          }
        )
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        this.addTestResult('OpenAI Direct API', true, result.choices[0].message.content)
        
      } catch (error) {
        this.addTestResult('OpenAI Direct API', false, error.message)
      } finally {
        this.testing = false
      }
    },
    
    async testRouterAgent() {
      this.testing = true
      try {
        if (!this.orchestrator) {
          throw new Error('Orchestrator not initialized')
        }
        
        const agents = await this.orchestrator.routerAgent.selectAgents('What does my manual say about housing?')
        this.addTestResult('Router Agent', true, `Selected agents: ${JSON.stringify(agents)}`)
        
      } catch (error) {
        this.addTestResult('Router Agent', false, error.message)
      } finally {
        this.testing = false
      }
    },
    
    async testPdfAgent() {
      this.testing = true
      try {
        if (!this.orchestrator) {
          throw new Error('Orchestrator not initialized')
        }
        
        const pdfAgent = this.orchestrator.agents.get('pdf')
        if (!pdfAgent) {
          throw new Error('PDF agent not found')
        }
        
        const result = await pdfAgent.processQuery('What are the housing requirements?')
        this.addTestResult('PDF Agent', result.success, result.success ? result.answer.substring(0, 200) + '...' : result.error)
        
      } catch (error) {
        this.addTestResult('PDF Agent', false, error.message)
      } finally {
        this.testing = false
      }
    },
    
    addTestResult(test, success, details) {
      this.testResults.unshift({
        test,
        success,
        details,
        timestamp: new Date().toLocaleTimeString()
      })
      
      // Keep only last 10 results
      if (this.testResults.length > 10) {
        this.testResults = this.testResults.slice(0, 10)
      }
    }
  }
}
</script>

<style scoped>
.diagnostic-test {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.test-section {
  margin-bottom: 30px;
}

.test-section h4 {
  margin: 0 0 15px 0;
  color: #374151;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f9fafb;
  border-radius: 8px;
}

.label {
  font-weight: 500;
  color: #374151;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status.Present {
  background: #dcfce7;
  color: #166534;
}

.status.Missing {
  background: #fef2f2;
  color: #dc2626;
}

.status.Optional {
  background: #fef3c7;
  color: #d97706;
}

.test-btn {
  margin-right: 10px;
  margin-bottom: 10px;
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.test-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.test-btn:hover:not(:disabled) {
  background: #45a049;
}

.test-results {
  margin-top: 30px;
}

.test-result {
  margin-bottom: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.result-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.result-status.success {
  background: #dcfce7;
  color: #166534;
}

.result-status.error {
  background: #fef2f2;
  color: #dc2626;
}

.result-details {
  padding: 15px;
}

.result-details pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
}
</style> 