<template>
  <div class="report-schedule-form">
    <div class="page-header">
      <h1>{{ isEditMode ? 'Edit Report Schedule' : 'Create Report Schedule' }}</h1>
      <p>Configure automated report generation and delivery</p>
    </div>

    <div class="form-container">
      <form @submit.prevent="saveSchedule" class="schedule-form">
        <!-- Basic Information -->
        <div class="form-section">
          <h3>Basic Information</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="name">Schedule Name *</label>
              <input 
                id="name"
                v-model="formData.name" 
                type="text" 
                required 
                placeholder="e.g., Weekly Financial Report"
              >
            </div>
            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description"
                v-model="formData.description" 
                placeholder="Optional description of this schedule"
              ></textarea>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="reportType">Report Type *</label>
              <select id="reportType" v-model="formData.report_type" required>
                <option value="">Select Report Type</option>
                <option value="population">Population Report</option>
                <option value="health">Health Report</option>
                <option value="financial">Financial Report</option>
                <option value="breeding">Breeding Report</option>
                <option value="feeding">Feeding Report</option>
                <option value="comprehensive">Comprehensive Report</option>
              </select>
            </div>
            <div class="form-group">
              <label for="reportPeriod">Report Period (months)</label>
              <input 
                id="reportPeriod"
                v-model.number="formData.report_period" 
                type="number" 
                min="1" 
                max="24" 
                default="6"
              >
            </div>
          </div>
        </div>

        <!-- Scheduling -->
        <div class="form-section">
          <h3>Scheduling</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="frequency">Frequency *</label>
              <select id="frequency" v-model="formData.frequency" required @change="updateFrequencyConfig">
                <option value="">Select Frequency</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div class="form-group" v-if="formData.frequency === 'weekly'">
              <label for="weekDay">Day of Week</label>
              <select id="weekDay" v-model="formData.frequency_config.day">
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
                <option value="0">Sunday</option>
              </select>
            </div>
            <div class="form-group" v-if="formData.frequency === 'monthly' || formData.frequency === 'quarterly' || formData.frequency === 'yearly'">
              <label for="monthDay">Day of Month</label>
              <input 
                id="monthDay"
                v-model.number="formData.frequency_config.day" 
                type="number" 
                min="1" 
                max="31" 
                default="1"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="timeOfDay">Time of Day</label>
              <input 
                id="timeOfDay"
                v-model="formData.time_of_day" 
                type="time" 
                default="09:00"
              >
            </div>
            <div class="form-group">
              <label for="timezone">Timezone</label>
              <select id="timezone" v-model="formData.timezone">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Africa/Johannesburg">South Africa</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Delivery -->
        <div class="form-section">
          <h3>Delivery</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="deliveryMethod">Delivery Method *</label>
              <select id="deliveryMethod" v-model="formData.delivery_method" required>
                <option value="">Select Delivery Method</option>
                <option value="dashboard">Dashboard Only</option>
                <option value="email">Email Only</option>
                <option value="both">Dashboard & Email</option>
              </select>
            </div>
          </div>

          <div class="form-row" v-if="formData.delivery_method === 'email' || formData.delivery_method === 'both'">
            <div class="form-group full-width">
              <label for="emailRecipients">Email Recipients</label>
              <textarea 
                id="emailRecipients"
                v-model="emailRecipientsText" 
                placeholder="Enter email addresses separated by commas"
              ></textarea>
              <small>Enter email addresses separated by commas</small>
            </div>
          </div>

          <div class="form-row" v-if="formData.delivery_method === 'email' || formData.delivery_method === 'both'">
            <div class="form-group">
              <label for="attachmentFormat">Attachment Format</label>
              <select id="attachmentFormat" v-model="formData.attachment_format">
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="formData.include_attachments"
                >
                Include Attachments
              </label>
            </div>
          </div>
        </div>

        <!-- Report Options -->
        <div class="form-section">
          <h3>Report Options</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="formData.include_charts"
                >
                Include Charts
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="formData.include_recommendations"
                >
                Include Recommendations
              </label>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" @click="goBack" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            <span v-if="isSaving">Saving...</span>
            <span v-else>{{ isEditMode ? 'Update Schedule' : 'Create Schedule' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reportSchedulingService } from '@/services/reportSchedulingService'
import { supabase } from '@/supabase'

export default {
  name: 'ReportScheduleForm',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const isEditMode = computed(() => !!route.params.id)
    const isSaving = ref(false)
    const error = ref('')

    // Form data
    const formData = reactive({
      name: '',
      description: '',
      report_type: '',
      frequency: '',
      frequency_config: {},
      time_of_day: '09:00',
      timezone: 'UTC',
      delivery_method: '',
      email_recipients: [],
      include_attachments: true,
      attachment_format: 'pdf',
      report_period: 6,
      include_charts: true,
      include_recommendations: true,
      custom_filters: null
    })

    // Computed
    const emailRecipientsText = computed({
      get: () => formData.email_recipients.join(', '),
      set: (value) => {
        formData.email_recipients = value
          .split(',')
          .map(email => email.trim())
          .filter(email => email && email.includes('@'))
      }
    })

    // Methods
    const loadSchedule = async () => {
      if (!isEditMode.value) return

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        const schedule = await reportSchedulingService.getSchedule(route.params.id, user.id)
        Object.assign(formData, {
          name: schedule.name,
          description: schedule.description || '',
          report_type: schedule.report_type,
          frequency: schedule.frequency,
          frequency_config: schedule.frequency_config || {},
          time_of_day: schedule.time_of_day,
          timezone: schedule.timezone,
          delivery_method: schedule.delivery_method,
          email_recipients: schedule.email_recipients || [],
          include_attachments: schedule.include_attachments,
          attachment_format: schedule.attachment_format,
          report_period: schedule.report_period,
          include_charts: schedule.include_charts,
          include_recommendations: schedule.include_recommendations,
          custom_filters: schedule.custom_filters
        })
      } catch (err) {
        console.error('Failed to load schedule:', err)
        error.value = 'Failed to load schedule. Please try again.'
      }
    }

    const saveSchedule = async () => {
      try {
        isSaving.value = true
        error.value = ''

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        if (isEditMode.value) {
          await reportSchedulingService.updateSchedule(
            route.params.id,
            formData,
            user.id
          )
        } else {
          await reportSchedulingService.createSchedule(formData, user.id)
        }

        router.push('/reports/schedules')
      } catch (err) {
        console.error('Failed to save schedule:', err)
        error.value = 'Failed to save schedule. Please try again.'
      } finally {
        isSaving.value = false
      }
    }

    const updateFrequencyConfig = () => {
      if (formData.frequency === 'weekly') {
        formData.frequency_config = { day: 1 }
      } else if (['monthly', 'quarterly', 'yearly'].includes(formData.frequency)) {
        formData.frequency_config = { day: 1 }
      } else {
        formData.frequency_config = {}
      }
    }

    const goBack = () => {
      router.push('/reports/schedules')
    }

    // Lifecycle
    onMounted(() => {
      loadSchedule()
    })

    return {
      isEditMode,
      isSaving,
      error,
      formData,
      emailRecipientsText,
      saveSchedule,
      updateFrequencyConfig,
      goBack
    }
  }
}
</script>

<style scoped>
.report-schedule-form {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #718096;
  margin-bottom: 1.5rem;
}

.form-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h3 {
  margin-bottom: 1rem;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-row .full-width {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.form-group small {
  margin-top: 0.25rem;
  color: #718096;
  font-size: 0.875rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #718096;
  color: white;
}

.btn-secondary:hover {
  background: #4a5568;
}

@media (max-width: 768px) {
  .report-schedule-form {
    padding: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
