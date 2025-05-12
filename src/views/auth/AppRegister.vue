<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <img src="@/assets/logo.png" alt="RMS Logo" class="register-logo">
        <h1>Join 3RU Rabbit Management System</h1>
        <p class="subtitle">Create your account to get started</p>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div class="user-type-selector">
        <button 
          :class="['type-button', { active: userType === 'single' }]"
          @click="userType = 'single'"
          type="button"
        >
          <i class="pi pi-user"></i>
          <div class="type-content">
            <h3>Single User</h3>
            <p>Individual rabbit farmer</p>
          </div>
        </button>
        <button 
          :class="['type-button', { active: userType === 'tenant' }]"
          @click="userType = 'tenant'"
          type="button"
        >
          <i class="pi pi-building"></i>
          <div class="type-content">
            <h3>Business/Organization</h3>
            <p>Multiple users & locations</p>
          </div>
        </button>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-grid">
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input 
              type="text" 
              id="firstName" 
              v-model="form.firstName" 
              required 
              class="form-control"
              placeholder="Enter your first name"
              :disabled="isLoading"
            >
          </div>
          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input 
              type="text" 
              id="lastName" 
              v-model="form.lastName" 
              required 
              class="form-control"
              placeholder="Enter your last name"
              :disabled="isLoading"
            >
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            required 
            class="form-control"
            placeholder="Enter your email"
            :disabled="isLoading"
          >
        </div>

        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="form.phone" 
            required 
            class="form-control"
            placeholder="Enter your phone number"
            :disabled="isLoading"
          >
        </div>

        <div v-if="userType === 'tenant'" class="form-group">
          <label for="organization">Organization Name</label>
          <input 
            type="text" 
            id="organization" 
            v-model="form.organization" 
            required 
            class="form-control"
            placeholder="Enter your organization name"
            :disabled="isLoading"
          >
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="form.password" 
              required 
              class="form-control"
              placeholder="Create a password"
              :disabled="isLoading"
            >
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="form.confirmPassword" 
              required 
              class="form-control"
              placeholder="Confirm your password"
              :disabled="isLoading"
            >
          </div>
        </div>

        <div class="form-group terms">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="form.acceptTerms"
              required
              :disabled="isLoading"
            >
            <span>I agree to the <a href="#" class="terms-link">Terms of Service</a> and <a href="#" class="terms-link">Privacy Policy</a></span>
          </label>
        </div>

        <button 
          type="submit" 
          class="register-button"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>

        <p class="login-link">
          Already have an account? <router-link to="/login" class="btn-login">Login here</router-link>
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { supabase } from '@/supabase'

export default {
  name: 'AppRegister',
  setup() {
    const router = useRouter()
    const store = useStore()
    const userType = ref('single')
    const errorMessage = ref('')
    const isLoading = ref(false)
    const form = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organization: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    })

    const handleRegister = async () => {
      try {
        if (form.password !== form.confirmPassword) {
          errorMessage.value = 'Passwords do not match'
          return
        }

        if (!form.acceptTerms) {
          errorMessage.value = 'Please accept the Terms of Service and Privacy Policy'
          return
        }

        isLoading.value = true
        errorMessage.value = ''

        // Get role ID based on user type
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('name', userType.value === 'tenant' ? 'TENANT_ADMIN' : 'USER')
          .single()

        if (roleError) throw roleError

        // Register user with Supabase Auth
        const { data: { user }, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              first_name: form.firstName,
              last_name: form.lastName,
              phone: form.phone,
              organization: userType.value === 'tenant' ? form.organization : null,
              role: userType.value === 'tenant' ? 'TENANT_ADMIN' : 'USER'
            }
          }
        })

        if (authError) throw authError

        // Create user profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: user.id,
              first_name: form.firstName,
              last_name: form.lastName,
              phone: form.phone,
              organization: userType.value === 'tenant' ? form.organization : null,
              role_id: roleData.id,
              status: 'active'
            }
          ])

        console.log(roleData)
        console.log(user)
        console.log(form)
        console.log(profileError)

        if (profileError) throw profileError

        // Show success message and redirect to login
        store.commit('setNotification', {
          type: 'success',
          message: 'Registration successful! Please check your email to verify your account.'
        })

        router.push('/login')
      } catch (error) {
        errorMessage.value = error.message
      } finally {
        isLoading.value = false
      }
    }

    return {
      userType,
      form,
      errorMessage,
      isLoading,
      handleRegister
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
  padding: 2rem;
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.register-header h1 {
  font-size: 1.75rem;
  color: #1e293b;
  margin: 0;
}

.subtitle {
  color: #64748b;
  margin-top: 0.5rem;
}

.user-type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.type-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.type-button:hover {
  background: #f1f5f9;
}

.type-button.active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.type-button i {
  font-size: 1.5rem;
  color: #3b82f6;
}

.type-content h3 {
  margin: 0;
  font-size: 1rem;
  color: #1e293b;
}

.type-content p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.terms {
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
}

.terms-link {
  color: #3b82f6;
  text-decoration: none;
}

.terms-link:hover {
  text-decoration: underline;
}

.register-button {
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

.register-button:hover {
  background: #6366f1;
  transform: translateY(-1px);
}

.login-link {
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 1rem;
}

.login-link a {
  color: #3b82f6;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
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

.error-message {
  background: #fee2e2;
  color: #ef4444;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.register-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

.form-control:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .register-card {
    padding: 1.5rem;
  }

  .user-type-selector {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .register-header h1 {
    font-size: 1.5rem;
  }
}
</style> 