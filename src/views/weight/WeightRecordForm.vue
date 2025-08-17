<template>
  <div class="weight-record-form-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-button" @click="goBack">
          <i class="pi pi-arrow-left"></i>
          Back to Weight Tracking
        </button>
        <div class="header-title">
          <h1>Add Weight Record</h1>
          <p class="subtitle">Record a new weight measurement for your rabbit</p>
        </div>
      </div>
    </div>

    <div class="form-container">
      <div class="form-card">
        <!-- Error/Success Messages -->
        <div v-if="error" class="alert alert-error">
          <i class="pi pi-exclamation-triangle"></i>
          {{ error }}
          <button @click="fetchRabbits" class="retry-btn" :disabled="isLoadingRabbits">
            <i class="pi pi-refresh"></i>
            Retry
          </button>
        </div>
        
        <div v-if="successMessage" class="alert alert-success">
          <i class="pi pi-check-circle"></i>
          {{ successMessage }}
        </div>

        <form @submit.prevent="saveWeightRecord" class="weight-form">
          <div class="form-section">
            <h2>Weight Measurement Details</h2>
            
            <div class="form-row">
                          <div class="form-group">
              <label for="rabbit-select">Rabbit *</label>
              <select 
                id="rabbit-select" 
                v-model="weightForm.rabbitId" 
                @change="watchRabbitSelection"
                required
                class="form-select"
                :disabled="isLoadingRabbits"
              >
                <option value="">{{ isLoadingRabbits ? 'Loading rabbits...' : 'Select a rabbit' }}</option>
                <option v-for="rabbit in rabbits" :key="rabbit.id" :value="rabbit.id">
                  {{ rabbit.rabbit_id }} - {{ rabbit.name }} ({{ rabbit.breed }})
                </option>
              </select>
            </div>

              <div class="form-group">
                <label for="date-input">Date *</label>
                <input 
                  id="date-input"
                  type="date" 
                  v-model="weightForm.date" 
                  required
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="weight-input">Weight (kg) *</label>
                <input 
                  id="weight-input"
                  type="number" 
                  v-model="weightForm.weight" 
                  step="0.1" 
                  min="0"
                  max="20"
                  required
                  class="form-input"
                  placeholder="Enter weight in kg"
                >
              </div>

              <div class="form-group">
                <label for="body-condition">Body Condition Score</label>
                <select 
                  id="body-condition" 
                  v-model="weightForm.bodyCondition" 
                  class="form-select"
                >
                  <option value="">Select condition</option>
                  <option value="1">1 - Very Thin</option>
                  <option value="2">2 - Thin</option>
                  <option value="3">3 - Ideal</option>
                  <option value="4">4 - Overweight</option>
                  <option value="5">5 - Obese</option>
                </select>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h2>Additional Information</h2>
            
            <div class="form-group">
              <label for="notes-input">Notes</label>
              <textarea 
                id="notes-input"
                v-model="weightForm.notes" 
                class="form-textarea"
                placeholder="Add any notes about the weight measurement, health observations, or special circumstances..."
                rows="4"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="measurement-type">Measurement Type</label>
                <select 
                  id="measurement-type" 
                  v-model="weightForm.measurementType" 
                  class="form-select"
                >
                  <option value="routine">Routine Check</option>
                  <option value="health">Health Monitoring</option>
                  <option value="breeding">Breeding Program</option>
                  <option value="growth">Growth Tracking</option>
                </select>
              </div>

              <div class="form-group">
                <label for="measured-by">Measured By</label>
                <input 
                  id="measured-by"
                  type="text" 
                  v-model="weightForm.measuredBy" 
                  class="form-input"
                  placeholder="Your name or staff member"
                >
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="goBack">
              <i class="pi pi-times"></i>
              Cancel
            </button>
            <button type="submit" class="save-btn" :disabled="isLoading">
              <i v-if="isLoading" class="pi pi-spinner pi-spin"></i>
              <i v-else class="pi pi-check"></i>
              {{ isLoading ? 'Saving...' : 'Save Weight Record' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Previous Weight Records for Reference -->
      <div class="reference-card" v-if="weightForm.rabbitId">
        <h3>Previous Records for Selected Rabbit</h3>
        
        <div v-if="isLoadingRecords" class="loading-state">
          <i class="pi pi-spinner pi-spin"></i>
          Loading previous records...
        </div>
        
        <div v-else-if="previousRecords.length > 0" class="previous-records">
          <div v-for="record in previousRecords.slice(0, 5)" :key="record.id" class="previous-record">
            <div class="record-info">
              <div class="record-date">{{ formatDate(record.measurement_date) }}</div>
              <div v-if="record.body_condition_score" class="record-bcs">BCS: {{ record.body_condition_score }}</div>
            </div>
            <div class="record-weight">{{ record.weight }} kg</div>
          </div>
        </div>
        
        <div v-else class="no-records-message">
          <i class="pi pi-info-circle"></i>
          No previous weight records found
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'WeightRecordForm',
  setup() {
    const router = useRouter()
    const isLoading = ref(false)
    const isLoadingRabbits = ref(false)
    const isLoadingRecords = ref(false)
    const error = ref('')
    const successMessage = ref('')
    
    // Real data from Supabase
    const rabbits = ref([])
    const allRecords = ref([])

    // Form data
    const weightForm = reactive({
      rabbitId: '',
      weight: '',
      date: new Date().toISOString().split('T')[0], // Today's date
      notes: '',
      bodyCondition: '',
      measurementType: 'routine',
      measuredBy: ''
    })

    // Computed property for previous records of selected rabbit
    const previousRecords = computed(() => {
      if (!weightForm.rabbitId) return []
      return allRecords.value
        .filter(record => record.rabbit_id === weightForm.rabbitId)
        .sort((a, b) => new Date(b.measurement_date) - new Date(a.measurement_date))
        .slice(0, 5) // Show last 5 records
    })

    // Methods
    const goBack = () => {
      router.push('/weight-tracking')
    }

    // Fetch rabbits from database
    const fetchRabbits = async () => {
      try {
        isLoadingRabbits.value = true
        error.value = ''
        
        // Get current user first
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { data, error: fetchError } = await supabase
          .from('rabbits')
          .select('id, rabbit_id, name, breed, status')
          .eq('created_by', user.id)
          .eq('is_deleted', false)
          .order('rabbit_id')
        
        if (fetchError) throw fetchError
        
        rabbits.value = data || []
        
        // Log for debugging
        console.log('Fetched rabbits:', data)
        console.log('Rabbits count:', data?.length || 0)
        
        // Log the status values to see what's actually in the database
        if (data && data.length > 0) {
          const statusValues = [...new Set(data.map(r => r.status))]
          console.log('Available status values:', statusValues)
        }
        
        if (!data || data.length === 0) {
          error.value = 'No rabbits found. Please add some rabbits first.'
        } else {
          error.value = '' // Clear any previous errors
          console.log('Successfully loaded', data.length, 'rabbits')
          
          // Filter only active rabbits in JavaScript for now
          const activeRabbits = data.filter(rabbit => 
            rabbit.status === 'active' || 
            rabbit.status === 'Active' || 
            !rabbit.status // Include rabbits without status set
          )
          rabbits.value = activeRabbits
          console.log('Active rabbits:', activeRabbits.length)
        }
      } catch (err) {
        console.error('Error fetching rabbits:', err)
        error.value = `Failed to load rabbits: ${err.message || 'Please try again.'}`
      } finally {
        isLoadingRabbits.value = false
      }
    }

    // Fetch previous weight records for selected rabbit
    const fetchPreviousRecords = async (rabbitId) => {
      if (!rabbitId) {
        allRecords.value = []
        return
      }
      
      try {
        isLoadingRecords.value = true
        
        const { data, error: fetchError } = await supabase
          .from('weight_records')
          .select('id, weight, measurement_date, rabbit_id, body_condition_score')
          .eq('rabbit_id', rabbitId)
          .eq('is_deleted', false)
          .order('measurement_date', { ascending: false })
          .limit(10)
        
        if (fetchError) throw fetchError
        
        allRecords.value = data || []
      } catch (err) {
        console.error('Error fetching previous records:', err)
        // Don't show error for this since it's not critical
      } finally {
        isLoadingRecords.value = false
      }
    }

    // Watch for rabbit selection changes to fetch previous records
    const watchRabbitSelection = () => {
      if (weightForm.rabbitId) {
        fetchPreviousRecords(weightForm.rabbitId)
      }
    }

    // Format date for display
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      const today = new Date()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday'
      } else {
        return date.toLocaleDateString()
      }
    }



    const saveWeightRecord = async () => {
      try {
        isLoading.value = true
        error.value = ''
        successMessage.value = ''
        
        // Validate required fields
        if (!weightForm.rabbitId || !weightForm.weight || !weightForm.date) {
          throw new Error('Please fill in all required fields')
        }

        // Find the selected rabbit for validation
        const selectedRabbit = rabbits.value.find(r => r.id === weightForm.rabbitId)
        if (!selectedRabbit) {
          throw new Error('Please select a valid rabbit')
        }

        // Get current user for RLS policy
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Prepare the record data
        const recordData = {
          rabbit_id: weightForm.rabbitId,
          weight: parseFloat(weightForm.weight),
          measurement_date: weightForm.date,
          body_condition_score: weightForm.bodyCondition ? parseInt(weightForm.bodyCondition) : null,
          measurement_type: weightForm.measurementType,
          measured_by: weightForm.measuredBy || null,
          notes: weightForm.notes || null,
          time_of_day: new Date().toTimeString().split(' ')[0], // Current time
          user_id: user.id // Required for RLS policy
        }

        // Save to database
        const { data, error: saveError } = await supabase
          .from('weight_records')
          .insert([recordData])
          .select()

        if (saveError) throw saveError

        console.log('Weight record saved successfully:', data)
        successMessage.value = 'Weight record saved successfully!'
        
        // Show success message briefly then navigate back
        setTimeout(() => {
          router.push('/weight-tracking')
        }, 1500)
        
      } catch (err) {
        console.error('Error saving weight record:', err)
        error.value = err.message || 'Error saving weight record. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    // Test connection
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...')
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Current user:', user)
        
        if (!user) {
          error.value = 'User not authenticated. Please log in again.'
          return
        }
        
        // Test a simple query to see what columns exist
        const { data, error: testError, count } = await supabase
          .from('rabbits')
          .select('*', { count: 'exact' })
          .limit(1)
        
        console.log('Test query result:', { data, testError, count })
        
        if (testError) {
          console.error('Test query error:', testError)
          error.value = `Database error: ${testError.message}`
        } else {
          console.log('Connection successful!')
          console.log('Available columns:', data?.[0] ? Object.keys(data[0]) : 'No data')
          fetchRabbits()
        }
      } catch (err) {
        console.error('Connection test failed:', err)
        error.value = `Connection failed: ${err.message}`
      }
    }

    // Initialize data on component mount
    onMounted(() => {
      testConnection()
    })

    return {
      isLoading,
      isLoadingRabbits,
      isLoadingRecords,
      error,
      successMessage,
      rabbits,
      weightForm,
      previousRecords,
      goBack,
      saveWeightRecord,
      watchRabbitSelection,
      formatDate,
      fetchRabbits
    }
  }
}
</script>

<style scoped>
.weight-record-form-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  color: #dc2626;
  border: 1px solid #dc2626;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.retry-btn:hover:not(:disabled) {
  background: #dc2626;
  color: white;
}

.retry-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert-error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.alert-success {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #64748b;
  font-style: italic;
}

.no-records-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #64748b;
  text-align: center;
  justify-content: center;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: fit-content;
}

.back-button:hover {
  background: #f8fafc;
  color: #475569;
}

.header-title h1 {
  margin: 0;
  color: #1e293b;
  font-size: 2rem;
}

.subtitle {
  color: #64748b;
  margin: 0.5rem 0 0 0;
}

.form-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.form-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.reference-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  height: fit-content;
}

.reference-card h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.25rem;
}

.weight-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 2rem;
  margin-bottom: 2rem;
}

.form-section:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.form-section h2 {
  margin: 0 0 2rem 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.875rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.5;
  transition: all 0.3s ease;
  background-color: #ffffff;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  line-height: 1.6;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: white;
  color: #64748b;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.cancel-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.save-btn:hover:not(:disabled) {
  background: #2563eb;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.previous-records {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.previous-record {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.record-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.record-date {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.record-bcs {
  color: #6b7280;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 500;
}

.record-weight {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.1rem;
}

.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .weight-record-form-page {
    padding: 1rem;
  }

  .form-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-section {
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .form-section h2 {
    margin-bottom: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 2rem;
  }

  .form-actions button {
    width: 100%;
    padding: 1rem 2rem;
  }

  .header-title h1 {
    font-size: 1.5rem;
  }
}
</style>
