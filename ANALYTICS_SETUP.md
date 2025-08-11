# Google Analytics Setup Guide

This guide will help you set up Google Analytics 4 (GA4) for your Vue.js application.

## 🚀 Quick Setup

### 1. Create Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click "Start measuring"
3. Follow the setup wizard to create your account and property
4. Note down your **Measurement ID** (starts with "G-")

### 2. Configure Environment Variables

Create a `.env` file in your project root:

```env
# Google Analytics Configuration
VUE_APP_GA_TRACKING_ID=G-XXXXXXXXXX

# Site Domain Configuration (for SEO and social sharing)
VUE_APP_SITE_DOMAIN=https://your-domain.com
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

### 3. Update Tracking Code

In `public/index.html`, replace the placeholder tracking ID:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 📊 Features Included

### Automatic Tracking
- ✅ Page views (via Vue Router)
- ✅ User sessions
- ✅ Device and browser information
- ✅ Traffic sources

### Custom Event Tracking
- ✅ Button clicks
- ✅ Form submissions
- ✅ User registrations and logins
- ✅ Feature usage
- ✅ Error tracking
- ✅ Custom events

## 🛠 Usage Examples

### In Vue Components

```vue
<template>
  <div>
    <button @click="handleButtonClick">Get Started</button>
    <form @submit="handleFormSubmit">
      <!-- form content -->
    </form>
  </div>
</template>

<script>
import AnalyticsMixin from '@/components/AnalyticsMixin'

export default {
  mixins: [AnalyticsMixin],
  methods: {
    handleButtonClick() {
      this.trackButtonClick('get_started_button', 'landing_page')
    },
    
    handleFormSubmit() {
      this.trackFormSubmission('registration_form', true)
    },
    
    onUserLogin() {
      this.trackLogin('email')
      this.setUserId('user123')
    }
  }
}
</script>
```

### Using Global Analytics Service

```javascript
// In any component
export default {
  mounted() {
    this.$analytics.trackFeatureUsage('dashboard', 'view')
  },
  
  methods: {
    trackCustomEvent() {
      this.$analytics.trackEvent('custom_action', {
        category: 'user_action',
        value: 100
      })
    }
  }
}
```

## 📈 Available Tracking Methods

### Page Tracking
```javascript
analyticsService.trackPageView('Home Page', '/home')
```

### Event Tracking
```javascript
analyticsService.trackEvent('button_click', {
  button_name: 'register',
  location: 'header'
})
```

### User Tracking
```javascript
analyticsService.setUserId('user123')
analyticsService.setUserProperties({
  user_type: 'premium',
  subscription_plan: 'pro'
})
```

### Error Tracking
```javascript
analyticsService.trackError('api_error', 'Failed to fetch data', 500)
```

## 🔧 Configuration Options

### Environment-Specific Tracking

Create different `.env` files for different environments:

```env
# .env.development
VUE_APP_GA_TRACKING_ID=G-DEVXXXXXXXX
VUE_APP_SITE_DOMAIN=http://localhost:8080

# .env.production
VUE_APP_GA_TRACKING_ID=G-PRODXXXXXXXX
VUE_APP_SITE_DOMAIN=https://3ru-rabbitry.co.za
```

### Disable Analytics in Development

Add to your analytics service:

```javascript
// In analytics.js
if (process.env.NODE_ENV === 'development') {
  console.log('Analytics disabled in development mode')
  return
}
```

## 📋 Testing

### 1. Check Console
Look for "Google Analytics initialized successfully" in browser console.

### 2. Real-Time Reports
1. Go to Google Analytics
2. Navigate to Reports → Realtime
3. Check if your page views appear

### 3. Debug Mode
Add this to your tracking code for debugging:

```javascript
gtag('config', 'G-XXXXXXXXXX', {
  debug_mode: true
})
```

## 🚨 Privacy Considerations

### GDPR Compliance
- Add cookie consent banner
- Respect user privacy preferences
- Anonymize IP addresses if required

### Cookie Notice
Add to your privacy policy:
"We use Google Analytics to understand how visitors interact with our website."

## 🔍 Troubleshooting

### Common Issues

1. **No data appearing**
   - Check tracking ID is correct
   - Verify no ad blockers are active
   - Check browser console for errors

2. **Page views not tracking**
   - Ensure Vue Router is properly configured
   - Check route meta titles are set

3. **Events not firing**
   - Verify analytics service is initialized
   - Check for JavaScript errors

### Debug Commands

```javascript
// Check if gtag is loaded
console.log(window.gtag)

// Check dataLayer
console.log(window.dataLayer)

// Manual event test
gtag('event', 'test_event', { test: true })
```

## 📚 Additional Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Vue.js Analytics Guide](https://vuejs.org/guide/extras/ways-of-using-vue.html#analytics)
- [Privacy Best Practices](https://developers.google.com/analytics/devguides/collection/ga4/privacy)

## 🎯 Next Steps

1. Set up conversion goals in Google Analytics
2. Configure custom dimensions and metrics
3. Set up Google Analytics 4 Enhanced Ecommerce (if applicable)
4. Create custom dashboards and reports
5. Set up automated reporting
