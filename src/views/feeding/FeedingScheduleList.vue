<template>
  <div class="feeding-schedule-list-page">
    <div class="page-header">
      <div>
        <h1>Feeding Schedules</h1>
        <p class="subtitle">Manage your rabbit feeding schedules</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="showUpcomingSchedules">
          <i class="fas fa-clock"></i>
          Upcoming
        </button>
        <button class="secondary-button" @click="$router.push('/feeding/dashboard')">
          <i class="fas fa-chart-line"></i>
          Dashboard
        </button>
        <button class="primary-button" @click="$router.push('/feeding/schedule/add')">
          <i class="fas fa-plus"></i>
          Add Schedule
        </button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-container">
      <div class="stat-card">
        <h3>{{ activeSchedules.length }}</h3>
        <p>Active Schedules</p>
      </div>
      <div class="stat-card overdue" v-if="overdueSchedules.length > 0">
        <h3>{{ overdueSchedules.length }}</h3>
        <p>Overdue</p>
      </div>
      <div class="stat-card upcoming">
        <h3>{{ upcomingSchedules.length }}</h3>
        <p>Due Today</p>
      </div>
    </div>

    <!-- Filter Options -->
    <div class="filters">
      <select v-model="selectedFilter" @change="filterSchedules">
        <option value="all">All Schedules</option>
        <option value="active">Active Only</option>
        <option value="overdue">Overdue</option>
        <option value="upcoming">Due Today</option>
        <option value="inactive">Inactive</option>
      </select>
      <select v-model="selectedFeedType" @change="filterSchedules">
        <option value="">All Feed Types</option>
        <option value="adult_rabbit_feed">Adult Rabbit Feed</option>
        <option value="growing_rabbit_feed">Growing Rabbit Feed</option>
        <option value="breeding_rabbit_feed">Breeding Rabbit Feed</option>
        <option value="hay">Hay</option>
        <option value="supplements">Supplements</option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      Loading schedules...
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && filteredSchedules.length === 0" class="empty-state">
      <i class="fas fa-calendar-alt"></i>
      <h3>No schedules found</h3>
      <p v-if="selectedFilter === 'all'">Create your first feeding schedule to get started</p>
      <p v-else>No schedules match your current filters</p>
      <button v-if="selectedFilter === 'all'" class="primary-button" @click="$router.push('/feeding/schedule/add')">
        Create First Schedule
      </button>
    </div>

    <!-- Schedules List -->
    <div v-else-if="!loading && !error" class="schedules-list">
      <div 
        v-for="schedule in filteredSchedules" 
        :key="schedule.id" 
        class="schedule-card"
        :class="{ 
          'overdue': isOverdue(schedule), 
          'upcoming': isUpcoming(schedule),
          'inactive': !schedule.is_active 
        }"
      >
        <div class="schedule-header">
          <div class="schedule-title">
            <h3>{{ schedule.name }}</h3>
            <div class="schedule-badges">
              <span 
                v-if="!schedule.is_active" 
                class="badge inactive"
              >
                Inactive
              </span>
              <span 
                v-if="isOverdue(schedule)" 
                class="badge overdue"
              >
                Overdue
              </span>
              <span 
                v-if="isUpcoming(schedule)" 
                class="badge upcoming"
              >
                Due Soon
              </span>
              <span 
                v-if="schedule.priority !== 'medium'" 
                class="badge priority"
                :class="schedule.priority"
              >
                {{ formatPriority(schedule.priority) }}
              </span>
            </div>
          </div>
          <div class="schedule-actions">
            <button 
              v-if="schedule.is_active && !isOverdue(schedule)" 
              @click="executeSchedule(schedule)" 
              class="execute-button"
              title="Mark as completed"
            >
              <i class="fas fa-check"></i>
            </button>
            <button 
              @click="toggleActive(schedule)" 
              class="toggle-button"
              :title="schedule.is_active ? 'Deactivate' : 'Activate'"
            >
              <i :class="schedule.is_active ? 'fas fa-pause' : 'fas fa-play'"></i>
            </button>
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
            <span>{{ formatFrequency(schedule.frequency, schedule.days_of_week) }}</span>
          </div>
          <div class="detail">
            <i class="fas fa-utensils"></i>
            <span>{{ formatFeedType(schedule.feed_type) }}</span>
          </div>
          <div v-if="schedule.amount" class="detail">
            <i class="fas fa-weight-hanging"></i>
            <span>{{ schedule.amount }} {{ schedule.amount_unit || 'kg' }}</span>
          </div>
        </div>

        <div class="schedule-metadata">
          <div v-if="schedule.next_due_at" class="next-due">
            <strong>Next Due:</strong> {{ formatDateTime(schedule.next_due_at) }}
          </div>
          <div v-if="schedule.execution_count > 0" class="execution-count">
            <strong>Completed:</strong> {{ schedule.execution_count }} times
          </div>
          <div v-if="schedule.last_executed_at" class="last-executed">
            <strong>Last Fed:</strong> {{ formatDateTime(schedule.last_executed_at) }}
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

    <!-- Execute Schedule Modal -->
    <div v-if="showExecuteModal" class="modal-overlay" @click="closeExecuteModal">
      <div class="modal-content execute-modal" @click.stop>
        <div class="modal-header">
          <h2>Mark Schedule as Completed</h2>
          <button @click="closeExecuteModal" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="execute-form">
          <p><strong>Schedule:</strong> {{ executingSchedule?.name }}</p>
          <p><strong>Expected Amount:</strong> {{ executingSchedule?.amount || 'Not specified' }} {{ executingSchedule?.amount_unit || 'kg' }}</p>
          
          <div class="form-group">
            <label for="actual_amount">Actual Amount Fed</label>
            <div class="amount-input">
              <input
                id="actual_amount"
                v-model="executeForm.amount"
                type="number"
                step="0.01"
                min="0"
                :placeholder="executingSchedule?.amount || '0.00'"
              />
              <span>{{ executingSchedule?.amount_unit || 'kg' }}</span>
            </div>
          </div>

          <div class="form-group">
            <label for="execute_notes">Notes (Optional)</label>
            <textarea
              id="execute_notes"
              v-model="executeForm.notes"
              placeholder="Any notes about this feeding"
            ></textarea>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="executeForm.create_record"
                :checked="executingSchedule?.auto_create_records"
              />
              <span>Create feed record</span>
            </label>
          </div>

          <div v-if="executeForm.create_record" class="form-group">
            <label for="feed_brand">Feed Brand/Formula</label>
            <input
              id="feed_brand"
              v-model="executeForm.feed_brand"
              type="text"
              placeholder="Brand or formula name"
            />
          </div>

          <div class="execute-actions">
            <button @click="closeExecuteModal" class="secondary-button">
              Cancel
            </button>
            <button @click="confirmExecute" class="primary-button" :disabled="isExecuting">
              {{ isExecuting ? 'Marking Complete...' : 'Mark Complete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this feeding schedule?</p>
        <div class="delete-actions">
          <button @click="closeDeleteModal" class="secondary-button">
            Cancel
          </button>
          <button @click="deleteSchedule" class="danger-button" :disabled="isDeleting">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'FeedingScheduleList',
  setup() {
    const router = useRouter()
    
    const schedules = ref([])
    const loading = ref(true)
    const error = ref(null)
    const showExecuteModal = ref(false)
    const showDeleteModal = ref(false)
    const executingSchedule = ref(null)
    const scheduleToDelete = ref(null)
    const isExecuting = ref(false)
    const isDeleting = ref(false)
    const selectedFilter = ref('all')
    const selectedFeedType = ref('')

    const executeForm = reactive({
      amount: null,
      notes: '',
      create_record: false,
      feed_brand: ''
    })

    // Computed properties
    const activeSchedules = computed(() => 
      schedules.value.filter(s => s.is_active && !s.is_deleted)
    )

    const overdueSchedules = computed(() => 
      schedules.value.filter(s => isOverdue(s))
    )

    const upcomingSchedules = computed(() => 
      schedules.value.filter(s => isUpcoming(s))
    )

    const filteredSchedules = computed(() => {
      let filtered = schedules.value

      // Filter by status
      switch (selectedFilter.value) {
        case 'active':
          filtered = filtered.filter(s => s.is_active)
          break
        case 'overdue':
          filtered = filtered.filter(s => isOverdue(s))
          break
        case 'upcoming':
          filtered = filtered.filter(s => isUpcoming(s))
          break
        case 'inactive':
          filtered = filtered.filter(s => !s.is_active)
          break
      }

      // Filter by feed type
      if (selectedFeedType.value) {
        filtered = filtered.filter(s => s.feed_type === selectedFeedType.value)
      }

      return filtered
    })

    // Helper functions
    const isOverdue = (schedule) => {
      if (!schedule.is_active || !schedule.next_due_at) return false
      return new Date(schedule.next_due_at) < new Date()
    }

    const isUpcoming = (schedule) => {
      if (!schedule.is_active || !schedule.next_due_at) return false
      const now = new Date()
      const due = new Date(schedule.next_due_at)
      const hoursUntilDue = (due - now) / (1000 * 60 * 60)
      return hoursUntilDue >= 0 && hoursUntilDue <= 24
    }

    const fetchSchedules = async () => {
      try {
        loading.value = true
        error.value = null

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Try to fetch schedules - if user_id column doesn't exist, the table needs migration
        const { data, error: fetchError } = await supabase
          .from('feeding_schedules')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('next_due_at', { ascending: true, nullsLast: true })

        if (fetchError) throw fetchError

        schedules.value = data || []
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const editSchedule = (schedule) => {
      router.push(`/feeding/schedule/${schedule.id}/edit`)
    }

    const executeSchedule = (schedule) => {
      executingSchedule.value = schedule
      resetExecuteForm()
      executeForm.create_record = schedule.auto_create_records || false
      executeForm.amount = schedule.amount
      showExecuteModal.value = true
    }

    const resetExecuteForm = () => {
      Object.assign(executeForm, {
        amount: null,
        notes: '',
        create_record: false,
        feed_brand: ''
      })
    }

    const closeExecuteModal = () => {
      showExecuteModal.value = false
      executingSchedule.value = null
      resetExecuteForm()
    }

    const confirmExecute = async () => {
      try {
        isExecuting.value = true
        error.value = null

        const { error: executeError } = await supabase.rpc('execute_feeding_schedule', {
          schedule_id_param: executingSchedule.value.id,
          amount_fed_param: executeForm.amount,
          notes_param: executeForm.notes,
          create_feed_record: executeForm.create_record,
          feed_brand_param: executeForm.feed_brand || null
        })

        if (executeError) throw executeError

        await fetchSchedules()
        closeExecuteModal()
      } catch (err) {
        error.value = err.message
      } finally {
        isExecuting.value = false
      }
    }

    const confirmDelete = (schedule) => {
      scheduleToDelete.value = schedule
      showDeleteModal.value = true
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
      scheduleToDelete.value = null
    }

    const deleteSchedule = async () => {
      try {
        isDeleting.value = true
        error.value = null

        const { data: { user } } = await supabase.auth.getUser()
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

    const toggleActive = async (schedule) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { error: updateError } = await supabase
          .from('feeding_schedules')
          .update({ is_active: !schedule.is_active })
          .eq('id', schedule.id)
          .eq('user_id', user.id)

        if (updateError) throw updateError

        await fetchSchedules()
      } catch (err) {
        error.value = err.message
      }
    }

    const filterSchedules = () => {
      // This is handled by the computed property
    }

    const showUpcomingSchedules = () => {
      selectedFilter.value = 'upcoming'
    }

    // Formatting functions
    const formatTime = (time) => {
      if (!time) return 'No time set'
      return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    const formatFrequency = (frequency, daysOfWeek) => {
      const frequencies = {
        daily: 'Daily',
        weekly: 'Weekly',
        biweekly: 'Bi-weekly',
        monthly: 'Monthly'
      }
      
      let result = frequencies[frequency] || frequency
      
      if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const selectedDayNames = daysOfWeek.map(day => dayNames[day - 1]).join(', ')
        result += ` (${selectedDayNames})`
      }
      
      return result
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

    const formatPriority = (priority) => {
      return priority.charAt(0).toUpperCase() + priority.slice(1)
    }

    const formatDateTime = (dateTime) => {
      if (!dateTime) return 'Not set'
      return new Date(dateTime).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    onMounted(fetchSchedules)

    return {
      schedules,
      loading,
      error,
      showExecuteModal,
      showDeleteModal,
      executingSchedule,
      executeForm,
      isExecuting,
      isDeleting,
      selectedFilter,
      selectedFeedType,
      activeSchedules,
      overdueSchedules,
      upcomingSchedules,
      filteredSchedules,
      isOverdue,
      isUpcoming,
      editSchedule,
      executeSchedule,
      closeExecuteModal,
      confirmExecute,
      confirmDelete,
      closeDeleteModal,
      deleteSchedule,
      toggleActive,
      filterSchedules,
      showUpcomingSchedules,
      formatTime,
      formatFrequency,
      formatFeedType,
      formatPriority,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.feeding-schedule-list-page {
  max-width: 1400px;
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
.secondary-button,
.danger-button {
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

.secondary-button {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.secondary-button:hover {
  background-color: #e0e0e0;
}

.danger-button {
  background-color: #f44336;
  color: white;
}

.danger-button:hover {
  background-color: #d32f2f;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  font-size: 2rem;
  margin: 0;
  color: #333;
}

.stat-card p {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.stat-card.overdue h3 {
  color: #f44336;
}

.stat-card.upcoming h3 {
  color: #FF9800;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filters select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #ddd;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.schedules-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.schedule-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #4CAF50;
}

.schedule-card.overdue {
  border-left-color: #f44336;
}

.schedule-card.upcoming {
  border-left-color: #FF9800;
}

.schedule-card.inactive {
  border-left-color: #9E9E9E;
  opacity: 0.7;
}

.schedule-header {
  margin-bottom: 1rem;
}

.schedule-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.schedule-title h3 {
  margin: 0;
  color: #333;
}

.schedule-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.inactive {
  background-color: #f5f5f5;
  color: #666;
}

.badge.overdue {
  background-color: #ffebee;
  color: #c62828;
}

.badge.upcoming {
  background-color: #fff3e0;
  color: #e65100;
}

.badge.priority.high {
  background-color: #ffebee;
  color: #c62828;
}

.badge.priority.critical {
  background-color: #d32f2f;
  color: white;
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
}

.execute-button,
.toggle-button,
.edit-button,
.delete-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #666;
  border-radius: 4px;
}

.execute-button:hover {
  color: #4CAF50;
  background-color: #f1f8e9;
}

.toggle-button:hover {
  color: #FF9800;
  background-color: #fff3e0;
}

.edit-button:hover {
  color: #2196F3;
  background-color: #e3f2fd;
}

.delete-button:hover {
  color: #f44336;
  background-color: #ffebee;
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
  font-size: 0.9rem;
}

.schedule-metadata {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #666;
}

.schedule-metadata > div {
  margin-bottom: 0.25rem;
}

.schedule-metadata > div:last-child {
  margin-bottom: 0;
}

.sections,
.notes {
  margin-top: 1rem;
  color: #666;
  font-size: 0.9rem;
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
  max-width: 500px;
  max-height: 80vh;
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

.execute-form {
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
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.amount-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.amount-input input {
  flex: 1;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.execute-actions,
.delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.delete-modal {
  text-align: center;
  max-width: 400px;
}

.delete-actions {
  justify-content: center;
}

@media (max-width: 768px) {
  .feeding-schedule-list-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .schedules-list {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    padding: 1.5rem;
  }

  .filters {
    flex-direction: column;
  }

  .stats-container {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>
