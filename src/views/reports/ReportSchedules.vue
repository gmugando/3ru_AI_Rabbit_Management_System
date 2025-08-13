<template>
  <div class="report-schedules-page">
    <div class="page-header">
      <h1>📅 Report Schedules</h1>
      <p>Automate your report generation and delivery</p>
      <router-link to="/reports/schedules/add" class="btn btn-primary">
        <i class="fas fa-plus"></i> Create New Schedule
      </router-link>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid" v-if="!isLoading">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalSchedules }}</h3>
          <p>Total Schedules</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">
          <i class="fas fa-play"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.activeSchedules }}</h3>
          <p>Active Schedules</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <i class="fas fa-check"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.successfulExecutions }}</h3>
          <p>Successful Executions</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <i class="fas fa-exclamation"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.failedExecutions }}</h3>
          <p>Failed Executions</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading schedules...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Error Loading Schedules</h3>
      <p>{{ error }}</p>
      <button @click="loadSchedules" class="btn btn-secondary">Retry</button>
    </div>

    <!-- Schedules List -->
    <div v-else-if="schedules.length > 0" class="schedules-container">
      <div class="schedules-header">
        <h2>Your Report Schedules</h2>
        <div class="filters">
          <select v-model="statusFilter" class="form-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select v-model="typeFilter" class="form-select">
            <option value="">All Types</option>
            <option value="population">Population</option>
            <option value="health">Health</option>
            <option value="financial">Financial</option>
            <option value="breeding">Breeding</option>
            <option value="feeding">Feeding</option>
            <option value="comprehensive">Comprehensive</option>
          </select>
        </div>
      </div>

      <div class="schedules-grid">
        <div 
          v-for="schedule in filteredSchedules" 
          :key="schedule.id" 
          class="schedule-card"
          :class="{ inactive: !schedule.is_active }"
        >
          <div class="schedule-header">
            <div class="schedule-title">
              <h3>{{ schedule.name }}</h3>
              <span class="schedule-type" :class="schedule.report_type">
                {{ formatReportType(schedule.report_type) }}
              </span>
            </div>
            <div class="schedule-status">
              <span 
                class="status-badge" 
                :class="schedule.is_active ? 'active' : 'inactive'"
              >
                {{ schedule.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>

          <div class="schedule-details">
            <div class="detail-row">
              <span class="label">Frequency:</span>
              <span class="value">{{ formatFrequency(schedule.frequency, schedule.frequency_config) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Next Generation:</span>
              <span class="value">{{ formatNextGeneration(schedule.next_generation_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Delivery:</span>
              <span class="value">{{ formatDeliveryMethod(schedule.delivery_method) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Executions:</span>
              <span class="value">{{ schedule.generation_count }}</span>
            </div>
          </div>

          <div class="schedule-actions">
            <button 
              @click="toggleScheduleStatus(schedule.id, !schedule.is_active)"
              class="btn btn-sm"
              :class="schedule.is_active ? 'btn-warning' : 'btn-success'"
            >
              <i :class="schedule.is_active ? 'fas fa-pause' : 'fas fa-play'"></i>
              {{ schedule.is_active ? 'Pause' : 'Activate' }}
            </button>
            <button @click="triggerManualGeneration(schedule.id)" class="btn btn-sm btn-primary">
              <i class="fas fa-play"></i> Run Now
            </button>
            <button @click="editSchedule(schedule)" class="btn btn-sm btn-secondary">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button @click="viewHistory(schedule.id)" class="btn btn-sm btn-info">
              <i class="fas fa-history"></i> History
            </button>
            <button @click="deleteSchedule(schedule.id)" class="btn btn-sm btn-danger">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="fas fa-calendar-plus"></i>
      <h3>No Report Schedules</h3>
      <p>Create your first automated report schedule to get started.</p>
      <button @click="showCreateModal = true" class="btn btn-primary">
        Create Your First Schedule
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { reportSchedulingService } from '@/services/reportSchedulingService'
import { supabase } from '@/supabase'

export default {
  name: 'ReportSchedules',
  setup() {
    const router = useRouter()
    
    // State
    const schedules = ref([])
    const stats = ref({
      totalSchedules: 0,
      activeSchedules: 0,
      successfulExecutions: 0,
      failedExecutions: 0
    })
    const isLoading = ref(false)
    const error = ref('')
    const showCreateModal = ref(false)

    // Filters
    const statusFilter = ref('')
    const typeFilter = ref('')

    // Computed
    const filteredSchedules = computed(() => {
      let filtered = schedules.value

      if (statusFilter.value) {
        filtered = filtered.filter(s => 
          statusFilter.value === 'active' ? s.is_active : !s.is_active
        )
      }

      if (typeFilter.value) {
        filtered = filtered.filter(s => s.report_type === typeFilter.value)
      }

      return filtered
    })

    // Methods
    const loadSchedules = async () => {
      try {
        isLoading.value = true
        error.value = ''

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        const [schedulesData, statsData] = await Promise.all([
          reportSchedulingService.getSchedules(user.id),
          reportSchedulingService.getScheduleStats(user.id)
        ])

        schedules.value = schedulesData
        stats.value = statsData
      } catch (err) {
        console.error('Failed to load schedules:', err)
        error.value = 'Failed to load schedules. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    const toggleScheduleStatus = async (scheduleId, isActive) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        await reportSchedulingService.toggleScheduleStatus(scheduleId, isActive, user.id)
        await loadSchedules()
      } catch (err) {
        console.error('Failed to toggle schedule status:', err)
        error.value = 'Failed to update schedule status. Please try again.'
      }
    }

    const triggerManualGeneration = async (scheduleId) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        await reportSchedulingService.triggerManualGeneration(scheduleId, user.id)
        // Show success message
      } catch (err) {
        console.error('Failed to trigger manual generation:', err)
        error.value = 'Failed to generate report. Please try again.'
      }
    }

    const editSchedule = (schedule) => {
      // Navigate to edit form
      router.push(`/reports/schedules/${schedule.id}/edit`)
    }

    const viewHistory = (scheduleId) => {
      // Show history modal
      console.log('View history:', scheduleId)
    }

    const deleteSchedule = async (scheduleId) => {
      if (!confirm('Are you sure you want to delete this schedule?')) {
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        await reportSchedulingService.deleteSchedule(scheduleId, user.id)
        await loadSchedules()
      } catch (err) {
        console.error('Failed to delete schedule:', err)
        error.value = 'Failed to delete schedule. Please try again.'
      }
    }

    // Formatting helpers
    const formatReportType = (type) => {
      const types = {
        population: 'Population',
        health: 'Health',
        financial: 'Financial',
        breeding: 'Breeding',
        feeding: 'Feeding',
        comprehensive: 'Comprehensive'
      }
      return types[type] || type
    }

    const formatFrequency = (frequency, config) => {
      const frequencies = {
        daily: 'Daily',
        weekly: `Weekly (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][config?.day || 0]})`,
        monthly: `Monthly (${config?.day || 1}${getOrdinalSuffix(config?.day || 1)})`,
        quarterly: `Quarterly (${config?.day || 1}${getOrdinalSuffix(config?.day || 1)})`,
        yearly: `Yearly (${config?.day || 1}${getOrdinalSuffix(config?.day || 1)})`
      }
      return frequencies[frequency] || frequency
    }

    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return 'th'
      switch (day % 10) {
        case 1: return 'st'
        case 2: return 'nd'
        case 3: return 'rd'
        default: return 'th'
      }
    }

    const formatNextGeneration = (date) => {
      if (!date) return 'Not scheduled'
      const nextDate = new Date(date)
      const now = new Date()
      const diffTime = nextDate - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) return 'Overdue'
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Tomorrow'
      if (diffDays < 7) return `${diffDays} days`
      
      return nextDate.toLocaleDateString()
    }

    const formatDeliveryMethod = (method) => {
      const methods = {
        dashboard: 'Dashboard Only',
        email: 'Email Only',
        both: 'Dashboard & Email'
      }
      return methods[method] || method
    }

    // Lifecycle
    onMounted(() => {
      loadSchedules()
    })

    return {
      schedules,
      stats,
      isLoading,
      error,
      showCreateModal,
      statusFilter,
      typeFilter,
      filteredSchedules,
      loadSchedules,
      toggleScheduleStatus,
      triggerManualGeneration,
      editSchedule,
      viewHistory,
      deleteSchedule,
      formatReportType,
      formatFrequency,
      formatNextGeneration,
      formatDeliveryMethod
    }
  }
}
</script>

<style scoped>
.report-schedules-page {
  padding: 2rem;
  max-width: 1200px;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #4a5568;
}

.stat-icon.active {
  background: #c6f6d5;
  color: #38a169;
}

.stat-icon.success {
  background: #c6f6d5;
  color: #38a169;
}

.stat-icon.warning {
  background: #fed7d7;
  color: #e53e3e;
}

.stat-content h3 {
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
  margin: 0;
}

.stat-content p {
  color: #718096;
  margin: 0;
}

.schedules-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.schedules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filters {
  display: flex;
  gap: 1rem;
}

.schedules-grid {
  display: grid;
  gap: 1.5rem;
}

.schedule-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.schedule-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.schedule-card.inactive {
  opacity: 0.6;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.schedule-title h3 {
  margin: 0 0 0.5rem 0;
  color: #2d3748;
}

.schedule-type {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.schedule-type.population { background: #bee3f8; color: #2b6cb0; }
.schedule-type.health { background: #fed7d7; color: #c53030; }
.schedule-type.financial { background: #c6f6d5; color: #38a169; }
.schedule-type.breeding { background: #fef5e7; color: #d69e2e; }
.schedule-type.feeding { background: #e6fffa; color: #319795; }
.schedule-type.comprehensive { background: #faf5ff; color: #805ad5; }

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: #c6f6d5;
  color: #38a169;
}

.status-badge.inactive {
  background: #fed7d7;
  color: #e53e3e;
}

.schedule-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.detail-row .label {
  font-weight: 500;
  color: #4a5568;
}

.detail-row .value {
  color: #2d3748;
}

.schedule-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.loading-container,
.error-container,
.empty-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
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

.btn-secondary {
  background: #718096;
  color: white;
}

.btn-secondary:hover {
  background: #4a5568;
}

.btn-success {
  background: #38a169;
  color: white;
}

.btn-success:hover {
  background: #2f855a;
}

.btn-warning {
  background: #d69e2e;
  color: white;
}

.btn-warning:hover {
  background: #b7791f;
}

.btn-danger {
  background: #e53e3e;
  color: white;
}

.btn-danger:hover {
  background: #c53030;
}

.btn-info {
  background: #319795;
  color: white;
}

.btn-info:hover {
  background: #2c7a7b;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .report-schedules-page {
    padding: 1rem;
  }

  .schedules-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .filters {
    flex-direction: column;
  }

  .schedule-actions {
    flex-direction: column;
  }

  .schedule-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
