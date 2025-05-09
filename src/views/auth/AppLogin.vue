<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="@/assets/logo.png" alt="RMS Logo" class="login-logo">
        <h1>3RU Rabbit Management System</h1>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            class="form-control"
            placeholder="Enter your email"
            :disabled="isLoading"
          >
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            class="form-control"
            placeholder="Enter your password"
            :disabled="isLoading"
          >
          <router-link to="/forgot-password" class="forgot-password">
            Forgot Password?
          </router-link>
        </div>
        <button 
          type="submit" 
          class="login-button"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>

        <p class="register-link">
          Don't have an account? <router-link to="/register">Register here</router-link>
        </p>
        <p class="home-link">
          <router-link to="/">
            <i class="pi pi-arrow-left"></i> Back to Home
          </router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'AppLogin',
  setup() {
    const store = useStore()
    const router = useRouter()
    const email = ref('')
    const password = ref('')
    const errorMessage = ref('')
    const isLoading = ref(false)

    const handleLogin = async () => {
      try {
        isLoading.value = true
        errorMessage.value = ''

        const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value,
        })

        if (error) throw error

        // Get user profile and role from profiles table
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            organization,
            role_id,
            roles (
              name
            )
          `)
          .eq('user_id', user.id)
          .limit(1)

        if (profileError) throw profileError

        if (!profiles || profiles.length === 0) {
          throw new Error('Profile not found')
        }

        const profile = profiles[0]

        // Store user data in Vuex
        store.commit('setUser', {
          id: user.id,
          email: user.email,
          name: `${profile.first_name} ${profile.last_name}`,
          role: profile.roles.name,
          organization: profile.organization
        })

        router.push('/dashboard')
      } catch (error) {
        errorMessage.value = error.message
      } finally {
        isLoading.value = false
      }
    }

    return {
      email,
      password,
      errorMessage,
      isLoading,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
  padding: 2rem;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.login-header h1 {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  color: #64748b;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.login-button {
  background: #4f46e5;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.login-button:hover {
  background: #6366f1;
  transform: translateY(-1px);
}

.register-link {
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 1rem;
}

.register-link a {
  display: inline-block;
  padding: 0.5rem 1rem;
  color: #4f46e5;
  text-decoration: none;
  border: 1px solid #4f46e5;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.register-link a:hover {
  background: rgba(79, 70, 229, 0.1);
}

.home-link {
  text-align: center;
  font-size: 0.875rem;
  margin-top: 1rem;
}

.home-link a {
  color: #64748b;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.3s ease;
}

.home-link a:hover {
  color: #3b82f6;
}

.forgot-password {
  font-size: 0.875rem;
  color: #3b82f6;
  text-decoration: none;
  margin-top: 0.25rem;
  display: inline-block;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #2563eb;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .login-card {
    padding: 1.5rem;
  }

  .login-header h1 {
    font-size: 1.25rem;
  }
}

.error-message {
  background: #fee2e2;
  color: #ef4444;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.login-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
}
</style> 