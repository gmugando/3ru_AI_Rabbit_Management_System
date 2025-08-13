<template>
  <div class="health-record-form-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-button" @click="goBack">
          <i class="pi pi-arrow-left"></i>
          Back to Health Management
        </button>
        <div class="header-title">
          <h1>{{ isEditMode ? 'Edit Health Record' : 'Add Health Record' }}</h1>
          <p class="subtitle">{{ isEditMode ? 'Update medical conditions, treatments, and observations' : 'Record medical conditions, treatments, and observations' }}</p>
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

        <div v-if="isLoadingRecord" class="loading-state">
          <i class="pi pi-spinner pi-spin"></i>
          <span>Loading health record...</span>
        </div>

        <form v-else @submit.prevent="saveHealthRecord" class="health-form">
          <!-- Basic Information -->
          <div class="form-section">
            <h2>Basic Information</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="rabbit-select">Rabbit *</label>
                <select 
                  id="rabbit-select" 
                  v-model="healthForm.rabbitId" 
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
                  v-model="healthForm.date" 
                  required
                  class="form-input"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="record-type">Record Type *</label>
                <select 
                  id="record-type" 
                  v-model="healthForm.recordType" 
                  required
                  class="form-select"
                  @change="updateFormFields"
                >
                  <option value="">Select record type</option>
                  <option value="checkup">Regular Checkup</option>
                  <option value="illness">Illness/Disease</option>
                  <option value="treatment">Treatment</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="injury">Injury</option>
                  <option value="observation">Observation</option>
                </select>
              </div>

              <div class="form-group">
                <label for="status">Status *</label>
                <select 
                  id="status" 
                  v-model="healthForm.status" 
                  required
                  class="form-select"
                >
                  <option value="">Select status</option>
                  <option value="healthy">Healthy</option>
                  <option value="under_treatment">Under Treatment</option>
                  <option value="under_observation">Under Observation</option>
                  <option value="recovered">Recovered</option>
                  <option value="chronic">Chronic Condition</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Condition Details -->
          <div class="form-section">
            <h2>Condition Details</h2>
            
            <div class="form-group">
              <label for="condition">Condition/Diagnosis</label>
              <input 
                id="condition"
                type="text" 
                v-model="healthForm.condition" 
                class="form-input"
                :placeholder="getConditionPlaceholder()"
              >
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="severity">Severity</label>
                <select 
                  id="severity" 
                  v-model="healthForm.severity" 
                  class="form-select"
                >
                  <option value="">Select severity</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div class="form-group">
                <label for="affected-area">Affected Area</label>
                <select 
                  id="affected-area" 
                  v-model="healthForm.affectedArea" 
                  class="form-select"
                >
                  <option value="">Select area</option>
                  <option value="respiratory">Respiratory System</option>
                  <option value="digestive">Digestive System</option>
                  <option value="skin">Skin/Fur</option>
                  <option value="eyes">Eyes</option>
                  <option value="ears">Ears</option>
                  <option value="limbs">Limbs/Mobility</option>
                  <option value="reproductive">Reproductive System</option>
                  <option value="neurological">Neurological</option>
                  <option value="general">General/Systemic</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="symptoms">Symptoms</label>
              <textarea 
                id="symptoms"
                v-model="healthForm.symptoms" 
                class="form-textarea"
                placeholder="Describe observed symptoms (e.g., lethargy, loss of appetite, discharge, etc.)"
                rows="3"
              ></textarea>
            </div>
          </div>

          <!-- Treatment Information -->
          <div class="form-section" v-if="showTreatmentSection">
            <h2>Treatment Information</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="treatment-type">Treatment Type</label>
                <select 
                  id="treatment-type" 
                  v-model="healthForm.treatmentType" 
                  class="form-select"
                >
                  <option value="">Select treatment type</option>
                  <option value="medication">Medication</option>
                  <option value="surgery">Surgery</option>
                  <option value="therapy">Therapy</option>
                  <option value="isolation">Isolation</option>
                  <option value="dietary">Dietary Changes</option>
                  <option value="environmental">Environmental Changes</option>
                  <option value="monitoring">Monitoring Only</option>
                </select>
              </div>

              <div class="form-group">
                <label for="medication">Medication/Treatment</label>
                <input 
                  id="medication"
                  type="text" 
                  v-model="healthForm.medication" 
                  class="form-input"
                  placeholder="e.g., Enrofloxacin, Ivermectin, etc."
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="dosage">Dosage</label>
                <input 
                  id="dosage"
                  type="text" 
                  v-model="healthForm.dosage" 
                  class="form-input"
                  placeholder="e.g., 5mg/kg, 2 drops, etc."
                >
              </div>

              <div class="form-group">
                <label for="frequency">Frequency</label>
                <select 
                  id="frequency" 
                  v-model="healthForm.frequency" 
                  class="form-select"
                >
                  <option value="">Select frequency</option>
                  <option value="once_daily">Once Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="three_times_daily">Three Times Daily</option>
                  <option value="every_other_day">Every Other Day</option>
                  <option value="weekly">Weekly</option>
                  <option value="as_needed">As Needed</option>
                  <option value="single_dose">Single Dose</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="treatment-start">Treatment Start Date</label>
                <input 
                  id="treatment-start"
                  type="date" 
                  v-model="healthForm.treatmentStartDate" 
                  class="form-input"
                >
              </div>

              <div class="form-group">
                <label for="treatment-duration">Duration (days)</label>
                <input 
                  id="treatment-duration"
                  type="number" 
                  v-model="healthForm.treatmentDuration" 
                  class="form-input"
                  min="1"
                  placeholder="Number of days"
                >
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="form-section">
            <h2>Additional Information</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label for="veterinarian">Veterinarian</label>
                <input 
                  id="veterinarian"
                  type="text" 
                  v-model="healthForm.veterinarian" 
                  class="form-input"
                  placeholder="Veterinarian name"
                >
              </div>

              <div class="form-group">
                <label for="cost">Cost</label>
                <input 
                  id="cost"
                  type="number" 
                  v-model="healthForm.cost" 
                  class="form-input"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="notes">Notes</label>
              <textarea 
                id="notes"
                v-model="healthForm.notes" 
                class="form-textarea"
                placeholder="Additional notes, observations, or follow-up instructions..."
                rows="4"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="healthForm.followUpRequired"
                  class="form-checkbox"
                >
                Follow-up required
              </label>
            </div>

            <div v-if="healthForm.followUpRequired" class="form-group">
              <label for="follow-up-date">Follow-up Date</label>
              <input 
                id="follow-up-date"
                type="date" 
                v-model="healthForm.followUpDate" 
                class="form-input"
              >
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
              {{ isLoading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Health Record' : 'Save Health Record') }}
            </button>
          </div>
        </form>
      </div>

      <!-- Quick Actions Sidebar -->
      <div class="sidebar-card">
        <h3>Quick Actions</h3>
        
        <div class="quick-action">
          <h4>Common Conditions</h4>
          <div class="condition-tags">
            <button 
              v-for="condition in commonConditions" 
              :key="condition"
              @click="setCondition(condition)"
              class="condition-tag"
            >
              {{ condition }}
            </button>
          </div>
        </div>

        <div class="quick-action" v-if="selectedRabbitHistory.length > 0">
          <h4>Recent History</h4>
          <div class="history-items">
            <div v-for="record in selectedRabbitHistory.slice(0, 3)" :key="record.id" class="history-item">
              <div class="history-date">{{ formatDate(record.date) }}</div>
              <div class="history-condition">{{ record.condition }}</div>
              <div class="history-status">{{ record.status }}</div>
            </div>
          </div>
        </div>

        <div class="quick-action">
          <h4>Tips</h4>
          <ul class="tips-list">
            <li>Be specific about symptoms observed</li>
            <li>Include environmental factors if relevant</li>
            <li>Note any changes in behavior or appetite</li>
            <li>Document treatment response</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { scheduleIntegration } from '@/services/scheduleIntegration'
import { financialIntegration } from '@/services/financialIntegration'

export default {
  name: 'HealthRecordForm',
  props: {
    id: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const router = useRouter()
    const isLoading = ref(false)
    const isLoadingRabbits = ref(false)
    const error = ref('')
    const successMessage = ref('')
    
    // Data
    const rabbits = ref([])
    const selectedRabbitHistory = ref([])
    
    // Edit mode state
    const isEditMode = computed(() => !!props.id)
    const isLoadingRecord = ref(false)
    
    // Form data
    const healthForm = reactive({
      rabbitId: '',
      date: new Date().toISOString().split('T')[0],
      recordType: '',
      status: '',
      condition: '',
      severity: '',
      affectedArea: '',
      symptoms: '',
      treatmentType: '',
      medication: '',
      dosage: '',
      frequency: '',
      treatmentStartDate: '',
      treatmentDuration: '',
      veterinarian: '',
      cost: '',
      notes: '',
      followUpRequired: false,
      followUpDate: ''
    })

    const commonConditions = ref([
      'Respiratory Infection',
      'GI Stasis',
      'Ear Mites',
      'Dental Issues',
      'Skin Irritation',
      'Eye Infection',
      'Loss of Appetite',
      'Diarrhea',
      'Snuffles',
      'Wool Block'
    ])

    // Computed properties
    const showTreatmentSection = computed(() => {
      return ['illness', 'treatment', 'injury'].includes(healthForm.recordType)
    })

    // Methods
    const goBack = () => {
      router.push('/health-data')
    }

    const getConditionPlaceholder = () => {
      const placeholders = {
        checkup: 'e.g., Regular health checkup',
        illness: 'e.g., Respiratory infection, GI stasis',
        treatment: 'e.g., Treatment for ear mites',
        vaccination: 'e.g., RHDV vaccination',
        injury: 'e.g., Minor cut on paw',
        observation: 'e.g., Monitoring eating habits'
      }
      return placeholders[healthForm.recordType] || 'Enter condition or diagnosis'
    }

    const updateFormFields = () => {
      // Auto-set treatment start date when treatment is selected
      if (healthForm.recordType === 'treatment' && !healthForm.treatmentStartDate) {
        healthForm.treatmentStartDate = healthForm.date
      }
      
      // Load rabbit history when rabbit is selected
      if (healthForm.rabbitId) {
        fetchRabbitHistory(healthForm.rabbitId)
      }
    }

    const setCondition = (condition) => {
      healthForm.condition = condition
      
      // Auto-set common values for known conditions
      const conditionSettings = {
        'Respiratory Infection': { affectedArea: 'respiratory', severity: 'moderate' },
        'GI Stasis': { affectedArea: 'digestive', severity: 'severe' },
        'Ear Mites': { affectedArea: 'ears', severity: 'mild' },
        'Dental Issues': { affectedArea: 'general', severity: 'moderate' },
        'Eye Infection': { affectedArea: 'eyes', severity: 'mild' }
      }
      
      if (conditionSettings[condition]) {
        const settings = conditionSettings[condition]
        if (settings.affectedArea) healthForm.affectedArea = settings.affectedArea
        if (settings.severity) healthForm.severity = settings.severity
      }
    }

    // Fetch rabbits from database
    const fetchRabbits = async () => {
      try {
        isLoadingRabbits.value = true
        error.value = ''
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { data, error: fetchError } = await supabase
          .from('rabbits')
          .select('id, rabbit_id, name, breed, status')
          .order('rabbit_id')

        if (fetchError) throw fetchError
        
        // Log the status values to see what's actually in the database
        if (data && data.length > 0) {
          const statusValues = [...new Set(data.map(r => r.status))]
          console.log('Available status values:', statusValues)
        }
        
        // Filter only active rabbits in JavaScript for now
        const activeRabbits = data?.filter(rabbit => 
          rabbit.status === 'active' || 
          rabbit.status === 'Active' || 
          !rabbit.status // Include rabbits without status set
        ) || []
        
        rabbits.value = activeRabbits
        console.log('Fetched rabbits:', data?.length || 0, 'Active rabbits:', activeRabbits.length)
        
        if (activeRabbits.length === 0) {
          error.value = data?.length > 0 ? 'No active rabbits found. Please check rabbit status.' : 'No rabbits found. Please add some rabbits first.'
        } else {
          error.value = '' // Clear any previous errors
        }
      } catch (err) {
        console.error('Error fetching rabbits:', err)
        error.value = `Failed to load rabbits: ${err.message || 'Please try again.'}`
      } finally {
        isLoadingRabbits.value = false
      }
    }

    // Fetch rabbit health history
    const fetchRabbitHistory = async (rabbitId) => {
      try {
        // TODO: Implement once health_records table is created
        console.log('Fetching history for rabbit:', rabbitId)
        selectedRabbitHistory.value = []
      } catch (err) {
        console.error('Error fetching rabbit history:', err)
      }
    }

    // Fetch existing health record for editing
    const fetchHealthRecord = async () => {
      if (!props.id) return
      
      try {
        isLoadingRecord.value = true
        error.value = ''
        
        const { data, error: fetchError } = await supabase
          .from('health_records')
          .select('*')
          .eq('id', props.id)
          .single()
        
        if (fetchError) throw fetchError
        
        if (data) {
          // Populate form with existing data
          healthForm.rabbitId = data.rabbit_id || ''
          healthForm.date = data.record_date || ''
          healthForm.recordType = data.record_type || ''
          healthForm.status = data.status || ''
          healthForm.condition = data.condition || ''
          healthForm.severity = data.severity || ''
          healthForm.affectedArea = data.affected_area || ''
          healthForm.symptoms = data.symptoms || ''
          healthForm.treatmentType = data.treatment_type || ''
          healthForm.medication = data.medication || ''
          healthForm.dosage = data.dosage || ''
          healthForm.frequency = data.frequency || ''
          healthForm.treatmentStartDate = data.treatment_start_date || ''
          healthForm.treatmentDuration = data.treatment_duration || ''
          healthForm.veterinarian = data.veterinarian || ''
          healthForm.cost = data.cost || ''
          healthForm.notes = data.notes || ''
          healthForm.followUpRequired = data.follow_up_required || false
          healthForm.followUpDate = data.follow_up_date || ''
          
          console.log('Loaded health record for editing:', data)
        }
        
      } catch (err) {
        console.error('Error fetching health record:', err)
        error.value = `Failed to load health record: ${err.message || 'Please try again.'}`
      } finally {
        isLoadingRecord.value = false
      }
    }

    // Save health record
    const saveHealthRecord = async () => {
      try {
        isLoading.value = true
        error.value = ''
        successMessage.value = ''
        
        // Validate required fields
        if (!healthForm.rabbitId || !healthForm.date || !healthForm.recordType || !healthForm.status) {
          throw new Error('Please fill in all required fields')
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Prepare the record data
        const recordData = {
          rabbit_id: healthForm.rabbitId,
          record_date: healthForm.date,
          record_type: healthForm.recordType,
          status: healthForm.status,
          condition: healthForm.condition || null,
          severity: healthForm.severity || null,
          affected_area: healthForm.affectedArea || null,
          symptoms: healthForm.symptoms || null,
          treatment_type: healthForm.treatmentType || null,
          medication: healthForm.medication || null,
          dosage: healthForm.dosage || null,
          frequency: healthForm.frequency || null,
          treatment_start_date: healthForm.treatmentStartDate || null,
          treatment_duration: healthForm.treatmentDuration ? parseInt(healthForm.treatmentDuration) : null,
          veterinarian: healthForm.veterinarian || null,
          cost: healthForm.cost ? parseFloat(healthForm.cost) : null,
          notes: healthForm.notes || null,
          follow_up_required: healthForm.followUpRequired,
          follow_up_date: healthForm.followUpDate || null,
          user_id: user.id
        }

        console.log('Saving health record:', recordData)
        
        // Save to database (insert or update based on edit mode)
        let data, saveError
        
        if (isEditMode.value) {
          // Update existing record
          const updateResult = await supabase
            .from('health_records')
            .update(recordData)
            .eq('id', props.id)
            .select()
          
          data = updateResult.data
          saveError = updateResult.error
        } else {
          // Insert new record
          const insertResult = await supabase
            .from('health_records')
            .insert([recordData])
            .select()
          
          data = insertResult.data
          saveError = insertResult.error
        }

        if (saveError) throw saveError

        console.log('Health record saved successfully:', data)
        
        // Create schedule events for follow-ups and treatments (only for new records)
        if (!isEditMode.value && data && data.length > 0) {
          try {
            const savedRecord = data[0]
            
            // Create follow-up event if required
            if (savedRecord.follow_up_required && savedRecord.follow_up_date) {
              await scheduleIntegration.createHealthFollowUpEvent(savedRecord, user.id)
            }
            
            // Create treatment reminders if treatment is prescribed
            if (savedRecord.treatment_start_date && savedRecord.treatment_duration && savedRecord.frequency) {
              await scheduleIntegration.createTreatmentReminders(savedRecord, user.id)
            }
            
            // Create financial transaction if there's a cost
            if (savedRecord.cost && savedRecord.cost > 0) {
              // Get rabbit name for transaction description
              const rabbit = rabbits.value.find(r => r.id === savedRecord.rabbit_id)
              const recordWithRabbitName = {
                ...savedRecord,
                rabbit_name: rabbit?.name || 'Unknown Rabbit'
              }
              await financialIntegration.createHealthExpenseTransaction(recordWithRabbitName, user.id)
            }
            
            console.log('Schedule events and financial transaction created for health record')
          } catch (scheduleError) {
            console.error('Failed to create schedule events:', scheduleError)
            // Don't fail the whole operation if schedule creation fails
          }
        }
        
        successMessage.value = isEditMode.value 
          ? 'Health record updated successfully!' 
          : 'Health record saved successfully! Schedule events created.'
        
        // Navigate back after a short delay
        setTimeout(() => {
          const returnTo = router.currentRoute.value.query.returnTo
          if (returnTo === 'list') {
            router.push('/health-data/records')
          } else {
            router.push('/health-data')
          }
        }, 1500)
        
      } catch (err) {
        console.error('Error saving health record:', err)
        error.value = err.message || 'Error saving health record. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    // Format date for display
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }

    onMounted(() => {
      fetchRabbits()
      if (isEditMode.value) {
        fetchHealthRecord()
      }
    })

    return {
      isLoading,
      isLoadingRabbits,
      isLoadingRecord,
      isEditMode,
      error,
      successMessage,
      rabbits,
      selectedRabbitHistory,
      healthForm,
      commonConditions,
      showTreatmentSection,
      goBack,
      getConditionPlaceholder,
      updateFormFields,
      setCondition,
      fetchRabbits,
      saveHealthRecord,
      formatDate
    }
  }
}
</script>

<style scoped>
.health-record-form-page {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
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

.form-card, .sidebar-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.sidebar-card {
  height: fit-content;
  position: sticky;
  top: 2rem;
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

.health-form {
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
  min-height: 100px;
  font-family: inherit;
  line-height: 1.6;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
}

.form-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 4px;
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

/* Sidebar Styles */
.sidebar-card h3 {
  margin: 0 0 1.5rem 0;
  color: #1e293b;
  font-size: 1.125rem;
}

.quick-action {
  margin-bottom: 2rem;
}

.quick-action:last-child {
  margin-bottom: 0;
}

.quick-action h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 0.95rem;
  font-weight: 600;
}

.condition-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.condition-tag {
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.condition-tag:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.875rem;
}

.history-date {
  color: #64748b;
  font-size: 0.75rem;
}

.history-condition {
  font-weight: 500;
  color: #1e293b;
  margin: 0.25rem 0;
}

.history-status {
  color: #64748b;
  font-size: 0.75rem;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li {
  padding: 0.5rem 0;
  color: #64748b;
  font-size: 0.875rem;
  border-bottom: 1px solid #f1f5f9;
}

.tips-list li:last-child {
  border-bottom: none;
}

.tips-list li::before {
  content: "💡";
  margin-right: 0.5rem;
}

.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .form-container {
    grid-template-columns: 1fr;
  }
  
  .sidebar-card {
    position: static;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions button {
    width: 100%;
  }
}
</style>
