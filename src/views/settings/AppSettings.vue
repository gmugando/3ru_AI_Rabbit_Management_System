<template>
  <div class="settings-page">
    <div class="page-header">
      <div>
        <h1>Settings</h1>
        <p class="subtitle">Manage your account and system preferences</p>
      </div>
      <div class="header-actions">
        <button class="primary-button" @click="saveAllChanges" :disabled="loading">
          <i class="pi pi-save"></i>
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <div class="settings-grid">
      <!-- Settings Navigation -->
      <div class="settings-nav">
        <div class="content-card">
          <div class="nav-section">
            <h3>User Settings</h3>
            <div class="nav-items">
              <a href="#profile" class="nav-item active">
                <i class="pi pi-user"></i>
                Profile
              </a>
              <a href="#security" class="nav-item">
                <i class="pi pi-lock"></i>
                Security
              </a>
              <a href="#notifications" class="nav-item">
                <i class="pi pi-bell"></i>
                Notifications
              </a>
            </div>
          </div>

          <div class="nav-section">
            <h3>System Settings</h3>
            <div class="nav-items">
              <!--<button class="nav-item">
                <i class="pi pi-tag"></i>
                Labels & Tags
              </button>
              <button class="nav-item">
                <i class="pi pi-calendar"></i>
                Schedule
              </button>-->
              <router-link to="/preferences" class="nav-item">
                <i class="pi pi-cog"></i>
                Preferences
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="settings-content">
        <!-- Profile Settings -->
        <div id="profile" class="content-card">
          <div class="card-header">
            <h2>Profile Settings</h2>
          </div>
          
          <div v-if="loading" class="loading-section">
            <div class="loading-spinner"></div>
            <p>Loading profile data...</p>
          </div>

          <div v-else-if="error" class="error-section">
            <p class="error-message">{{ error }}</p>
            <button class="secondary-button" @click="loadUserProfile">Retry</button>
          </div>

          <div v-else class="profile-section">
            <div class="avatar-section">
              <div class="avatar">
                <img :src="userProfile.avatarUrl || `https://api.dicebear.com/7.x/personas/svg?seed=${userProfile.firstName}&backgroundColor=ffffff&scale=80&mood=happy`" alt="Profile">
                <button class="avatar-upload">
                  <i class="pi pi-camera"></i>
                </button>
              </div>
              <button class="secondary-button">Change Photo</button>
            </div>

            <div class="form-section">
              <div class="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  v-model="userProfile.firstName" 
                  placeholder="First Name" 
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  v-model="userProfile.lastName" 
                  placeholder="Last Name" 
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  :value="userProfile.email" 
                  class="form-control" 
                  disabled
                >
              </div>

              <div class="form-group">
                <label>Role</label>
                <input 
                  type="text" 
                  :value="userProfile.role" 
                  class="form-control" 
                  disabled
                >
              </div>

              <div class="form-group">
                <label>Phone</label>
                <input 
                  type="tel" 
                  v-model="userProfile.phone" 
                  placeholder="+27 74 079 8159" 
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label>Organization</label>
                <input 
                  type="text" 
                  v-model="userProfile.organization" 
                  placeholder="Your Organization" 
                  class="form-control"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Security Settings -->
        <div id="security" class="content-card">
          <div class="card-header">
            <h2>Security Settings</h2>
          </div>

          <div class="security-section">
            <div class="form-group">
              <label>Current Password</label>
              <input type="password" v-model="securityForm.currentPassword" class="form-control">
            </div>

            <div class="form-group">
              <label>New Password</label>
              <input type="password" v-model="securityForm.newPassword" class="form-control">
            </div>

            <div class="form-group">
              <label>Confirm New Password</label>
              <input type="password" v-model="securityForm.confirmPassword" class="form-control">
            </div>

            <div class="security-options">
              <h3>Two-Factor Authentication</h3>
              <div class="toggle-option">
                <div>
                  <h4>Enable 2FA</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="securityForm.enable2FA">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Notification Settings -->
        <div id="notifications" class="content-card">
          <div class="card-header">
            <h2>Notification Preferences</h2>
          </div>

          <div class="notification-section">
            <div class="notification-group">
              <h3>Email Notifications</h3>
              <div class="toggle-option">
                <div>
                  <h4>Breeding Events</h4>
                  <p>Get notified about breeding schedules and births</p>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notificationPreferences.breeding_alerts">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="toggle-option">
                <div>
                  <h4>Health Alerts</h4>
                  <p>Receive alerts about health checks and vaccinations</p>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notificationPreferences.health_alerts">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="toggle-option">
                <div>
                  <h4>Stock Alerts</h4>
                  <p>Get notified when supplies are running low</p>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notificationPreferences.stock_alerts">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import userProfileService from '@/services/userProfile'

export default {
  name: 'AppSettings',
  setup() {
    const loading = ref(false)
    const error = ref('')
    const successMessage = ref('')

    // User profile data
    const userProfile = reactive({
      id: '',
      email: '',
      firstName: '',
      lastName: '',
      fullName: '',
      phone: '',
      organization: '',
      role: '',
      avatarUrl: null,
      roleId: null
    })

    // Security form
    const securityForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      enable2FA: false
    })

    // Notification preferences
    const notificationPreferences = reactive({
      breeding_alerts: true,
      health_alerts: true,
      stock_alerts: false
    })

    const loadUserProfile = async () => {
      try {
        loading.value = true
        error.value = ''

        // Load user profile
        const profile = await userProfileService.getCurrentUserProfile()
        Object.assign(userProfile, profile)

        // Load user preferences
        const preferences = await userProfileService.getUserPreferences()
        if (preferences) {
          Object.assign(notificationPreferences, {
            breeding_alerts: preferences.breeding_alerts,
            health_alerts: preferences.health_alerts,
            stock_alerts: preferences.stock_alerts
          })
        }

      } catch (err) {
        console.error('Error loading user profile:', err)
        error.value = 'Failed to load profile data: ' + err.message
      } finally {
        loading.value = false
      }
    }

    const saveAllChanges = async () => {
      try {
        loading.value = true
        error.value = ''

        // Save profile changes
        await userProfileService.updateUserProfile({
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          phone: userProfile.phone,
          organization: userProfile.organization,
          avatarUrl: userProfile.avatarUrl
        })

        // Save notification preferences
        await userProfileService.updateUserPreferences(notificationPreferences)

        // Save password if provided
        if (securityForm.newPassword && securityForm.newPassword === securityForm.confirmPassword) {
          await userProfileService.updateUserPassword(securityForm.currentPassword, securityForm.newPassword)
          // Clear password fields
          securityForm.currentPassword = ''
          securityForm.newPassword = ''
          securityForm.confirmPassword = ''
        }

        successMessage.value = 'Settings saved successfully!'
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          successMessage.value = ''
        }, 3000)

      } catch (err) {
        console.error('Error saving settings:', err)
        error.value = 'Failed to save settings: ' + err.message
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadUserProfile()
    })

    return {
      loading,
      error,
      successMessage,
      userProfile,
      securityForm,
      notificationPreferences,
      loadUserProfile,
      saveAllChanges
    }
  }
}
</script>

<style scoped>
.settings-page {
  padding: 1.5rem;
  scroll-behavior: smooth;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.subtitle {
  color: #64748b;
  margin-top: 0.5rem;
}

.primary-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-button:hover:not(:disabled) {
  background: #2563eb;
}

.primary-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.secondary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.secondary-button:hover {
  background: #f8fafc;
}

.settings-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
}

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
}

.error-message {
  color: #ef4444;
  text-align: center;
  margin: 0;
}

.nav-section {
  margin-bottom: 2rem;
}

.nav-section:last-child {
  margin-bottom: 0;
}

.nav-section h3 {
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  text-align: left;
  text-decoration: none;
}

.nav-item:hover {
  background: #f8fafc;
  color: #1e293b;
}

.nav-item.active {
  background: #eff6ff;
  color: #3b82f6;
}

.card-header {
  margin-bottom: 1.5rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.profile-section {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.avatar {
  position: relative;
  width: 100px;
  height: 100px;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-upload:hover {
  background: #2563eb;
}

.form-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  color: #1e293b;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-control:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

.security-section,
.notification-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.security-options,
.notification-group {
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.security-options h3,
.notification-group h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #1e293b;
}

.toggle-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.toggle-option h4 {
  margin: 0;
  color: #1e293b;
}

.toggle-option p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e2e8f0;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

@media (max-width: 1024px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .settings-nav {
    margin-bottom: 1.5rem;
  }

  .nav-items {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .nav-item {
    width: auto;
  }
}

@media (max-width: 768px) {
  .profile-section {
    grid-template-columns: 1fr;
  }

  .avatar-section {
    margin-bottom: 1.5rem;
  }

  .form-section {
    grid-template-columns: 1fr;
  }

  .toggle-option {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style> 