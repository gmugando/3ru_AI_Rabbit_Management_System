<template>
  <div class="feeding-schedule-form-page">
    <div class="page-header">
      <div>
        <h1>{{ isEditing ? 'Edit Schedule' : 'Add New Schedule' }}</h1>
        <p class="subtitle">{{ isEditing ? 'Update feeding schedule information' : 'Create a new feeding schedule for your rabbits' }}</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="$router.back()">
          <i class="fas fa-times"></i>
          Cancel
        </button>
        <button class="primary-button" @click="handleSubmit" :disabled="isSubmitting">
          <i class="fas fa-save"></i>
          {{ isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Schedule') }}
        </button>
      </div>
    </div>

    <div class="content-card">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="schedule-form">
        <div class="form-row">
          <div class="form-group">
            <label for="name">Schedule Name</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              placeholder="e.g., Morning Feed"
            />
          </div>
          <div class="form-group">
            <label for="priority">Priority</label>
            <select id="priority" v-model="form.priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            required
            placeholder="Describe the feeding schedule"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="time">Time</label>
            <input
              id="time"
              v-model="form.time"
              type="time"
              required
            />
          </div>
          <div class="form-group">
            <label for="frequency">Frequency</label>
            <select id="frequency" v-model="form.frequency" required @change="onFrequencyChange">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <!-- Days of Week for Weekly Schedule -->
        <div v-if="form.frequency === 'weekly'" class="form-group">
          <label>Days of Week</label>
          <div class="days-of-week">
            <label v-for="(day, index) in daysOfWeek" :key="index" class="day-checkbox">
              <input 
                type="checkbox" 
                :value="index + 1"
                v-model="form.days_of_week"
              />
              <span>{{ day }}</span>
            </label>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="feed_type">Feed Type</label>
            <select id="feed_type" v-model="form.feed_type" required>
              <option value="adult_rabbit_feed">Adult Rabbit Feed</option>
              <option value="growing_rabbit_feed">Growing Rabbit Feed</option>
              <option value="breeding_rabbit_feed">Breeding Rabbit Feed</option>
              <option value="hay">Hay</option>
              <option value="supplements">Supplements</option>
            </select>
          </div>
          <div class="form-group">
            <label for="amount">Amount (Optional)</label>
            <div class="amount-input">
              <input
                id="amount"
                v-model="form.amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              <select v-model="form.amount_unit">
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lbs">lbs</option>
                <option value="cups">cups</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="start_date">Start Date</label>
            <input
              id="start_date"
              v-model="form.start_date"
              type="date"
            />
          </div>
          <div class="form-group">
            <label for="end_date">End Date (Optional)</label>
            <input
              id="end_date"
              v-model="form.end_date"
              type="date"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="sections">Sections (Optional)</label>
          <input
            id="sections"
            v-model="form.sections"
            type="text"
            placeholder="e.g., Section A, B, C"
          />
        </div>

        <div class="form-group">
          <label for="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            v-model="form.notes"
            placeholder="Additional notes"
          ></textarea>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="form.auto_create_records"
            />
            <span>Automatically create feed records when executed</span>
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="form.is_active"
            />
            <span>Active (schedule will be executed)</span>
          </label>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/supabase'
import { scheduleIntegration } from '@/services/scheduleIntegration'

export default {
  name: 'FeedingScheduleForm',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const loading = ref(false)
    const error = ref(null)
    const isSubmitting = ref(false)
    const isEditing = ref(false)
    const scheduleId = ref(null)

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    const form = reactive({
      name: '',
      description: '',
      time: '',
      frequency: 'daily',
      feed_type: 'adult_rabbit_feed',
      sections: '',
      notes: '',
      amount: null,
      amount_unit: 'kg',
      priority: 'medium',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      days_of_week: [],
      auto_create_records: false,
      is_active: true
    })

    const loadSchedule = async () => {
      try {
        loading.value = true
        error.value = null

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { data, error: fetchError } = await supabase
          .from('feeding_schedules')
          .select('*')
          .eq('id', scheduleId.value)
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .single()

        if (fetchError) throw fetchError

        // Populate form with existing data
        Object.assign(form, {
          ...data,
          start_date: data.start_date || new Date().toISOString().split('T')[0],
          end_date: data.end_date || '',
          days_of_week: data.days_of_week || [],
          amount: data.amount || null
        })

      } catch (err) {
        error.value = err.message
        // If schedule not found, redirect back
        if (err.message.includes('No rows')) {
          router.push('/feeding/schedule')
        }
      } finally {
        loading.value = false
      }
    }

    const onFrequencyChange = () => {
      if (form.frequency !== 'weekly') {
        form.days_of_week = []
      }
    }

    const handleSubmit = async () => {
      try {
        isSubmitting.value = true
        error.value = null

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const scheduleData = {
          ...form,
          user_id: user.id,
          amount: form.amount || null,
          end_date: form.end_date || null,
          days_of_week: form.frequency === 'weekly' ? form.days_of_week : null
        }

        if (isEditing.value) {
          const { error: updateError } = await supabase
            .from('feeding_schedules')
            .update(scheduleData)
            .eq('id', scheduleId.value)
            .eq('user_id', user.id)

          if (updateError) throw updateError
        } else {
          const { data, error: insertError } = await supabase
            .from('feeding_schedules')
            .insert([scheduleData])
            .select()

          if (insertError) throw insertError
          
          // Create feeding reminder events for new schedules
          if (data && data.length > 0) {
            try {
              const savedSchedule = data[0]
              await scheduleIntegration.createFeedingReminders(savedSchedule, user.id)
              console.log('Created feeding reminder events')
            } catch (scheduleError) {
              console.error('Failed to create feeding schedule events:', scheduleError)
              // Don't fail the whole operation if schedule creation fails
            }
          }
        }

        // Navigate back to list
        router.push('/feeding/schedule')
      } catch (err) {
        error.value = err.message
      } finally {
        isSubmitting.value = false
      }
    }

    onMounted(() => {
      // Check if we're editing (has ID parameter)
      if (route.params.id) {
        isEditing.value = true
        scheduleId.value = route.params.id
        loadSchedule()
      }
    })

    return {
      loading,
      error,
      isSubmitting,
      isEditing,
      form,
      daysOfWeek,
      onFrequencyChange,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.feeding-schedule-form-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2rem;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.primary-button,
.secondary-button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: all 0.2s;
}

.primary-button {
  background-color: #2196F3;
  color: white;
}

.primary-button:hover {
  background-color: #1976D2;
}

.primary-button:disabled {
  background-color: #90CAF9;
  cursor: not-allowed;
}

.secondary-button {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.secondary-button:hover {
  background-color: #e0e0e0;
}

.content-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
}

.schedule-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
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
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.amount-input {
  display: flex;
  gap: 0.5rem;
}

.amount-input input {
  flex: 1;
}

.amount-input select {
  width: 80px;
}

.days-of-week {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.5rem 0;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.day-checkbox:hover {
  background-color: #f5f5f5;
}

.day-checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: normal;
  margin: 0;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
  transform: scale(1.2);
}

@media (max-width: 768px) {
  .feeding-schedule-form-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-actions {
    justify-content: space-between;
  }

  .content-card {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .days-of-week {
    gap: 0.5rem;
  }

  .day-checkbox {
    padding: 0.25rem;
  }
}
</style>