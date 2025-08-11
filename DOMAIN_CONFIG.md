# Domain Configuration Guide

This guide explains how to configure the site domain for different environments in the 3RU RMS application.

## Overview

The application now supports configurable domains through environment variables, making it easy to switch between development, staging, and production environments without hardcoding URLs.

## Environment Variables

### Required Configuration

Add the following environment variable to your `.env` file:

```env
VUE_APP_SITE_DOMAIN=https://your-domain.com
```

### Examples for Different Environments

```env
# Development
VUE_APP_SITE_DOMAIN=http://localhost:8080

# Staging
VUE_APP_SITE_DOMAIN=https://staging.3ru-rabbitry.co.za

# Production
VUE_APP_SITE_DOMAIN=https://3ru-rabbitry.co.za
```

## Features Using Domain Configuration

### 1. SEO Meta Tags
- Open Graph URLs
- Twitter Card URLs
- Canonical URLs
- Meta image URLs

### 2. Structured Data (JSON-LD)
- Organization schema
- Software application schema
- Breadcrumb schema
- FAQ schema

### 3. Social Media Sharing
- Facebook Open Graph
- Twitter Cards
- LinkedIn sharing

### 4. Contact Information
- Support email addresses
- Logo URLs
- Site URLs

## Usage in Code

### Using the Config Utility

```javascript
import { getDomain, getFullUrl, getEmailDomain } from '@/utils/config'

// Get the full domain
const domain = getDomain() // https://your-domain.com

// Get full URL for a path
const fullUrl = getFullUrl('/about') // https://your-domain.com/about

// Get email domain
const emailDomain = getEmailDomain() // your-domain.com

// Get support email
const supportEmail = `support@${getEmailDomain()}` // support@your-domain.com
```

### In Vue Components

```vue
<template>
  <div>
    <p>Contact us: support@{{ getEmailDomain() }}</p>
    <img :src="getFullUrl('/logo.png')" alt="Logo">
  </div>
</template>

<script>
import { getFullUrl, getEmailDomain } from '@/utils/config'

export default {
  methods: {
    getFullUrl,
    getEmailDomain
  }
}
</script>
```

### In SEO Service

```javascript
import seoService from '@/services/seo'

// The SEO service automatically uses the configured domain
seoService.updateMetaTags({
  title: 'Page Title',
  url: getFullUrl('/current-page')
})
```

## Configuration Validation

The config utility includes validation to ensure required environment variables are set:

```javascript
import { validateConfig } from '@/utils/config'

const validation = validateConfig()
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors)
}
```

## Deployment Configuration

### GitHub Actions

The GitHub workflow automatically includes the domain configuration:

```yaml
env:
  VUE_APP_SITE_DOMAIN: ${{ secrets.VUE_APP_SITE_DOMAIN }}
```

### Manual Deployment

Ensure your production environment has the correct domain set:

```bash
export VUE_APP_SITE_DOMAIN=https://your-production-domain.com
npm run build
```

## Best Practices

1. **Always use the config utility** instead of hardcoding URLs
2. **Set different domains** for different environments
3. **Use HTTPS** for production domains
4. **Include trailing slashes** in your domain configuration if needed
5. **Test social sharing** after domain changes

## Troubleshooting

### Common Issues

1. **Social media cards not working**
   - Verify the domain is accessible
   - Check that meta tags are being generated correctly
   - Test with Facebook Debugger or Twitter Card Validator

2. **SEO not working**
   - Ensure canonical URLs are correct
   - Check structured data with Google's Rich Results Test
   - Verify meta tags are present in page source

3. **Email links broken**
   - Confirm the email domain is correctly extracted
   - Test email functionality after domain changes

### Debug Commands

```javascript
// Check current domain configuration
console.log('Domain:', getDomain())
console.log('Full URL:', getFullUrl('/test'))
console.log('Email domain:', getEmailDomain())

// Validate configuration
const validation = validateConfig()
console.log('Config valid:', validation.isValid)
```

## Migration from Hardcoded URLs

If you have existing hardcoded URLs in your codebase, replace them with the config utility:

```javascript
// Before
const url = 'https://3ru-rabbitry.co.za/about'

// After
const url = getFullUrl('/about')
```

This makes your application more flexible and easier to deploy to different environments.
