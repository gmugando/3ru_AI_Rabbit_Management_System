import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createStore } from 'vuex'
import PrimeVue from 'primevue/config'
// import { createHead } from '@unhead/vue'
import 'primevue/resources/themes/saga-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import '@mdi/font/css/materialdesignicons.css'
import analyticsService from './services/analytics'

// Vuex store configuration
const store = createStore({
    state() {
        return {
            user: null,
            tenant: null,
            isAuthenticated: false
        }
    },
    mutations: {
        setUser(state, user) {
            state.user = user
            state.isAuthenticated = !!user
        },
        setTenant(state, tenant) {
            state.tenant = tenant
        }
    }
})

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
