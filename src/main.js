import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import PrimeVue from 'primevue/config'
// import { createHead } from '@unhead/vue'
import 'primevue/resources/themes/saga-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import '@mdi/font/css/materialdesignicons.css'
import './mobile.css' // Mobile responsive quick wins
import analyticsService from './services/analytics'

// Initialize Google Analytics
analyticsService.init()

// Track page views on route changes
router.afterEach((to) => {
  analyticsService.trackPageView(to.meta.title || to.name, to.fullPath)
})

const app = createApp(App)
app.use(router)
app.use(store)
app.use(PrimeVue)
// app.use(createHead())

// Make analytics service available globally
app.config.globalProperties.$analytics = analyticsService

app.mount('#app')
