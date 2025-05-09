import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createStore } from 'vuex'
import PrimeVue from 'primevue/config'
import 'primevue/resources/themes/saga-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import '@mdi/font/css/materialdesignicons.css'

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

const app = createApp(App)
app.use(router)
app.use(store)
app.use(PrimeVue)
app.mount('#app')
