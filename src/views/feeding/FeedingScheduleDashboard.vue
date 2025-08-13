<template>
  <div class="schedule-dashboard">
    <div class="dashboard-header">
      <h1>Feeding Schedule Dashboard</h1>
      <div class="header-actions">
        <button @click="refreshData" class="refresh-button" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i> Refresh
        </button>
        <button @click="goToScheduleManager" class="manage-button">
          <i class="fas fa-cog"></i> Manage Schedules
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading dashboard...
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <!-- Dashboard Content -->
    <div v-if="!loading && !error" class="dashboard-content">
      
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div class="card-content">
            <h3>{{ summary.total_schedules }}</h3>
            <p>Total Schedules</p>
          </div>
        </div>

        <div class="summary-card active">
          <div class="card-icon">
            <i class="fas fa-play-circle"></i>
          </div>
          <div class="card-content">
            <h3>{{ summary.active_schedules }}</h3>
            <p>Active Schedules</p>
          </div>
        </div>

        <div class="summary-card overdue" v-if="summary.overdue_schedules > 0">
          <div class="card-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="card-content">
            <h3>{{ summary.overdue_schedules }}</h3>
            <p>Overdue</p>
          </div>
        </div>

        <div class="summary-card upcoming">
          <div class="card-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="card-content">
            <h3>{{ summary.due_today }}</h3>
            <p>Due Today</p>
          </div>
        </div>

        <div class="summary-card executions">
          <div class="card-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="card-content">
            <h3>{{ summary.total_executions }}</h3>
            <p>Total Completed</p>
          </div>
        </div>

        <div class="summary-card compliance">
          <div class="card-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="card-content">
            <h3>{{ summary.avg_compliance || 0 }}%</h3>
            <p>Avg Compliance</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <button @click="markAllOverdueComplete" class="action-button danger" v-if="summary.overdue_schedules > 0">
            <i class="fas fa-check-double"></i>
            Mark All Overdue Complete
          </button>
          <button @click="bulkActivateSchedules" class="action-button success">
            <i class="fas fa-play"></i>
            Bulk Activate
          </button>
          <button @click="bulkDeactivateSchedules" class="action-button warning">
            <i class="fas fa-pause"></i>
            Bulk Deactivate
          </button>
          <button @click="createScheduleTemplate" class="action-button primary">
            <i class="fas fa-plus"></i>
            Create Template
          </button>
        </div>
      </div>

      <!-- Upcoming Schedules -->
      <div class="upcoming-section">
        <div class="section-header">
          <h2>Upcoming Schedules (Next 24 Hours)</h2>
          <button @click="executeAllDue" class="execute-all-button" v-if="upcomingSchedules.length > 0">
            <i class="fas fa-play"></i> Execute All Due
          </button>
        </div>
        
        <div v-if="upcomingSchedules.length === 0" class="empty-state">
          <i class="fas fa-calendar-day"></i>
          <p>No schedules due in the next 24 hours</p>
        </div>

        <div v-else class="upcoming-schedules">
          <div 
            v-for="schedule in upcomingSchedules" 
            :key="schedule.id" 
            class="upcoming-schedule"
            :class="{ 'overdue': schedule.hours_until_due < 0 }"
          >
            <div class="schedule-info">
              <h4>{{ schedule.name }}</h4>
              <p>{{ schedule.description }}</p>
              <div class="schedule-details">
                <span class="feed-type">{{ formatFeedType(schedule.feed_type) }}</span>
                <span class="amount" v-if="schedule.amount">
                  {{ schedule.amount }} {{ schedule.amount_unit }}
                </span>
                <span class="sections" v-if="schedule.sections">
                  {{ schedule.sections }}
                </span>
              </div>
            </div>
            
            <div class="schedule-timing">
              <div class="due-time">
                <strong>Due:</strong> {{ formatDateTime(schedule.next_due_at) }}
              </div>
              <div class="time-status" :class="getTimeStatusClass(schedule.hours_until_due)">
                {{ formatTimeUntilDue(schedule.hours_until_due) }}
              </div>
            </div>

            <div class="schedule-actions">
              <button 
                @click="executeSchedule(schedule)" 
                class="execute-btn"
                :class="{ 'overdue': schedule.hours_until_due < 0 }"
              >
                <i class="fas fa-check"></i>
                {{ schedule.hours_until_due < 0 ? 'Complete (Overdue)' : 'Complete' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Overview -->
      <div class="performance-section">
        <h2>Performance Overview</h2>
        <div class="performance-grid">
          <div 
            v-for="schedule in performanceData" 
            :key="schedule.id" 
            class="performance-card"
            :class="{ 'low-compliance': schedule.compliance_percentage < 80 }"
          >
            <div class="performance-header">
              <h4>{{ schedule.name }}</h4>
              <span class="status-badge" :class="schedule.status">
                {{ formatStatus(schedule.status) }}
              </span>
            </div>
            
            <div class="performance-metrics">
              <div class="metric">
                <span class="metric-label">Compliance</span>
                <span class="metric-value">{{ schedule.compliance_percentage || 0 }}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Executions</span>
                <span class="metric-value">{{ schedule.execution_count }}</span>
              </div>
              <div class="metric" v-if="schedule.avg_amount_per_execution">
                <span class="metric-label">Avg Amount</span>
                <span class="metric-value">{{ schedule.avg_amount_per_execution }} {{ schedule.amount_unit }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Last Fed</span>
                <span class="metric-value">{{ formatDate(schedule.last_feed_date) }}</span>
              </div>
            </div>

            <div class="performance-actions">
              <button @click="viewScheduleHistory(schedule)" class="history-btn">
                <i class="fas fa-history"></i> History
              </button>
              <button @click="editSchedule(schedule)" class="edit-btn">
                <i class="fas fa-edit"></i> Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Schedule History Modal -->
    <div v-if="showHistoryModal" class="modal-overlay" @click="closeHistoryModal">
      <div class="modal-content history-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedSchedule?.name }} - Execution History</h2>
          <button @click="closeHistoryModal" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="history-content">
          <div v-if="scheduleHistory.length === 0" class="empty-state">
            <i class="fas fa-clock"></i>
            <p>No execution history found for the last 30 days</p>
          </div>

          <div v-else class="history-list">
            <div 
              v-for="execution in scheduleHistory" 
              :key="execution.execution_time" 
              class="history-item"
            >
              <div class="execution-date">
                {{ formatDateTime(execution.execution_time) }}
              </div>
              <div class="execution-details">
                <span class="amount">{{ execution.amount_fed }} {{ selectedSchedule?.amount_unit }}</span>
                <span class="status" :class="execution.execution_status">
                  {{ formatExecutionStatus(execution.execution_status) }}
                </span>
              </div>
              <div v-if="execution.notes" class="execution-notes">
                {{ execution.notes }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Actions Modal -->
    <div v-if="showBulkModal" class="modal-overlay" @click="closeBulkModal">
      <div class="modal-content bulk-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ bulkAction }} Schedules</h2>
          <button @click="closeBulkModal" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="bulk-content">
          <p>Select schedules to {{ bulkAction.toLowerCase() }}:</p>
          <div class="schedule-selection">
            <div 
              v-for="schedule in getSelectableSchedules()" 
              :key="schedule.id" 
              class="schedule-checkbox"
            >
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  :value="schedule.id" 
                  v-model="selectedScheduleIds"
                />
                <span>{{ schedule.name }} ({{ formatFeedType(schedule.feed_type) }})</span>
              </label>
            </div>
          </div>

          <div class="bulk-actions">
            <button @click="closeBulkModal" class="cancel-button">
              Cancel
            </button>
            <button 
              @click="confirmBulkAction" 
              class="confirm-button" 
              :disabled="selectedScheduleIds.length === 0 || isBulkProcessing"
            >
              {{ isBulkProcessing ? 'Processing...' : `${bulkAction} Selected (${selectedScheduleIds.length})` }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'FeedingScheduleDashboard',
  setup() {
    const router = useRouter()
    
    const loading = ref(true)
    const error = ref(null)
    const showHistoryModal = ref(false)
    const showBulkModal = ref(false)
    const selectedSchedule = ref(null)
    const scheduleHistory = ref([])
    const upcomingSchedules = ref([])
    const performanceData = ref([])
    const bulkAction = ref('')
    const selectedScheduleIds = ref([])
    const isBulkProcessing = ref(false)

    const summary = reactive({
      total_schedules: 0,
      active_schedules: 0,
      overdue_schedules: 0,
      due_today: 0,
      total_executions: 0,
      avg_compliance: 0
    })

    // Load dashboard data
    const loadDashboardData = async () => {
      try {
        loading.value = true
        error.value = null

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Load summary data
        const { data: summaryData, error: summaryError } = await supabase
          .rpc('get_feeding_schedule_summary', { user_id_param: user.id })

        if (summaryError) throw summaryError
        if (summaryData && summaryData.length > 0) {
          Object.assign(summary, summaryData[0])
        }

        // Load upcoming schedules
        const { data: upcomingData, error: upcomingError } = await supabase
          .rpc('get_upcoming_schedules', { 
            user_id_param: user.id, 
            hours_ahead: 24 
          })

        if (upcomingError) throw upcomingError
        upcomingSchedules.value = upcomingData || []

        // Load performance data
        const { data: performanceDataResult, error: performanceError } = await supabase
          .from('feeding_schedule_performance')
          .select('*')
          .eq('user_id', user.id)
          .order('compliance_percentage', { ascending: false })

        if (performanceError) throw performanceError
        performanceData.value = performanceDataResult || []

      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    // Navigation and actions
    const goToScheduleManager = () => {
      router.push('/feeding/schedule')
    }

    const refreshData = () => {
      loadDashboardData()
    }

    const executeSchedule = async (schedule) => {
      try {
        const { error: executeError } = await supabase.rpc('execute_feeding_schedule', {
          schedule_id_param: schedule.id,
          amount_fed_param: schedule.amount,
          create_feed_record: true
        })

        if (executeError) throw executeError

        await loadDashboardData()
      } catch (err) {
        error.value = err.message
      }
    }

    const executeAllDue = async () => {
      try {
        const overdueSchedules = upcomingSchedules.value.filter(s => s.hours_until_due <= 0)
        
        for (const schedule of overdueSchedules) {
          await supabase.rpc('execute_feeding_schedule', {
            schedule_id_param: schedule.id,
            amount_fed_param: schedule.amount,
            create_feed_record: true
          })
        }

        await loadDashboardData()
      } catch (err) {
        error.value = err.message
      }
    }

    const markAllOverdueComplete = async () => {
      try {
        const overdueSchedules = performanceData.value.filter(s => s.status === 'overdue')
        
        for (const schedule of overdueSchedules) {
          await supabase.rpc('execute_feeding_schedule', {
            schedule_id_param: schedule.id,
            amount_fed_param: schedule.expected_amount,
            create_feed_record: true
          })
        }

        await loadDashboardData()
      } catch (err) {
        error.value = err.message
      }
    }

    // Bulk actions
    const bulkActivateSchedules = () => {
      bulkAction.value = 'Activate'
      selectedScheduleIds.value = []
      showBulkModal.value = true
    }

    const bulkDeactivateSchedules = () => {
      bulkAction.value = 'Deactivate'
      selectedScheduleIds.value = []
      showBulkModal.value = true
    }

    const getSelectableSchedules = () => {
      if (bulkAction.value === 'Activate') {
        return performanceData.value.filter(s => !s.is_active)
      } else {
        return performanceData.value.filter(s => s.is_active)
      }
    }

    const confirmBulkAction = async () => {
      try {
        isBulkProcessing.value = true
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const newStatus = bulkAction.value === 'Activate'
        
        const { error: bulkError } = await supabase.rpc('bulk_update_schedule_status', {
          schedule_ids: selectedScheduleIds.value,
          new_status: newStatus,
          user_id_param: user.id
        })

        if (bulkError) throw bulkError

        await loadDashboardData()
        closeBulkModal()
      } catch (err) {
        error.value = err.message
      } finally {
        isBulkProcessing.value = false
      }
    }

    const closeBulkModal = () => {
      showBulkModal.value = false
      selectedScheduleIds.value = []
      bulkAction.value = ''
    }

    // Schedule history
    const viewScheduleHistory = async (schedule) => {
      try {
        selectedSchedule.value = schedule
        
        const { data, error: historyError } = await supabase.rpc('get_schedule_history', {
          schedule_id_param: schedule.id,
          days_back: 30
        })

        if (historyError) throw historyError
        
        scheduleHistory.value = data || []
        showHistoryModal.value = true
      } catch (err) {
        error.value = err.message
      }
    }

    const closeHistoryModal = () => {
      showHistoryModal.value = false
      selectedSchedule.value = null
      scheduleHistory.value = []
    }

    const editSchedule = (schedule) => {
      router.push(`/feeding/schedule/${schedule.id}/edit`)
    }

    const createScheduleTemplate = () => {
      router.push('/feeding/schedule/add')
    }

    // Formatting functions
    const formatFeedType = (feedType) => {
      const feedTypes = {
        adult_rabbit_feed: 'Adult Feed',
        growing_rabbit_feed: 'Growing Feed',
        breeding_rabbit_feed: 'Breeding Feed',
        hay: 'Hay',
        supplements: 'Supplements'
      }
      return feedTypes[feedType] || feedType
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

    const formatDate = (date) => {
      if (!date) return 'Never'
      return new Date(date).toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      })
    }

    const formatTimeUntilDue = (hours) => {
      if (hours < 0) {
        return `${Math.abs(Math.round(hours))} hours overdue`
      } else if (hours < 1) {
        return `${Math.round(hours * 60)} minutes`
      } else {
        return `${Math.round(hours)} hours`
      }
    }

    const getTimeStatusClass = (hours) => {
      if (hours < 0) return 'overdue'
      if (hours < 2) return 'urgent'
      if (hours < 12) return 'soon'
      return 'normal'
    }

    const formatStatus = (status) => {
      const statuses = {
        active: 'Active',
        overdue: 'Overdue',
        due_soon: 'Due Soon',
        inactive: 'Inactive'
      }
      return statuses[status] || status
    }

    const formatExecutionStatus = (status) => {
      const statuses = {
        completed: 'Completed',
        partial: 'Partial',
        skipped: 'Skipped',
        failed: 'Failed'
      }
      return statuses[status] || status
    }

    onMounted(loadDashboardData)

    return {
      loading,
      error,
      summary,
      upcomingSchedules,
      performanceData,
      showHistoryModal,
      showBulkModal,
      selectedSchedule,
      scheduleHistory,
      bulkAction,
      selectedScheduleIds,
      isBulkProcessing,
      goToScheduleManager,
      refreshData,
      executeSchedule,
      executeAllDue,
      markAllOverdueComplete,
      bulkActivateSchedules,
      bulkDeactivateSchedules,
      getSelectableSchedules,
      confirmBulkAction,
      closeBulkModal,
      viewScheduleHistory,
      closeHistoryModal,
      editSchedule,
      createScheduleTemplate,
      formatFeedType,
      formatDateTime,
      formatDate,
      formatTimeUntilDue,
      getTimeStatusClass,
      formatStatus,
      formatExecutionStatus
    }
  }
}
</script>

<style scoped>
.schedule-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.refresh-button,
.manage-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.refresh-button {
  background-color: #f5f5f5;
  color: #666;
}

.refresh-button:hover {
  background-color: #e0e0e0;
}

.manage-button {
  background-color: #2196F3;
  color: white;
}

.manage-button:hover {
  background-color: #1976D2;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error {
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.summary-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  background-color: #9E9E9E;
}

.summary-card.active .card-icon {
  background-color: #4CAF50;
}

.summary-card.overdue .card-icon {
  background-color: #f44336;
}

.summary-card.upcoming .card-icon {
  background-color: #FF9800;
}

.summary-card.executions .card-icon {
  background-color: #2196F3;
}

.summary-card.compliance .card-icon {
  background-color: #9C27B0;
}

.card-content h3 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

.card-content p {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.quick-actions {
  margin-bottom: 3rem;
}

.quick-actions h2 {
  margin-bottom: 1rem;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: white;
}

.action-button.danger {
  background-color: #f44336;
}

.action-button.success {
  background-color: #4CAF50;
}

.action-button.warning {
  background-color: #FF9800;
}

.action-button.primary {
  background-color: #2196F3;
}

.action-button:hover {
  opacity: 0.9;
}

.upcoming-section,
.performance-section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.execute-all-button {
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

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ddd;
}

.upcoming-schedules {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upcoming-schedule {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1.5rem;
  align-items: center;
  border-left: 4px solid #4CAF50;
}

.upcoming-schedule.overdue {
  border-left-color: #f44336;
}

.schedule-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.schedule-info p {
  margin: 0 0 1rem 0;
  color: #666;
}

.schedule-details {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.schedule-details span {
  background-color: #f5f5f5;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #666;
}

.schedule-timing {
  text-align: right;
}

.due-time {
  margin-bottom: 0.5rem;
  color: #666;
}

.time-status {
  font-weight: 500;
}

.time-status.overdue {
  color: #f44336;
}

.time-status.urgent {
  color: #FF9800;
}

.time-status.soon {
  color: #FFC107;
}

.time-status.normal {
  color: #4CAF50;
}

.execute-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  background-color: #4CAF50;
  color: white;
}

.execute-btn.overdue {
  background-color: #f44336;
}

.execute-btn:hover {
  opacity: 0.9;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.performance-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #4CAF50;
}

.performance-card.low-compliance {
  border-left-color: #f44336;
}

.performance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.performance-header h4 {
  margin: 0;
  color: #333;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.status-badge.overdue {
  background-color: #ffebee;
  color: #c62828;
}

.status-badge.due_soon {
  background-color: #fff3e0;
  color: #e65100;
}

.status-badge.inactive {
  background-color: #f5f5f5;
  color: #666;
}

.performance-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-weight: 500;
  color: #333;
}

.performance-actions {
  display: flex;
  gap: 0.5rem;
}

.history-btn,
.edit-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: white;
  color: #666;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.history-btn:hover,
.edit-btn:hover {
  background-color: #f5f5f5;
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

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.execution-date {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
}

.execution-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.execution-details .amount {
  font-weight: 500;
}

.execution-details .status {
  padding: 0.125rem 0.5rem;
  border-radius: 8px;
  font-size: 0.8rem;
}

.execution-details .status.completed {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.execution-notes {
  color: #666;
  font-style: italic;
}

.schedule-selection {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
}

.schedule-checkbox {
  margin-bottom: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.bulk-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-button,
.confirm-button {
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

.confirm-button {
  background-color: #2196F3;
  border: none;
  color: white;
}

.confirm-button:disabled {
  background-color: #90CAF9;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .schedule-dashboard {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .upcoming-schedule {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .performance-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    justify-content: center;
  }
}
</style>
