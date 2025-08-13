<template>
  <div class="preferences-page">
    <div class="page-header">
      <div>
        <h1>Preferences</h1>
        <p class="subtitle">Customize your farm management experience</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="resetToDefaults" :disabled="loading">
          <i class="pi pi-refresh"></i>
          Reset to Defaults
        </button>
        <button class="primary-button" @click="savePreferences" :disabled="loading">
          <i class="pi pi-save"></i>
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <i class="pi pi-exclamation-triangle"></i>
      {{ error }}
    </div>

    <div v-if="successMessage" class="success-message">
      <i class="pi pi-check"></i>
      {{ successMessage }}
    </div>

    <div class="preferences-content">
      <!-- Farm Settings -->
      <div class="content-card">
        <div class="card-header">
          <h2>Farm Settings</h2>
          <p>Configure your farm information and location</p>
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label>Farm Name</label>
            <input 
              type="text" 
              v-model="preferences.farm_name" 
              placeholder="Enter your farm name"
              class="form-control"
            >
          </div>

          <div class="form-group">
            <label>Farm Location</label>
            <input 
              type="text" 
              v-model="preferences.farm_location" 
              placeholder="City, State/Country"
              class="form-control"
            >
            <small>Used for weather forecasts and regional settings</small>
          </div>

          <div class="form-group full-width">
            <label>Farm Address</label>
            <textarea 
              v-model="preferences.farm_address" 
              placeholder="Full farm address (optional)"
              class="form-control"
              rows="2"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Display Preferences -->
      <div class="content-card">
        <div class="card-header">
          <h2>Display Preferences</h2>
          <p>Customize how information is displayed</p>
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label>Temperature Unit</label>
            <select v-model="preferences.temperature_unit" class="form-control">
              <option value="fahrenheit">Fahrenheit (°F)</option>
              <option value="celsius">Celsius (°C)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Date Format</label>
            <select v-model="preferences.date_format" class="form-control">
              <option value="MM/dd/yyyy">MM/DD/YYYY (US)</option>
              <option value="dd/MM/yyyy">DD/MM/YYYY (EU)</option>
              <option value="yyyy-MM-dd">YYYY-MM-DD (ISO)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Time Format</label>
            <select v-model="preferences.time_format" class="form-control">
              <option value="12h">12 Hour (AM/PM)</option>
              <option value="24h">24 Hour</option>
            </select>
          </div>

          <div class="form-group">
            <label>Currency</label>
            <select v-model="preferences.currency" class="form-control">
              <option value="USD">US Dollar ($)</option>
              <option value="ZAR">South African Rand (R)</option>
              <option value="GBP">British Pound (£)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Items Per Page</label>
            <select v-model="preferences.items_per_page" class="form-control">
              <option :value="10">10 items</option>
              <option :value="25">25 items</option>
              <option :value="50">50 items</option>
              <option :value="100">100 items</option>
            </select>
          </div>

          <div class="form-group">
            <label>Default Dashboard View</label>
            <select v-model="preferences.default_dashboard_view" class="form-control">
              <option value="overview">Overview</option>
              <option value="rabbits">Rabbits</option>
              <option value="breeding">Breeding</option>
              <option value="finance">Finance</option>
            </select>
          </div>

          <div class="form-group">
            <label>Time Zone</label>
            <select v-model="preferences.timezone" class="form-control">
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
              <option value="Australia/Sydney">Sydney (AEDT)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Weather Integration -->
      <div class="content-card">
        <div class="card-header">
          <h2>Weather Integration</h2>
          <p>Configure weather data and alerts</p>
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label>Show Weather Widget</label>
            <label class="switch">
              <input type="checkbox" v-model="preferences.show_weather_widget">
              <span class="slider"></span>
            </label>
          </div>

          <div class="form-group">
            <label>Weather Update Frequency</label>
            <select v-model="preferences.weather_update_frequency" class="form-control">
              <option :value="15">Every 15 minutes</option>
              <option :value="30">Every 30 minutes</option>
              <option :value="60">Every hour</option>
              <option :value="180">Every 3 hours</option>
            </select>
          </div>

          <div class="form-group full-width">
            <label>Personal Weather API Key (Optional)</label>
            <input 
              type="password" 
              v-model="preferences.weather_api_key" 
              placeholder="Enter your OpenWeatherMap API key for enhanced features"
              class="form-control"
            >
            <small>Optional: Use your own API key for unlimited weather requests</small>
          </div>
        </div>
      </div>

      <!-- Notification Preferences -->
      <div class="content-card">
        <div class="card-header">
          <h2>Notification Preferences</h2>
          <p>Choose what notifications you want to receive</p>
        </div>
        
        <div class="notification-grid">
          <div class="notification-item">
            <div class="notification-info">
              <h4>Email Notifications</h4>
              <p>Receive notifications via email</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="preferences.email_notifications">
              <span class="slider"></span>
            </label>
          </div>

          <div class="notification-item">
            <div class="notification-info">
              <h4>Breeding Alerts</h4>
              <p>Kindle dates, mating schedules, and breeding events</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="preferences.breeding_alerts">
              <span class="slider"></span>
            </label>
          </div>

          <div class="notification-item">
            <div class="notification-info">
              <h4>Health Alerts</h4>
              <p>Vaccination reminders and health check notifications</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="preferences.health_alerts">
              <span class="slider"></span>
            </label>
          </div>

          <div class="notification-item">
            <div class="notification-info">
              <h4>Feeding Reminders</h4>
              <p>Daily feeding schedules and food inventory alerts</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="preferences.feeding_reminders">
              <span class="slider"></span>
            </label>
          </div>

          <div class="notification-item">
            <div class="notification-info">
              <h4>Weather Alerts</h4>
              <p>Severe weather warnings affecting your farm</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="preferences.weather_alerts">
              <span class="slider"></span>
            </label>
          </div>

          <div class="notification-item">
            <div class="notification-info">
              <h4>Stock Alerts</h4>
              <p>Low inventory and supply reorder notifications</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="preferences.stock_alerts">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Privacy Settings -->
      <div class="content-card">
        <div class="card-header">
          <h2>Privacy Settings</h2>
          <p>Control your data sharing and privacy preferences</p>
        </div>
        
        <div class="notification-grid">
          <div class="notification-item">
            <div class="notification-info">
              <h4>Share Farm Data</h4>
              <p>Allow anonymous farm data to be used for research</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="preferences.share_farm_data">
              <span class="slider"></span>
            </label>
          </div>

          <div class="notification-item">
            <div class="notification-info">
              <h4>Public Profile</h4>
              <p>Make your farm profile visible to other users</p>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="preferences.public_profile">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase'

export default {
  name: 'AppPreferences',
  setup() {
    const loading = ref(false)
    const error = ref('')
    const successMessage = ref('')
    
    const preferences = ref({
      farm_name: '',
      farm_location: 'Denver, CO',
      farm_address: '',
      temperature_unit: 'fahrenheit',
      date_format: 'MM/dd/yyyy',
      time_format: '12h',
      timezone: 'America/Denver',
      currency: 'ZAR',
      language: 'en',
      email_notifications: true,
      breeding_alerts: true,
      health_alerts: true,
      feeding_reminders: true,
      weather_alerts: false,
      stock_alerts: true,
      default_dashboard_view: 'overview',
      items_per_page: 25,
      weather_api_key: '',
      show_weather_widget: true,
      weather_update_frequency: 60,
      share_farm_data: false,
      public_profile: false
    })

    const loadPreferences = async () => {
      try {
        loading.value = true
        error.value = ''
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          error.value = 'Please log in to view preferences'
          return
        }

        // Use the get_user_preferences function which returns existing prefs or creates defaults
        const { data, error: fetchError } = await supabase.rpc('get_user_preferences', {
          user_uuid: user.id
        })

        if (fetchError) throw fetchError

        if (data && data.length > 0) {
          const userPrefs = data[0]
          Object.keys(preferences.value).forEach(key => {
            if (userPrefs[key] !== undefined && userPrefs[key] !== null) {
              preferences.value[key] = userPrefs[key]
            }
          })
        }
      } catch (err) {
        console.error('Error loading preferences:', err)
        error.value = 'Failed to load preferences: ' + err.message
      } finally {
        loading.value = false
      }
    }

    const savePreferences = async () => {
      try {
        loading.value = true
        error.value = ''
        successMessage.value = ''

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          error.value = 'Please log in to save preferences'
          return
        }

        // Check if user already has preferences
        const { data: existing } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user.id)
          .single()

        const prefsData = {
          ...preferences.value,
          user_id: user.id,
          updated_at: new Date().toISOString()
        }

        let result
        if (existing) {
          // Update existing preferences
          result = await supabase
            .from('user_preferences')
            .update(prefsData)
            .eq('user_id', user.id)
        } else {
          // Insert new preferences
          result = await supabase
            .from('user_preferences')
            .insert([prefsData])
        }

        if (result.error) throw result.error

        successMessage.value = 'Preferences saved successfully!'
        setTimeout(() => {
          successMessage.value = ''
        }, 3000)

      } catch (err) {
        console.error('Error saving preferences:', err)
        error.value = 'Failed to save preferences: ' + err.message
      } finally {
        loading.value = false
      }
    }

    const resetToDefaults = () => {
      if (confirm('Are you sure you want to reset all preferences to default values?')) {
        preferences.value = {
          farm_name: '',
          farm_location: 'Denver, CO',
          farm_address: '',
          temperature_unit: 'fahrenheit',
          date_format: 'MM/dd/yyyy',
          time_format: '12h',
          timezone: 'America/Denver',
          currency: 'USD',
          language: 'en',
          email_notifications: true,
          breeding_alerts: true,
          health_alerts: true,
          feeding_reminders: true,
          weather_alerts: false,
          stock_alerts: true,
          default_dashboard_view: 'overview',
          items_per_page: 25,
          weather_api_key: '',
          show_weather_widget: true,
          weather_update_frequency: 60,
          share_farm_data: false,
          public_profile: false
        }
      }
    }

    onMounted(() => {
      loadPreferences()
    })

    return {
      preferences,
      loading,
      error,
      successMessage,
      loadPreferences,
      savePreferences,
      resetToDefaults
    }
  }
}
</script>

<style scoped>
.preferences-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
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

.header-actions {
  display: flex;
  gap: 1rem;
}

.primary-button, .secondary-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.primary-button {
  background: #3b82f6;
  color: white;
}

.primary-button:hover:not(:disabled) {
  background: #2563eb;
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-button {
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.secondary-button:hover:not(:disabled) {
  background: #f8fafc;
}

.error-message, .success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.success-message {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.card-header {
  margin-bottom: 2rem;
}

.card-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.card-header p {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
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

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

.form-group small {
  color: #64748b;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.notification-grid {
  display: grid;
  gap: 1rem;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.notification-info h4 {
  margin: 0 0 0.25rem 0;
  color: #1e293b;
  font-size: 1rem;
}

.notification-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  flex-shrink: 0;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .notification-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style> 