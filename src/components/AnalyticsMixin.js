// Analytics Mixin for Vue Components
import analyticsService from '../services/analytics'

export default {
  methods: {
    // Track button clicks
    trackButtonClick(buttonName, location = 'unknown') {
      analyticsService.trackButtonClick(buttonName, location)
    },

    // Track form submissions
    trackFormSubmission(formName, success = true) {
      analyticsService.trackFormSubmission(formName, success)
    },

    // Track user registration
    trackRegistration(method = 'email') {
      analyticsService.trackRegistration(method)
    },

    // Track user login
    trackLogin(method = 'email') {
      analyticsService.trackLogin(method)
    },

    // Track feature usage
    trackFeatureUsage(featureName, action = 'view') {
      analyticsService.trackFeatureUsage(featureName, action)
    },

    // Track custom events
    trackEvent(eventName, parameters = {}) {
      analyticsService.trackEvent(eventName, parameters)
    },

    // Track errors
    trackError(errorType, errorMessage, errorCode = null) {
      analyticsService.trackError(errorType, errorMessage, errorCode)
    },

    // Set user properties
    setUserProperties(properties) {
      analyticsService.setUserProperties(properties)
    },

    // Set user ID
    setUserId(userId) {
      analyticsService.setUserId(userId)
    }
  }
}
