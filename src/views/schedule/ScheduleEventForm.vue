<template>
  <div class="event-form-container">
    <div class="form-header">
      <h2>{{ isEditMode ? 'Edit Event' : 'Add New Event' }}</h2>
      <p class="form-subtitle">{{ isEditMode ? 'Update event details' : 'Create a new scheduled event' }}</p>
    </div>

    <div v-if="isLoadingRecord" class="loading-state">
      <div class="spinner"></div>
      <p>Loading event details...</p>
    </div>

    <form v-else @submit.prevent="saveEvent" class="event-form">
      <div class="form-section">
        <h3>Basic Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="title">Event Title *</label>
            <input
              id="title"
              v-model="formData.title"
              type="text"
              class="form-control"
              placeholder="Enter event title"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="event_type">Event Type *</label>
            <select
              id="event_type"
              v-model="formData.event_type"
              class="form-control"
              required
            >
              <option value="">Select event type</option>
              <option value="breeding">Breeding</option>
              <option value="feeding">Feeding</option>
              <option value="health">Health Check</option>
              <option value="maintenance">Maintenance</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="formData.description"
            class="form-control"
            rows="3"
            placeholder="Event description (optional)"
          ></textarea>
        </div>
      </div>

      <div class="form-section">
        <h3>Date & Time</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="start_date">Start Date *</label>
            <input
              id="start_date"
              v-model="formData.start_date"
              type="date"
              class="form-control"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="start_time">Start Time</label>
            <input
              id="start_time"
              v-model="formData.start_time"
              type="time"
              class="form-control"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="end_date">End Date</label>
            <input
              id="end_date"
              v-model="formData.end_date"
              type="date"
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label for="end_time">End Time</label>
            <input
              id="end_time"
              v-model="formData.end_time"
              type="time"
              class="form-control"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Event Details</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="rabbit_id">Associated Rabbit</label>
            <select
              id="rabbit_id"
              v-model="formData.rabbit_id"
              class="form-control"
            >
              <option value="">Select rabbit (optional)</option>
              <option v-for="rabbit in rabbits" :key="rabbit.id" :value="rabbit.id">
                {{ rabbit.name }} ({{ rabbit.breed }})
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="priority">Priority</label>
            <select
              id="priority"
              v-model="formData.priority"
              class="form-control"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="location">Location</label>
            <input
              id="location"
              v-model="formData.location"
              type="text"
              class="form-control"
              placeholder="Farm location, cage section, etc."
            />
          </div>
          
          <div class="form-group">
            <label for="status">Status</label>
            <select
              id="status"
              v-model="formData.status"
              class="form-control"
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Recurrence (Optional)</h3>
        
        <div class="form-group">
          <label for="recurrence_type">Repeat</label>
          <select
            id="recurrence_type"
            v-model="formData.recurrence_type"
            class="form-control"
          >
            <option value="">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div v-if="formData.recurrence_type === 'weekly'" class="form-group">
          <label>Repeat on days</label>
          <div class="checkbox-group">
            <label v-for="day in weekdays" :key="day.value" class="checkbox-label">
              <input
                type="checkbox"
                :value="day.value"
                v-model="selectedDays"
              />
              {{ day.label }}
            </label>
          </div>
        </div>

        <div v-if="formData.recurrence_type" class="form-row">
          <div class="form-group">
            <label for="recurrence_interval">Repeat every</label>
            <input
              id="recurrence_interval"
              v-model="formData.recurrence_interval"
              type="number"
              class="form-control"
              min="1"
              :placeholder="`Every ${formData.recurrence_type === 'daily' ? 'day' : formData.recurrence_type === 'weekly' ? 'week' : 'month'}`"
            />
          </div>
          
          <div class="form-group">
            <label for="recurrence_end_date">End repeat</label>
            <input
              id="recurrence_end_date"
              v-model="formData.recurrence_end_date"
              type="date"
              class="form-control"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Additional Information</h3>
        
        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea
            id="notes"
            v-model="formData.notes"
            class="form-control"
            rows="3"
            placeholder="Additional notes or instructions"
          ></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="button"
          @click="goBack"
          class="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="isSaving"
          class="btn btn-primary"
        >
          <span v-if="isSaving">
            {{ isEditMode ? 'Updating...' : 'Creating...' }}
          </span>
          <span v-else>
            {{ isEditMode ? 'Update Event' : 'Create Event' }}
          </span>
        </button>
      </div>
    </form>

    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="error = ''" class="close-btn">&times;</button>
    </div>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
      <button @click="successMessage = ''" class="close-btn">&times;</button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'ScheduleEventForm',
  props: {
    id: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    
    // State
    const isSaving = ref(false)
    const isLoadingRecord = ref(false)
    const isLoadingRabbits = ref(false)
    const error = ref('')
    const successMessage = ref('')
    const rabbits = ref([])
    const selectedDays = ref([])
    
    // Computed
    const isEditMode = computed(() => !!props.id)
    
    // Form data
    const formData = reactive({
      title: '',
      description: '',
      event_type: '',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      rabbit_id: '',
      priority: 'medium',
      location: '',
      status: 'scheduled',
      recurrence_type: '',
      recurrence_interval: 1,
      recurrence_end_date: '',
      notes: ''
    })
    
    // Weekdays for recurrence
    const weekdays = [
      { value: 'monday', label: 'Monday' },
      { value: 'tuesday', label: 'Tuesday' },
      { value: 'wednesday', label: 'Wednesday' },
      { value: 'thursday', label: 'Thursday' },
      { value: 'friday', label: 'Friday' },
      { value: 'saturday', label: 'Saturday' },
      { value: 'sunday', label: 'Sunday' }
    ]
    
    // Methods
    const fetchRabbits = async () => {
      try {
        isLoadingRabbits.value = true
        error.value = ''
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        
        let query = supabase
          .from('rabbits')
          .select('id, name, breed, status')
          .eq('created_by', user.id)
          .order('name')
        
        // Try to filter out deleted rabbits if the column exists
        try {
          const { data, error: rabbitError } = await query.eq('is_deleted', false)
          if (rabbitError) throw rabbitError
          
          // Filter active rabbits on the client side
          rabbits.value = data?.filter(rabbit => 
            rabbit.status === 'active' || rabbit.status === 'Active' || !rabbit.status
          ) || []
        } catch (err) {
          // If is_deleted column doesn't exist, fetch without it
          console.log('is_deleted column not found, fetching without filter')
          const { data, error: rabbitError } = await query
          if (rabbitError) throw rabbitError
          
          // Filter active rabbits on the client side
          rabbits.value = data?.filter(rabbit => 
            rabbit.status === 'active' || rabbit.status === 'Active' || !rabbit.status
          ) || []
        }
        
      } catch (err) {
        console.error('Failed to load rabbits:', err)
        error.value = 'Failed to load rabbits. Please try again.'
      } finally {
        isLoadingRabbits.value = false
      }
    }
    
    const fetchEvent = async () => {
      if (!props.id) return
      
      try {
        isLoadingRecord.value = true
        error.value = ''
        
        const { data, error: eventError } = await supabase
          .from('schedule_events')
          .select('*')
          .eq('id', props.id)
          .single()
        
        if (eventError) throw eventError
        
        // Populate form with existing data
        Object.keys(formData).forEach(key => {
          if (data[key] !== null && data[key] !== undefined) {
            formData[key] = data[key]
          }
        })
        
        // Handle recurrence days array
        if (data.recurrence_days && Array.isArray(data.recurrence_days)) {
          selectedDays.value = [...data.recurrence_days]
        }
        
        // Map completion_notes to notes for the form
        if (data.completion_notes) {
          formData.notes = data.completion_notes
        }
        
      } catch (err) {
        console.error('Failed to load event:', err)
        error.value = 'Failed to load event details. Please try again.'
      } finally {
        isLoadingRecord.value = false
      }
    }
    
    const saveEvent = async () => {
      try {
        isSaving.value = true
        error.value = ''
        successMessage.value = ''
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        
        // Prepare event data
        const eventData = {
          title: formData.title,
          description: formData.description || null,
          event_type: formData.event_type,
          start_date: formData.start_date,
          start_time: formData.start_time || null,
          end_date: formData.end_date || null,
          end_time: formData.end_time || null,
          rabbit_id: formData.rabbit_id || null,
          priority: formData.priority,
          location: formData.location || null,
          status: formData.status,
          recurrence_type: formData.recurrence_type || null,
          recurrence_interval: formData.recurrence_type ? formData.recurrence_interval : null,
          recurrence_end_date: formData.recurrence_end_date || null,
          recurrence_days: formData.recurrence_type === 'weekly' && selectedDays.value.length > 0 ? selectedDays.value : null,
          completion_notes: formData.notes || null,
          user_id: user.id
        }
        
        let result
        if (isEditMode.value) {
          // Update existing event
          result = await supabase
            .from('schedule_events')
            .update(eventData)
            .eq('id', props.id)
        } else {
          // Create new event
          result = await supabase
            .from('schedule_events')
            .insert([eventData])
        }
        
        if (result.error) throw result.error
        
        successMessage.value = `Event ${isEditMode.value ? 'updated' : 'created'} successfully!`
        
        // Navigate back after a brief delay
        setTimeout(() => {
          const returnTo = route.query.returnTo || '/schedule'
          router.push(returnTo)
        }, 1500)
        
      } catch (err) {
        console.error('Failed to save event:', err)
        error.value = `Failed to ${isEditMode.value ? 'update' : 'create'} event. Please try again.`
      } finally {
        isSaving.value = false
      }
    }
    
    const goBack = () => {
      const returnTo = route.query.returnTo || '/schedule'
      router.push(returnTo)
    }
    
    // Lifecycle
    onMounted(async () => {
      await fetchRabbits()
      if (isEditMode.value) {
        await fetchEvent()
      }
    })
    
    return {
      // State
      isSaving,
      isLoadingRecord,
      isLoadingRabbits,
      error,
      successMessage,
      rabbits,
      selectedDays,
      
      // Computed
      isEditMode,
      
      // Data
      formData,
      weekdays,
      
      // Methods
      saveEvent,
      goBack
    }
  }
}
</script>

<style scoped>
.event-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-header {
  margin-bottom: 30px;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 20px;
}

.form-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.form-subtitle {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.event-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.form-section {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  background: #f8f9fa;
}

.form-section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 14px;
}

.form-control {
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #fff;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.checkbox-label:hover {
  background: #f8f9fa;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,123,255,0.3);
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108,117,125,0.3);
}

.error-message,
.success-message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  animation: slideIn 0.3s ease;
}

.error-message {
  background: #dc3545;
}

.success-message {
  background: #28a745;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  margin-left: 15px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .event-form-container {
    margin: 10px;
    padding: 15px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .checkbox-group {
    grid-template-columns: 1fr 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
