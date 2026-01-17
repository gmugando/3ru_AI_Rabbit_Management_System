<template>
  <div class="health-page">
    <div class="page-header">
      <div>
        <h1>Health Data Management</h1>
        <p class="subtitle">Track diseases, treatments, and medications</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button">
          <i class="pi pi-filter"></i>
          Filter
        </button>
        <button class="primary-button" @click="addHealthRecord">
          <i class="pi pi-plus"></i>
          Add Health Record
        </button>
      </div>
    </div>

    <div class="content-grid">
      <!-- Health Statistics -->
      <div class="content-card">
        <div class="card-header">
          <h2>Health Overview</h2>
          <div class="header-filters">
            <select class="filter-select" v-model="selectedPeriod" @change="changePeriod(selectedPeriod)">
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
            </select>
          </div>
        </div>
        <div v-if="isLoadingStats" class="loading-state">
          <i class="pi pi-spinner pi-spin"></i>
          <span>Loading health statistics...</span>
        </div>
        
        <div v-else-if="statsError" class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ statsError }}</span>
          <button @click="fetchHealthStats" class="retry-btn">
            <i class="pi pi-refresh"></i>
            Retry
          </button>
        </div>
        
        <div v-else class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon healthy">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-content">
              <h3>Healthy Rabbits</h3>
              <p class="stat-value">{{ healthStats.healthyRabbits }}</p>
              <p class="stat-change positive">{{ healthStats.healthyPercentage }}% of total</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon treatment">
              <i class="pi pi-heart"></i>
            </div>
            <div class="stat-content">
              <h3>Under Treatment</h3>
              <p class="stat-value">{{ healthStats.underTreatment }}</p>
              <p class="stat-change">{{ healthStats.treatmentPercentage }}% of total</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon observation">
              <i class="pi pi-eye"></i>
            </div>
            <div class="stat-content">
              <h3>Under Observation</h3>
              <p class="stat-value">{{ healthStats.underObservation }}</p>
              <p class="stat-change">{{ healthStats.observationPercentage }}% of total</p>
            </div>
          </div>
          
          <div class="stat-card total-rabbits">
            <div class="stat-icon total">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-content">
              <h3>Total Rabbits</h3>
              <p class="stat-value">{{ healthStats.totalRabbits }}</p>
              <p class="stat-change">Active in {{ selectedPeriod.toLowerCase() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Treatments -->
      <div class="content-card">
        <div class="card-header">
          <h2>Active Treatments</h2>
          <button class="card-action-btn" @click="viewAllRecords">View All</button>
        </div>
        <div v-if="isLoadingTreatments" class="loading-state">
          <i class="pi pi-spinner pi-spin"></i>
          <span>Loading active treatments...</span>
        </div>
        
        <div v-else-if="treatmentError" class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ treatmentError }}</span>
          <button @click="fetchActiveTreatments" class="retry-btn">
            <i class="pi pi-refresh"></i>
            Retry
          </button>
        </div>
        
        <div v-else-if="activeTreatments.length > 0" class="treatments-list">
          <div v-for="treatment in activeTreatments.slice(0, 3)" :key="treatment.id" class="treatment-item">
            <div class="treatment-header">
              <div class="rabbit-info">
                <h4>{{ treatment.rabbit?.name || treatment.rabbit_id }}</h4>
                <span class="breed">{{ treatment.rabbit?.breed || 'Unknown breed' }}</span>
              </div>
              <span class="status" :class="getTreatmentStatus(treatment).class">
                {{ getTreatmentStatus(treatment).text }}
              </span>
            </div>
            <div class="treatment-details">
              <div class="condition">
                <label>Condition:</label>
                <span>{{ treatment.condition || treatment.record_type || 'Not specified' }}</span>
              </div>
              <div class="medication">
                <label>{{ treatment.status === 'under_treatment' ? 'Medication:' : 'Action:' }}</label>
                <span>{{ treatment.medication || treatment.treatment_type || 'Monitoring' }}</span>
              </div>
              <div class="duration">
                <label>{{ treatment.status === 'under_treatment' ? 'Duration:' : 'Since:' }}</label>
                <span v-if="treatment.status === 'under_treatment' && getDaysRemaining(treatment) !== null">
                  {{ getDaysRemaining(treatment) > 0 ? `${getDaysRemaining(treatment)} days remaining` : 'Treatment completed' }}
                </span>
                <span v-else>
                  {{ getDaysSince(treatment.record_date) === 0 ? 'Today' : `${getDaysSince(treatment.record_date)} days ago` }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <i class="pi pi-heart"></i>
          <p>No active treatments</p>
          <button class="primary-button small" @click="addHealthRecord">
            <i class="pi pi-plus"></i>
            Add Health Record
          </button>
        </div>
      </div>

      <!-- Recent Health Records -->
      <div class="content-card">
        <div class="card-header">
          <h2>Recent Health Records</h2>
          <button class="card-action-btn" @click="viewAllRecords">View All</button>
        </div>
        <div v-if="isLoading" class="loading-state">
          <i class="pi pi-spinner pi-spin"></i>
          <span>Loading recent health records...</span>
        </div>
        
        <div v-else-if="error" class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ error }}</span>
          <button @click="fetchRecentHealthRecords" class="retry-btn">
            <i class="pi pi-refresh"></i>
            Retry
          </button>
        </div>
        
        <div v-else-if="recentHealthRecords.length > 0" class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rabbit ID</th>
                <th>Condition</th>
                <th>Treatment</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in recentHealthRecords" :key="record.id">
                <td>
                  <strong>{{ record.rabbit?.name || record.rabbit_id }}</strong>
                  <div class="rabbit-breed">{{ record.rabbit?.breed || 'Unknown breed' }}</div>
                </td>
                <td>
                  <div class="condition-cell">
                    <span v-if="record.condition" class="condition-text">{{ record.condition }}</span>
                    <span v-else class="no-condition">{{ record.record_type || 'Checkup' }}</span>
                    <span v-if="record.severity" class="severity-indicator" :class="record.severity">
                      {{ record.severity }}
                    </span>
                  </div>
                </td>
                <td>
                  <span v-if="record.medication" class="treatment-text">{{ record.medication }}</span>
                  <span v-else-if="record.treatment_type" class="treatment-text">{{ record.treatment_type }}</span>
                  <span v-else class="no-treatment">-</span>
                </td>
                <td>{{ formatDate(record.record_date) }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(record.status)">
                    {{ formatStatus(record.status) }}
                  </span>
                </td>
                <td>
                  <button class="icon-button" @click="viewRecord(record)" title="View Details">
                    <i class="pi pi-eye"></i>
                  </button>
                  <button class="icon-button" @click="editRecord(record)" title="Edit Record">
                    <i class="pi pi-pencil"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else class="empty-state">
          <i class="pi pi-heart"></i>
          <p>No health records found</p>
          <button class="primary-button small" @click="addHealthRecord">
            <i class="pi pi-plus"></i>
            Add First Health Record
          </button>
        </div>
      </div>

      <!-- Upcoming Health Events -->
      <UpcomingEventsWidget :limit="5" :event-types="['health']" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import UpcomingEventsWidget from '@/components/UpcomingEventsWidget.vue'

export default {
  name: 'HealthDataManagement',
  components: {
    UpcomingEventsWidget
  },
  setup() {
    const router = useRouter()
    
    // Data state
    const isLoading = ref(false)
    const isLoadingTreatments = ref(false)
    const isLoadingStats = ref(false)
    const error = ref('')
    const treatmentError = ref('')
    const statsError = ref('')
    const recentHealthRecords = ref([])
    const activeTreatments = ref([])
    const healthStats = ref({
      totalRabbits: 0,
      healthyRabbits: 0,
      underTreatment: 0,
      underObservation: 0,
      healthyPercentage: 0,
      treatmentPercentage: 0,
      observationPercentage: 0
    })
    const selectedPeriod = ref('Last 30 Days')
    
    const addHealthRecord = () => {
      router.push('/health-data/add')
    }

    const viewAllRecords = () => {
      router.push('/health-data/records')
    }
    
    // Fetch recent health records
    const fetchRecentHealthRecords = async () => {
      try {
        isLoading.value = true
        error.value = ''
        
        // Get current user for filtering
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        
        // Use direct query instead of view to avoid potential issues
        const { data, error: fetchError } = await supabase
          .from('health_records')
          .select(`
            *,
            rabbit:rabbits(rabbit_id, name, breed)
          `)
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('record_date', { ascending: false })
          .limit(5)
        
        if (fetchError) throw fetchError
        
        recentHealthRecords.value = data || []
        console.log('Fetched user recent health records:', data?.length || 0)
        
      } catch (err) {
        console.error('Error fetching recent health records:', err)
        error.value = 'Failed to load recent health records'
      } finally {
        isLoading.value = false
      }
    }
    
    // Fetch active treatments
    const fetchActiveTreatments = async () => {
      try {
        isLoadingTreatments.value = true
        treatmentError.value = ''
        
        // Get current user for filtering
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        
        // Use direct query instead of view to avoid potential issues
        const { data, error: fetchError } = await supabase
          .from('health_records')
          .select(`
            *,
            rabbit:rabbits(rabbit_id, name, breed)
          `)
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .in('status', ['under_treatment', 'under_observation'])
          .not('treatment_type', 'is', null)
          .or('medication.not.is.null,treatment_type.not.is.null')
          .order('record_date', { ascending: false })
          .limit(10)
        
        if (fetchError) throw fetchError
        
        activeTreatments.value = data || []
        console.log('Fetched user active treatments:', data?.length || 0)
        
      } catch (err) {
        console.error('Error fetching active treatments:', err)
        treatmentError.value = 'Failed to load active treatments'
      } finally {
        isLoadingTreatments.value = false
      }
    }
    
    // Fetch health statistics
    const fetchHealthStats = async () => {
      try {
        isLoadingStats.value = true
        statsError.value = ''
        
        // Get current user for filtering
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        
        console.log('Fetching health statistics for user:', user.id)
        
        // Get user's rabbits only
        const { data: rabbits, error: rabbitsError } = await supabase
          .from('rabbits')
          .select('id, rabbit_id, name')
          .eq('created_by', user.id)
          .eq('is_deleted', false)
        
        if (rabbitsError) {
          console.error('Rabbits query error:', rabbitsError)
          throw new Error(`Failed to fetch rabbits: ${rabbitsError.message}`)
        }
        
        console.log('Fetched user rabbits:', rabbits?.length || 0)
        const totalRabbits = rabbits?.length || 0
        
        // Try to get health records without date filtering first
        let healthRecords = []
        let recordsError = null
        
        try {
          console.log('Attempting to fetch user health records...')
          const { data, error } = await supabase
            .from('health_records')
            .select('rabbit_id, status, record_date')
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .order('record_date', { ascending: false })
            .limit(100) // Limit to avoid large queries
          
          healthRecords = data || []
          recordsError = error
          
          if (recordsError) {
            console.error('Health records error:', recordsError)
          } else {
            console.log('Fetched user health records:', healthRecords.length)
          }
        } catch (err) {
          console.log('Health records table might not exist yet')
          recordsError = err
        }
        
        // Calculate statistics
        let healthyCount = totalRabbits // Default all to healthy
        let treatmentCount = 0
        let observationCount = 0
        
        if (!recordsError && healthRecords.length > 0) {
          // Get the most recent record for each rabbit
          const rabbitStatusMap = new Map()
          healthRecords.forEach(record => {
            if (!rabbitStatusMap.has(record.rabbit_id)) {
              rabbitStatusMap.set(record.rabbit_id, record.status)
            }
          })
          
          // Reset counts and recalculate
          healthyCount = 0
          treatmentCount = 0
          observationCount = 0
          
          rabbits?.forEach(rabbit => {
            const status = rabbitStatusMap.get(rabbit.id)
            if (status === 'under_treatment') {
              treatmentCount++
            } else if (status === 'under_observation') {
              observationCount++
            } else {
              healthyCount++
            }
          })
        }
        
        // Calculate percentages
        const healthyPercentage = totalRabbits > 0 ? Math.round((healthyCount / totalRabbits) * 100) : 0
        const treatmentPercentage = totalRabbits > 0 ? Math.round((treatmentCount / totalRabbits) * 100) : 0
        const observationPercentage = totalRabbits > 0 ? Math.round((observationCount / totalRabbits) * 100) : 0
        
        healthStats.value = {
          totalRabbits,
          healthyRabbits: healthyCount,
          underTreatment: treatmentCount,
          underObservation: observationCount,
          healthyPercentage,
          treatmentPercentage,
          observationPercentage
        }
        
        console.log('Health stats calculated:', healthStats.value)
        
      } catch (err) {
        console.error('Error fetching health stats:', err)
        statsError.value = `Failed to load health statistics: ${err.message || 'Unknown error'}`
      } finally {
        isLoadingStats.value = false
      }
    }
    
    // Handle period filter change
    const changePeriod = (newPeriod) => {
      selectedPeriod.value = newPeriod
      fetchHealthStats()
    }
    
    // Helper functions
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
    
    const formatStatus = (status) => {
      const statusMap = {
        healthy: 'Healthy',
        under_treatment: 'Active',
        under_observation: 'Monitoring',
        recovered: 'Completed',
        chronic: 'Chronic'
      }
      return statusMap[status] || status
    }
    
    const getStatusClass = (status) => {
      const classMap = {
        healthy: 'completed',
        under_treatment: 'treatment',
        under_observation: 'observation',
        recovered: 'completed',
        chronic: 'chronic'
      }
      return classMap[status] || 'treatment'
    }
    
    const viewRecord = () => {
      router.push({ 
        name: 'HealthRecordsList'
      })
    }
    
    const editRecord = (record) => {
      router.push({ 
        name: 'EditHealthRecord', 
        params: { id: record.id },
        query: { returnTo: 'dashboard' }
      })
    }
    
    // Treatment-specific helper functions
    const getDaysRemaining = (treatment) => {
      if (!treatment.treatment_start_date || !treatment.treatment_duration) {
        return null
      }
      
      const startDate = new Date(treatment.treatment_start_date)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + treatment.treatment_duration)
      
      const today = new Date()
      const timeDiff = endDate - today
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
      
      return daysDiff > 0 ? daysDiff : 0
    }
    
    const getDaysSince = (dateString) => {
      const date = new Date(dateString)
      const today = new Date()
      const timeDiff = today - date
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      
      return daysDiff
    }
    
    const getTreatmentStatus = (treatment) => {
      if (treatment.status === 'under_treatment') {
        return { text: 'Under Treatment', class: 'treatment' }
      } else if (treatment.status === 'under_observation') {
        return { text: 'Under Observation', class: 'observation' }
      }
      return { text: 'Active', class: 'treatment' }
    }
    
    onMounted(() => {
      fetchRecentHealthRecords()
      fetchActiveTreatments()
      fetchHealthStats()
    })

    return {
      isLoading,
      isLoadingTreatments,
      isLoadingStats,
      error,
      treatmentError,
      statsError,
      recentHealthRecords,
      activeTreatments,
      healthStats,
      selectedPeriod,
      addHealthRecord,
      viewAllRecords,
      fetchRecentHealthRecords,
      fetchActiveTreatments,
      fetchHealthStats,
      changePeriod,
      formatDate,
      formatStatus,
      getStatusClass,
      viewRecord,
      editRecord,
      getDaysRemaining,
      getDaysSince,
      getTreatmentStatus
    }
  }
}
</script>

<style scoped>
.health-page {
  padding: 1.5rem;
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

.primary-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-button:hover {
  background: #2563eb;
}

.secondary-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.secondary-button:hover {
  background: #f8fafc;
}

.content-grid {
  display: grid;
  gap: 1.5rem;
}

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.card-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.card-action-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

.header-filters {
  display: flex;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-select:hover {
  border-color: #9ca3af;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

/* Override immediately at mobile width */
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr !important;
    min-width: 0 !important;
  }
}

.stat-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon.healthy {
  background: #f0fdf4;
  color: #10b981;
}

.stat-icon.treatment {
  background: #fff1f2;
  color: #ef4444;
}

.stat-icon.observation {
  background: #fef3c7;
  color: #f59e0b;
}

.stat-icon.total {
  background: #f3f4f6;
  color: #374151;
}

.stat-card.total-rabbits {
  order: -1; /* Place first in grid */
}

.stat-content h3 {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.stat-value {
  margin: 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.stat-change {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.stat-change.positive {
  color: #10b981;
}

.treatments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.treatment-item {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.treatment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rabbit-info h4 {
  margin: 0;
  color: #1e293b;
}

.breed {
  font-size: 0.875rem;
  color: #64748b;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.status.treatment {
  background: #fff1f2;
  color: #ef4444;
}

.status.observation {
  background: #fef3c7;
  color: #f59e0b;
}

.treatment-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

/* Override immediately at mobile width */
@media (max-width: 480px) {
  .treatment-details {
    grid-template-columns: 1fr !important;
    min-width: 0 !important;
  }
}

.treatment-details label {
  font-size: 0.875rem;
  color: #64748b;
  display: block;
  margin-bottom: 0.25rem;
}

.treatment-details span {
  color: #1e293b;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  font-weight: 600;
  color: #64748b;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.status-badge.treatment {
  background: #fff1f2;
  color: #ef4444;
}

.status-badge.observation {
  background: #fef3c7;
  color: #f59e0b;
}

.status-badge.completed {
  background: #f0fdf4;
  color: #10b981;
}

.icon-button {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-button:hover {
  color: #3b82f6;
}

/* Loading and Error States */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: #64748b;
  text-align: center;
}

.error-state {
  color: #dc2626;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #b91c1c;
}

.empty-state p {
  margin: 0.5rem 0 1rem 0;
}

.primary-button.small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Enhanced Table Styles */
.rabbit-breed {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.condition-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.condition-text {
  font-weight: 500;
  color: #1e293b;
}

.no-condition {
  font-style: italic;
  color: #64748b;
  text-transform: capitalize;
}

.severity-indicator {
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-indicator.mild {
  background: #f0fdf4;
  color: #16a34a;
}

.severity-indicator.moderate {
  background: #fef3c7;
  color: #d97706;
}

.severity-indicator.severe {
  background: #fef2f2;
  color: #dc2626;
}

.severity-indicator.critical {
  background: #f3f4f6;
  color: #1f2937;
}

.treatment-text {
  color: #1e293b;
  font-weight: 500;
}

.no-treatment {
  color: #9ca3af;
  font-style: italic;
}

/* Status Badge Updates */
.status-badge.chronic {
  background: #f3f4f6;
  color: #374151;
}

.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Tablet only - not for small phones */
@media (min-width: 481px) and (max-width: 768px) {
  .treatment-details {
    grid-template-columns: 1fr;
  }
}

/* Mobile fixes for small screens - IMPORTANT: These must override desktop styles */
@media screen and (max-width: 480px) {
  /* Diagnostic: Add subtle indicator when mobile styles are active */
  .health-data-page::before {
    content: "📱 Mobile Mode Active";
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: #3b82f6;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    z-index: 9999;
    opacity: 0.7;
  }

  /* Force mobile layout - LOCK DOWN the page */
  .health-data-page,
  div.health-data-page,
  body .health-data-page {
    padding: 1rem !important;
    max-width: 100vw !important;
    width: 100vw !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }
  
  /* Prevent ANY child from expanding beyond viewport */
  .health-data-page *,
  .health-data-page * > * {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  
  /* Lock down content cards */
  .health-data-page .content-card,
  .content-card {
    max-width: 100% !important;
    width: 100% !important;
    overflow-x: hidden !important;
  }

  .page-header {
    flex-direction: column !important;
    gap: 1rem;
  }

  .header-actions {
    flex-direction: column !important;
    width: 100% !important;
  }

  .header-actions button {
    width: 100% !important;
  }

  /* Stats grid - NUCLEAR OPTION: Force single column no matter what */
  .health-data-page .stats-grid,
  .content-card .stats-grid,
  div.stats-grid,
  .stats-grid,
  [class*="stats-grid"] {
    display: grid !important;
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
    grid-auto-columns: 1fr !important;
    grid-auto-flow: row !important;
    gap: 0.75rem !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  
  /* Force stat cards to take full width */
  .stats-grid > .stat-card,
  .stats-grid > * {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    grid-column: 1 / -1 !important;
  }

  /* Filters stack vertically */
  .filters {
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    width: 100%;
    min-width: auto;
  }

  /* Treatment details - NUCLEAR OPTION: Force single column no matter what */
  .health-data-page .treatment-details,
  .treatments-list .treatment-details,
  .treatment-item .treatment-details,
  div.treatment-details,
  .treatment-details,
  [class*="treatment-details"] {
    display: grid !important;
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
    grid-auto-columns: 1fr !important;
    grid-auto-flow: row !important;
    gap: 0.75rem !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  
  /* Force treatment detail items to take full width */
  .treatment-details > div,
  .treatment-details > * {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    grid-column: 1 / -1 !important;
  }

  /* Treatment header stack on very small screens */
  .treatment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  /* Stat cards more compact */
  .stat-card {
    padding: 0.75rem;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }
}

/* Ultra-narrow screens */
@media (max-width: 360px) {
  .health-data-page {
    padding: 0.5rem;
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .stat-card {
    padding: 0.5rem;
    gap: 0.75rem;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 1.125rem;
  }
}
</style> 