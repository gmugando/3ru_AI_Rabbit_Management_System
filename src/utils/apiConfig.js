/**
 * Centralized API Configuration
 * 
 * Simple utility for configuring LLM API endpoints.
 * Works with any OpenAI-compatible API (OpenAI, Ollama, DeepSeek, Kimi, etc.)
 */

class ApiConfig {
  constructor() {
    // Default to OpenAI API, override with environment variable
    this.completionsUrl = process.env.VUE_APP_CHAT_COMPLETIONS_URL || 'https://api.openai.com/v1/chat/completions'
    this.defaultModel = process.env.VUE_APP_LLM_MODEL || 'gpt-4'
    
    console.log('API Config initialized:', {
      completionsUrl: this.completionsUrl,
      defaultModel: this.defaultModel
    })
  }

  /**
   * Get the chat completions endpoint URL
   * @returns {string} The API endpoint URL
   */
  getCompletionsUrl() {
    return this.completionsUrl
  }

  /**
   * Get the default model name
   * @returns {string} The default model name
   */
  getDefaultModel() {
    return this.defaultModel
  }

  /**
   * Make a chat completion request
   * @param {Array} messages - Array of message objects
   * @param {string} apiKey - API key (optional for some providers)
   * @param {Object} options - Additional options (model, temperature, max_tokens, etc.)
   * @returns {Promise} Fetch response
   */
  async makeChatCompletionRequest(messages, apiKey, options = {}) {
    const requestBody = {
      model: options.model || this.defaultModel,
      messages: messages,
      temperature: options.temperature || 0.3,
      max_tokens: options.max_tokens || 1000,
      ...options
    }

    const headers = {
      'Content-Type': 'application/json'
    }

    // Add Authorization header if API key is provided
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    console.log('Making chat completion request:', {
      url: this.completionsUrl,
      model: requestBody.model
    })

    return fetch(this.completionsUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    })
  }
}

// Create and export a singleton instance
const apiConfig = new ApiConfig()
export default apiConfig 