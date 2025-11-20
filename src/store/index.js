import { createStore } from 'vuex'

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

export default store

