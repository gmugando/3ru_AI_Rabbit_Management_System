// Google Analytics Service
class AnalyticsService {
  constructor() {
    this.isInitialized = false
    this.trackingId = process.env.VUE_APP_GA_TRACKING_ID || 'G-XXXXXXXXXX'
  }

  // Initialize Google Analytics
  init() {
    if (this.isInitialized || !window.gtag) {
      return
    }

    try {
      // Configure GA4
      window.gtag('config', this.trackingId, {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: false // We'll handle page views manually
      })
      
      this.isInitialized = true
      console.log('Google Analytics initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error)
    }
  }

  // Track page view
  trackPageView(pageTitle, pagePath) {
    if (!this.isInitialized || !window.gtag) {
      return
    }

    try {
      window.gtag('config', this.trackingId, {
        page_title: pageTitle || document.title,
        page_location: pagePath || window.location.href,
        page_path: pagePath || window.location.pathname
      })
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }

  // Track custom events
  trackEvent(eventName, parameters = {}) {
    if (!this.isInitialized || !window.gtag) {
      return
    }

    try {
      window.gtag('event', eventName, parameters)
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  // Track user engagement
  trackUserEngagement(action, label, value) {
    this.trackEvent('user_engagement', {
      action: action,
      label: label,
      value: value
    })
  }

  // Track button clicks
  trackButtonClick(buttonName, location = 'unknown') {
    this.trackEvent('button_click', {
      button_name: buttonName,
      location: location
    })
  }

  // Track form submissions
  trackFormSubmission(formName, success = true) {
    this.trackEvent('form_submit', {
      form_name: formName,
      success: success
    })
  }

  // Track user registration
  trackRegistration(method = 'email') {
    this.trackEvent('sign_up', {
      method: method
    })
  }

  // Track user login
  trackLogin(method = 'email') {
    this.trackEvent('login', {
      method: method
    })
  }

  // Track feature usage
  trackFeatureUsage(featureName, action = 'view') {
    this.trackEvent('feature_usage', {
      feature_name: featureName,
      action: action
    })
  }

  // Track error events
  trackError(errorType, errorMessage, errorCode = null) {
    this.trackEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      error_code: errorCode
    })
  }

  // Set user properties
  setUserProperties(properties) {
    if (!this.isInitialized || !window.gtag) {
      return
    }

    try {
      window.gtag('config', this.trackingId, {
        user_properties: properties
      })
    } catch (error) {
      console.error('Failed to set user properties:', error)
    }
  }

  // Set user ID
  setUserId(userId) {
    if (!this.isInitialized || !window.gtag) {
      return
    }

    try {
      window.gtag('config', this.trackingId, {
        user_id: userId
      })
    } catch (error) {
      console.error('Failed to set user ID:', error)
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService()

export default analyticsService
