<template>
  <div class="feeding-schedule-container">
    <div class="header">
      <h1>Feeding Schedules</h1>
      <button @click="openAddModal" class="add-button">
        <i class="fas fa-plus"></i> Add Schedule
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading schedules...
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <!-- Schedules List -->
    <div v-if="!loading && !error" class="schedules-list">
      <div v-for="schedule in schedules" :key="schedule.id" class="schedule-card">
        <div class="schedule-header">
          <h3>{{ schedule.name }}</h3>
          <div class="schedule-actions">
            <button @click="editSchedule(schedule)" class="edit-button">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="confirmDelete(schedule)" class="delete-button">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <p class="description">{{ schedule.description }}</p>
        <div class="schedule-details">
          <div class="detail">
            <i class="fas fa-clock"></i>
            <span>{{ formatTime(schedule.time) }}</span>
          </div>
          <div class="detail">
            <i class="fas fa-calendar"></i>
            <span>{{ formatFrequency(schedule.frequency) }}</span>
          </div>
          <div class="detail">
            <i class="fas fa-utensils"></i>
            <span>{{ formatFeedType(schedule.feed_type) }}</span>
          </div>
        </div>
        <div v-if="schedule.sections" class="sections">
          <strong>Sections:</strong> {{ schedule.sections }}
        </div>
        <div v-if="schedule.notes" class="notes">
          <strong>Notes:</strong> {{ schedule.notes }}
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingSchedule ? 'Edit Schedule' : 'Add Schedule' }}</h2>
          <button @click="closeModal" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="schedule-form">
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
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="form.description"
              required
              placeholder="Describe the feeding schedule"
            ></textarea>
          </div>

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
            <select id="frequency" v-model="form.frequency" required>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

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

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-button">
              Cancel
            </button>
            <button type="submit" class="submit-button" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : (editingSchedule ? 'Update' : 'Add') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this feeding schedule?</p>
        <div class="delete-actions">
          <button @click="closeDeleteModal" class="cancel-button">
            Cancel
          </button>
          <button @click="deleteSchedule" class="delete-button" :disabled="isDeleting">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '@/supabase'

export default {
  name: 'FeedingScheduleForm',
  setup() {
    const schedules = ref([])
    const loading = ref(true)
    const error = ref(null)
    const showModal = ref(false)
    const showDeleteModal = ref(false)
    const editingSchedule = ref(null)
    const scheduleToDelete = ref(null)
    const isSubmitting = ref(false)
    const isDeleting = ref(false)

    const form = reactive({
      name: '',
      description: '',
      time: '',
      frequency: 'daily',
      feed_type: 'adult_rabbit_feed',
      sections: '',
      notes: ''
    })

    const fetchSchedules = async () => {
      try {
        loading.value = true
        error.value = null

        const { data: user } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { data, error: fetchError } = await supabase
          .from('feeding_schedules')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('time', { ascending: true })

        if (fetchError) throw fetchError

        schedules.value = data
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const resetForm = () => {
      form.name = ''
      form.description = ''
      form.time = ''
      form.frequency = 'daily'
      form.feed_type = 'adult_rabbit_feed'
      form.sections = ''
      form.notes = ''
    }

    const openAddModal = () => {
      editingSchedule.value = null
      resetForm()
      showModal.value = true
    }

    const editSchedule = (schedule) => {
      editingSchedule.value = schedule
      Object.assign(form, schedule)
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
      resetForm()
    }

    const confirmDelete = (schedule) => {
      scheduleToDelete.value = schedule
      showDeleteModal.value = true
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
      scheduleToDelete.value = null
    }

    const handleSubmit = async () => {
      try {
        isSubmitting.value = true
        error.value = null

        const { data: user } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const scheduleData = {
          ...form,
          user_id: user.id
        }

        if (editingSchedule.value) {
          const { error: updateError } = await supabase
            .from('feeding_schedules')
            .update(scheduleData)
            .eq('id', editingSchedule.value.id)
            .eq('user_id', user.id)

          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase
            .from('feeding_schedules')
            .insert([scheduleData])

          if (insertError) throw insertError
        }

        await fetchSchedules()
        closeModal()
      } catch (err) {
        error.value = err.message
      } finally {
        isSubmitting.value = false
      }
    }

    const deleteSchedule = async () => {
      try {
        isDeleting.value = true
        error.value = null

        const { data: user } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { error: deleteError } = await supabase
          .from('feeding_schedules')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: user.id
          })
          .eq('id', scheduleToDelete.value.id)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError

        await fetchSchedules()
        closeDeleteModal()
      } catch (err) {
        error.value = err.message
      } finally {
        isDeleting.value = false
      }
    }

    const formatTime = (time) => {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    const formatFrequency = (frequency) => {
      const frequencies = {
        daily: 'Daily',
        weekly: 'Weekly',
        biweekly: 'Bi-weekly',
        monthly: 'Monthly'
      }
      return frequencies[frequency] || frequency
    }

    const formatFeedType = (feedType) => {
      const feedTypes = {
        adult_rabbit_feed: 'Adult Rabbit Feed',
        growing_rabbit_feed: 'Growing Rabbit Feed',
        breeding_rabbit_feed: 'Breeding Rabbit Feed',
        hay: 'Hay',
        supplements: 'Supplements'
      }
      return feedTypes[feedType] || feedType
    }

    onMounted(fetchSchedules)

    return {
      schedules,
      loading,
      error,
      showModal,
      showDeleteModal,
      editingSchedule,
      form,
      isSubmitting,
      isDeleting,
      openAddModal,
      editSchedule,
      closeModal,
      confirmDelete,
      closeDeleteModal,
      handleSubmit,
      deleteSchedule,
      formatTime,
      formatFrequency,
      formatFeedType
    }
  }
}
</script>

<style scoped>
.feeding-schedule-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.add-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-button:hover {
  background-color: #45a049;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.schedules-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.schedule-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.schedule-header h3 {
  margin: 0;
  color: #333;
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-button,
.delete-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #666;
}

.edit-button:hover {
  color: #2196F3;
}

.delete-button:hover {
  color: #f44336;
}

.description {
  color: #666;
  margin-bottom: 1rem;
}

.schedule-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.sections,
.notes {
  margin-top: 1rem;
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 1.25rem;
}

.schedule-form {
  display: flex;
  flex-direction: column;
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
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-button,
.submit-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-button {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  color: #666;
}

.submit-button {
  background-color: #2196F3;
  border: none;
  color: white;
}

.submit-button:hover {
  background-color: #1976D2;
}

.submit-button:disabled {
  background-color: #90CAF9;
  cursor: not-allowed;
}

.delete-modal {
  text-align: center;
}

.delete-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .feeding-schedule-container {
    padding: 1rem;
  }

  .schedules-list {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    padding: 1.5rem;
  }
}
</style> 