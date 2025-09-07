<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <div class="forgot-password-header">
        <img src="@/assets/logo.png" alt="RMS Logo" class="forgot-password-logo">
        <h1>Reset Your Password</h1>
        <p class="subtitle">Enter your email address and we'll send you instructions to reset your password.</p>
      </div>
      <form @submit.prevent="handleForgotPassword" class="forgot-password-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            class="form-control"
            placeholder="Enter your email"
          >
        </div>
        <button type="submit" class="reset-button">
          Send Reset Instructions
        </button>

        <p class="back-to-login">
          Remember your password? <router-link to="/login">Back to Login</router-link>
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
import { useRouter } from 'vue-router'

export default {
  name: 'ForgotPassword',
  setup() {
    const router = useRouter()
    const email = ref('')

    const handleForgotPassword = async () => {
      // TODO: Implement actual password reset functionality
      alert('Password reset instructions have been sent to your email.')
      router.push('/login')
    }

    return {
      email,
      handleForgotPassword
    }
  }
}
</script>

<style scoped>
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
  padding: 2rem;
}

.forgot-password-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.forgot-password-header {
  text-align: center;
  margin-bottom: 2rem;
}

.forgot-password-logo {
  width: 150px;
  height: 80px;
  margin-bottom: 1rem;
}

.forgot-password-header h1 {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
}

.subtitle {
  color: #64748b;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.forgot-password-form {
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

.reset-button {
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

.reset-button:hover {
  background: #6366f1;
  transform: translateY(-1px);
}

.back-to-login {
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 1rem;
}

.back-to-login a {
  color: #3b82f6;
  text-decoration: none;
}

.back-to-login a:hover {
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

@media (max-width: 640px) {
  .forgot-password-card {
    padding: 1.5rem;
  }

  .forgot-password-header h1 {
    font-size: 1.25rem;
  }
}
</style> 