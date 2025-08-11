// Configuration utility for environment variables and site settings

const config = {
  // Supabase Configuration
  supabase: {
    url: process.env.VUE_APP_SUPABASE_URL,
    anonKey: process.env.VUE_APP_SUPABASE_ANON_KEY
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.VUE_APP_OPENAI_API_KEY
  },

  // Site Configuration
  site: {
    domain: process.env.VUE_APP_SITE_DOMAIN || 'https://3ru-rabbitry.co.za',
    name: '3RU RMS',
    description: 'AI-Powered Rabbit Management System'
  },

  // Analytics Configuration
  analytics: {
    trackingId: process.env.VUE_APP_GA_TRACKING_ID
  },

  // Additional Configuration
  weather: {
    apiKey: process.env.VUE_APP_WEATHER_API_KEY
  },

  farm: {
    location: process.env.VUE_APP_FARM_LOCATION
  }
}

// Helper methods for domain operations
export const getDomain = () => config.site.domain

export const getFullUrl = (path = '') => {
  const domain = getDomain()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${domain}${cleanPath}`
}

export const getImageUrl = (imagePath) => {
  return getFullUrl(imagePath)
}

export const getCanonicalUrl = (path = '') => {
  return getFullUrl(path)
}

// Helper method to get email domain from site domain
export const getEmailDomain = () => {
  const domain = getDomain()
  return domain.replace('https://', '').replace('http://', '')
}

// Helper method to get support email
export const getSupportEmail = () => {
  return `support@${getEmailDomain()}`
}

// Validation methods
export const validateConfig = () => {
  const errors = []
  
  if (!config.supabase.url) {
    errors.push('VUE_APP_SUPABASE_URL is required')
  }
  
  if (!config.supabase.anonKey) {
    errors.push('VUE_APP_SUPABASE_ANON_KEY is required')
  }
  
  if (!config.openai.apiKey) {
    errors.push('VUE_APP_OPENAI_API_KEY is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Development helpers
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development'
}

export const isProduction = () => {
  return process.env.NODE_ENV === 'production'
}

export default config
