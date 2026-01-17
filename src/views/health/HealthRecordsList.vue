<template>
  <div class="health-records-list-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-button" @click="goBack">
          <i class="pi pi-arrow-left"></i>
          Back to Health Management
        </button>
        <div class="header-title">
          <h1>All Health Records</h1>
          <p class="subtitle">Complete medical history and treatment records</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="showFilters = !showFilters">
          <i class="pi pi-filter"></i>
          {{ showFilters ? 'Hide Filters' : 'Show Filters' }}
        </button>
        <button class="primary-button" @click="addHealthRecord">
          <i class="pi pi-plus"></i>
          Add Health Record
        </button>
      </div>
    </div>

    <!-- Filters Panel -->
    <div v-if="showFilters" class="filters-panel">
      <div class="filters-content">
        <div class="filter-group">
          <label for="rabbit-filter">Rabbit</label>
          <select id="rabbit-filter" v-model="filters.rabbitId" @change="applyFilters" class="filter-select">
            <option value="">All Rabbits</option>
            <option v-for="rabbit in rabbits" :key="rabbit.id" :value="rabbit.id">
              {{ rabbit.rabbit_id }} - {{ rabbit.name }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="record-type-filter">Record Type</label>
          <select id="record-type-filter" v-model="filters.recordType" @change="applyFilters" class="filter-select">
            <option value="">All Types</option>
            <option value="checkup">Checkup</option>
            <option value="illness">Illness</option>
            <option value="treatment">Treatment</option>
            <option value="vaccination">Vaccination</option>
            <option value="injury">Injury</option>
            <option value="observation">Observation</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="status-filter">Status</label>
          <select id="status-filter" v-model="filters.status" @change="applyFilters" class="filter-select">
            <option value="">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="under_treatment">Under Treatment</option>
            <option value="under_observation">Under Observation</option>
            <option value="recovered">Recovered</option>
            <option value="chronic">Chronic</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="date-from">Date From</label>
          <input id="date-from" type="date" v-model="filters.dateFrom" @change="applyFilters" class="filter-input">
        </div>
        
        <div class="filter-group">
          <label for="date-to">Date To</label>
          <input id="date-to" type="date" v-model="filters.dateTo" @change="applyFilters" class="filter-input">
        </div>
        
        <button @click="clearFilters" class="clear-filters-btn">
          <i class="pi pi-times"></i>
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Records Container -->
    <div class="records-container">
      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spinner pi-spin"></i>
        <span>Loading health records...</span>
      </div>
      
      <div v-else-if="error" class="error-state">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ error }}</span>
        <button @click="fetchHealthRecords" class="retry-btn">
          <i class="pi pi-refresh"></i>
          Retry
        </button>
      </div>
      
      <div v-else-if="filteredRecords.length > 0" class="records-table-container">
        <div class="table-header">
          <div class="records-count">
            Showing {{ filteredRecords.length }} of {{ totalRecords }} records
          </div>
          <div class="table-actions">
            <button class="table-action-btn" @click="exportRecords">
              <i class="pi pi-download"></i>
              Export
            </button>
          </div>
        </div>
        
        <div class="records-table">
          <div class="table-header-row">
            <div class="table-cell header">Date</div>
            <div class="table-cell header">Rabbit</div>
            <div class="table-cell header">Type</div>
            <div class="table-cell header">Condition</div>
            <div class="table-cell header">Status</div>
            <div class="table-cell header">Treatment</div>
            <div class="table-cell header">Follow-up</div>
            <div class="table-cell header">Actions</div>
          </div>
          
          <div v-for="record in paginatedRecords" :key="record.id" class="table-row">
            <div class="table-cell">
              <div class="date-cell">
                <span class="date-primary">{{ formatDate(record.record_date) }}</span>
                <span class="date-secondary">{{ getTimeAgo(record.record_date) }}</span>
              </div>
            </div>
            <div class="table-cell">
              <div class="rabbit-cell">
                <span class="rabbit-tag">{{ record.rabbit_tag }}</span>
                <span class="rabbit-breed">{{ record.breed }}</span>
              </div>
            </div>
            <div class="table-cell">
              <span class="type-badge" :class="record.record_type">
                {{ capitalizeFirst(record.record_type) }}
              </span>
            </div>
            <div class="table-cell">
              <div class="condition-cell">
                <span v-if="record.condition" class="condition-text">{{ record.condition }}</span>
                <span v-else class="no-data">-</span>
                <span v-if="record.severity" class="severity-badge" :class="record.severity">
                  {{ capitalizeFirst(record.severity) }}
                </span>
              </div>
            </div>
            <div class="table-cell">
              <span class="status-badge" :class="record.status">
                {{ formatStatus(record.status) }}
              </span>
            </div>
            <div class="table-cell">
              <div class="treatment-cell">
                <span v-if="record.medication" class="treatment-text">{{ record.medication }}</span>
                <span v-else-if="record.treatment_type" class="treatment-text">{{ capitalizeFirst(record.treatment_type) }}</span>
                <span v-else class="no-data">-</span>
                <span v-if="record.treatment_active" class="active-indicator">
                  <i class="pi pi-circle-fill"></i>
                  Active
                </span>
              </div>
            </div>
            <div class="table-cell">
              <div class="follow-up-cell">
                <span v-if="record.follow_up_required && !record.follow_up_completed" class="follow-up-required">
                  <i class="pi pi-calendar"></i>
                  {{ record.follow_up_date ? formatDate(record.follow_up_date) : 'Required' }}
                </span>
                <span v-else-if="record.follow_up_completed" class="follow-up-completed">
                  <i class="pi pi-check"></i>
                  Completed
                </span>
                <span v-else class="no-data">-</span>
              </div>
            </div>
            <div class="table-cell">
              <div class="action-buttons">
                <button class="action-btn view" @click="viewRecord(record)" title="View Details">
                  <i class="pi pi-eye"></i>
                </button>
                <button class="action-btn edit" @click="editRecord(record)" title="Edit Record">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="action-btn delete" @click="deleteRecord(record)" title="Delete Record">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="pagination-btn">
            <i class="pi pi-chevron-left"></i>
          </button>
          
          <div class="pagination-info">
            Page {{ currentPage }} of {{ totalPages }}
          </div>
          
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="pagination-btn">
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <i class="pi pi-heart"></i>
        <h3>No Health Records Found</h3>
        <p>{{ hasFilters ? 'No records match your filters.' : 'No health records have been created yet.' }}</p>
        <button v-if="!hasFilters" class="primary-button" @click="addHealthRecord">
          <i class="pi pi-plus"></i>
          Add First Health Record
        </button>
        <button v-else @click="clearFilters" class="secondary-button">
          <i class="pi pi-times"></i>
          Clear Filters
        </button>
      </div>
    </div>

    <!-- View Record Modal -->
    <div v-if="selectedRecord" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Health Record Details</h2>
          <button class="modal-close-btn" @click="closeModal">
            <i class="pi pi-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="record-details">
            <!-- Basic Information -->
            <div class="detail-section">
              <h3>Basic Information</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Rabbit</label>
                  <span>{{ selectedRecord.rabbit_tag }} - {{ selectedRecord.name }}</span>
                </div>
                <div class="detail-item">
                  <label>Date</label>
                  <span>{{ formatDetailDate(selectedRecord.record_date) }}</span>
                </div>
                <div class="detail-item">
                  <label>Record Type</label>
                  <span class="type-badge" :class="selectedRecord.record_type">
                    {{ capitalizeFirst(selectedRecord.record_type) }}
                  </span>
                </div>
                <div class="detail-item">
                  <label>Status</label>
                  <span class="status-badge" :class="selectedRecord.status">
                    {{ formatStatus(selectedRecord.status) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Condition Details -->
            <div v-if="selectedRecord.condition || selectedRecord.severity || selectedRecord.affected_area || selectedRecord.symptoms" class="detail-section">
              <h3>Condition Details</h3>
              <div class="detail-grid">
                <div v-if="selectedRecord.condition" class="detail-item">
                  <label>Condition/Diagnosis</label>
                  <span>{{ selectedRecord.condition }}</span>
                </div>
                <div v-if="selectedRecord.severity" class="detail-item">
                  <label>Severity</label>
                  <span class="severity-badge" :class="selectedRecord.severity">
                    {{ capitalizeFirst(selectedRecord.severity) }}
                  </span>
                </div>
                <div v-if="selectedRecord.affected_area" class="detail-item">
                  <label>Affected Area</label>
                  <span>{{ capitalizeFirst(selectedRecord.affected_area) }}</span>
                </div>
                <div v-if="selectedRecord.symptoms" class="detail-item full-width">
                  <label>Symptoms</label>
                  <span class="symptoms-text">{{ selectedRecord.symptoms }}</span>
                </div>
              </div>
            </div>

            <!-- Treatment Information -->
            <div v-if="selectedRecord.treatment_type || selectedRecord.medication || selectedRecord.dosage || selectedRecord.frequency" class="detail-section">
              <h3>Treatment Information</h3>
              <div class="detail-grid">
                <div v-if="selectedRecord.treatment_type" class="detail-item">
                  <label>Treatment Type</label>
                  <span>{{ capitalizeFirst(selectedRecord.treatment_type) }}</span>
                </div>
                <div v-if="selectedRecord.medication" class="detail-item">
                  <label>Medication/Treatment</label>
                  <span>{{ selectedRecord.medication }}</span>
                </div>
                <div v-if="selectedRecord.dosage" class="detail-item">
                  <label>Dosage</label>
                  <span>{{ selectedRecord.dosage }}</span>
                </div>
                <div v-if="selectedRecord.frequency" class="detail-item">
                  <label>Frequency</label>
                  <span>{{ formatFrequency(selectedRecord.frequency) }}</span>
                </div>
                <div v-if="selectedRecord.treatment_start_date" class="detail-item">
                  <label>Treatment Start</label>
                  <span>{{ formatDetailDate(selectedRecord.treatment_start_date) }}</span>
                </div>
                <div v-if="selectedRecord.treatment_duration" class="detail-item">
                  <label>Duration</label>
                  <span>{{ selectedRecord.treatment_duration }} days</span>
                </div>
                <div v-if="selectedRecord.treatment_end_date" class="detail-item">
                  <label>Treatment End</label>
                  <span>{{ formatDetailDate(selectedRecord.treatment_end_date) }}</span>
                </div>
                <div v-if="selectedRecord.treatment_active" class="detail-item">
                  <label>Status</label>
                  <span class="active-indicator">
                    <i class="pi pi-circle-fill"></i>
                    Active Treatment
                  </span>
                </div>
              </div>
            </div>

            <!-- Additional Information -->
            <div v-if="selectedRecord.veterinarian || selectedRecord.cost || selectedRecord.notes" class="detail-section">
              <h3>Additional Information</h3>
              <div class="detail-grid">
                <div v-if="selectedRecord.veterinarian" class="detail-item">
                  <label>Veterinarian</label>
                  <span>{{ selectedRecord.veterinarian }}</span>
                </div>
                <div v-if="selectedRecord.cost" class="detail-item">
                  <label>Cost</label>
                  <span class="cost-value">${{ selectedRecord.cost.toFixed(2) }}</span>
                </div>
                <div v-if="selectedRecord.notes" class="detail-item full-width">
                  <label>Notes</label>
                  <span class="notes-text">{{ selectedRecord.notes }}</span>
                </div>
              </div>
            </div>

            <!-- Follow-up Information -->
            <div v-if="selectedRecord.follow_up_required || selectedRecord.follow_up_date" class="detail-section">
              <h3>Follow-up Information</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Follow-up Required</label>
                  <span>{{ selectedRecord.follow_up_required ? 'Yes' : 'No' }}</span>
                </div>
                <div v-if="selectedRecord.follow_up_date" class="detail-item">
                  <label>Follow-up Date</label>
                  <span>{{ formatDetailDate(selectedRecord.follow_up_date) }}</span>
                </div>
                <div v-if="selectedRecord.follow_up_completed !== undefined" class="detail-item">
                  <label>Follow-up Status</label>
                  <span :class="selectedRecord.follow_up_completed ? 'follow-up-completed' : 'follow-up-pending'">
                    <i :class="selectedRecord.follow_up_completed ? 'pi pi-check' : 'pi pi-clock'"></i>
                    {{ selectedRecord.follow_up_completed ? 'Completed' : 'Pending' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Record Metadata -->
            <div class="detail-section">
              <h3>Record Information</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Created</label>
                  <span>{{ formatDetailDate(selectedRecord.created_at) }}</span>
                </div>
                <div v-if="selectedRecord.updated_at !== selectedRecord.created_at" class="detail-item">
                  <label>Last Updated</label>
                  <span>{{ formatDetailDate(selectedRecord.updated_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="secondary-button" @click="closeModal">Close</button>
          <button class="secondary-button" @click="editFromModal">
            <i class="pi pi-pencil"></i>
            Edit Record
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="recordToDelete" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content small" @click.stop>
        <div class="modal-header">
          <h2>Delete Health Record</h2>
          <button class="modal-close-btn" @click="cancelDelete">
            <i class="pi pi-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="delete-confirmation">
            <div class="warning-icon">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="delete-message">
              <p><strong>Are you sure you want to delete this health record?</strong></p>
              <p class="delete-details">
                <strong>Rabbit:</strong> {{ recordToDelete.rabbit_tag }} - {{ recordToDelete.name }}<br>
                <strong>Date:</strong> {{ formatDetailDate(recordToDelete.record_date) }}<br>
                <strong>Condition:</strong> {{ recordToDelete.condition || 'N/A' }}
              </p>
              <p class="delete-warning">This action cannot be undone.</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="secondary-button" @click="cancelDelete">Cancel</button>
          <button class="danger-button" @click="confirmDelete" :disabled="isDeleting">
            <i v-if="isDeleting" class="pi pi-spinner pi-spin"></i>
            <i v-else class="pi pi-trash"></i>
            {{ isDeleting ? 'Deleting...' : 'Delete Record' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Export Dialog -->
    <ExportDialog 
      :show="showExportDialog"
      default-format="csv"
      @confirm="handleExportConfirm"
      @close="handleExportClose"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { exportService } from '@/services/exportService'

export default {
  name: 'HealthRecordsList',
  setup() {
    const router = useRouter()
    const isLoading = ref(false)
    const error = ref('')
    const showFilters = ref(false)
    
    // Data
    const healthRecords = ref([])
    const rabbits = ref([])
    const currentPage = ref(1)
    const itemsPerPage = 20
    
    // Modal states
    const selectedRecord = ref(null)
    const recordToDelete = ref(null)
    const isDeleting = ref(false)
    
    // Filters
    const filters = reactive({
      rabbitId: '',
      recordType: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    })
    
    // Computed properties
    const filteredRecords = computed(() => {
      let filtered = healthRecords.value
      
      if (filters.rabbitId) {
        filtered = filtered.filter(record => record.rabbit_id === filters.rabbitId)
      }
      
      if (filters.recordType) {
        filtered = filtered.filter(record => record.record_type === filters.recordType)
      }
      
      if (filters.status) {
        filtered = filtered.filter(record => record.status === filters.status)
      }
      
      if (filters.dateFrom) {
        filtered = filtered.filter(record => record.record_date >= filters.dateFrom)
      }
      
      if (filters.dateTo) {
        filtered = filtered.filter(record => record.record_date <= filters.dateTo)
      }
      
      return filtered
    })
    
    const totalRecords = computed(() => healthRecords.value.length)
    const totalPages = computed(() => Math.ceil(filteredRecords.value.length / itemsPerPage))
    const hasFilters = computed(() => 
      filters.rabbitId || filters.recordType || filters.status || filters.dateFrom || filters.dateTo
    )
    
    const paginatedRecords = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredRecords.value.slice(start, end)
    })
    
    // Methods
    const goBack = () => {
      router.push('/health-data')
    }
    
    const addHealthRecord = () => {
      router.push('/health-data/add')
    }
    
    const fetchHealthRecords = async () => {
      try {
        isLoading.value = true
        error.value = ''
        
        const { data, error: fetchError } = await supabase
          .from('health_records_with_rabbit')
          .select('*')
          .order('record_date', { ascending: false })
        
        if (fetchError) throw fetchError
        
        healthRecords.value = data || []
        console.log('Fetched health records:', data?.length || 0)
        
      } catch (err) {
        console.error('Error fetching health records:', err)
        error.value = 'Failed to load health records'
      } finally {
        isLoading.value = false
      }
    }
    
    const fetchRabbits = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.error('User not authenticated:', userError)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('rabbits')
          .select('id, rabbit_id, name')
          .eq('created_by', user.id)
          .eq('is_deleted', false)
          .order('rabbit_id')
        
        if (fetchError) throw fetchError
        
        rabbits.value = data || []
      } catch (err) {
        console.error('Error fetching rabbits:', err)
      }
    }
    
    const applyFilters = () => {
      currentPage.value = 1 // Reset to first page when filtering
    }
    
    const clearFilters = () => {
      filters.rabbitId = ''
      filters.recordType = ''
      filters.status = ''
      filters.dateFrom = ''
      filters.dateTo = ''
      currentPage.value = 1
    }
    
    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
      }
    }
    
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
    
    const getTimeAgo = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
      
      if (diffInDays === 0) return 'Today'
      if (diffInDays === 1) return '1 day ago'
      if (diffInDays < 30) return `${diffInDays} days ago`
      if (diffInDays < 60) return '1 month ago'
      return `${Math.floor(diffInDays / 30)} months ago`
    }
    
    const capitalizeFirst = (str) => {
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
    }
    
    const formatStatus = (status) => {
      const statusMap = {
        healthy: 'Healthy',
        under_treatment: 'Under Treatment',
        under_observation: 'Under Observation',
        recovered: 'Recovered',
        chronic: 'Chronic'
      }
      return statusMap[status] || capitalizeFirst(status)
    }
    
    const formatDetailDate = (dateString) => {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const formatFrequency = (frequency) => {
      const frequencyMap = {
        once_daily: 'Once Daily',
        twice_daily: 'Twice Daily',
        three_times_daily: 'Three Times Daily',
        every_other_day: 'Every Other Day',
        weekly: 'Weekly',
        as_needed: 'As Needed',
        single_dose: 'Single Dose'
      }
      return frequencyMap[frequency] || capitalizeFirst(frequency)
    }
    
    const viewRecord = (record) => {
      selectedRecord.value = record
    }
    
    const editRecord = (record) => {
      router.push({ 
        name: 'EditHealthRecord', 
        params: { id: record.id },
        query: { returnTo: 'list' }
      })
    }
    
    const deleteRecord = (record) => {
      recordToDelete.value = record
    }
    
    const closeModal = () => {
      selectedRecord.value = null
    }
    
    const editFromModal = () => {
      if (selectedRecord.value) {
        editRecord(selectedRecord.value)
      }
    }
    
    const cancelDelete = () => {
      recordToDelete.value = null
    }
    
    const confirmDelete = async () => {
      if (!recordToDelete.value) return
      
      try {
        isDeleting.value = true
        
        const { error: deleteError } = await supabase
          .from('health_records')
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString() 
          })
          .eq('id', recordToDelete.value.id)
        
        if (deleteError) throw deleteError
        
        // Remove from local array
        healthRecords.value = healthRecords.value.filter(
          record => record.id !== recordToDelete.value.id
        )
        
        recordToDelete.value = null
        
        // Show success message (you could add a toast notification here)
        console.log('Health record deleted successfully')
        
      } catch (err) {
        console.error('Error deleting health record:', err)
        error.value = 'Failed to delete health record'
      } finally {
        isDeleting.value = false
      }
    }
    
    const showExportDialog = ref(false)

    const exportRecords = async () => {
      if (healthRecords.value.length === 0) {
        alert('No records to export')
        return
      }
      showExportDialog.value = true
    }

    const handleExportConfirm = async (format) => {
      try {
        await exportService.exportHealthRecords(healthRecords.value, format)
        showExportDialog.value = false
        
        // Show success message
        console.log(`Health records exported successfully as ${format.toUpperCase()}`)
      } catch (error) {
        console.error('Failed to export health records:', error)
        alert('Failed to export records. Please try again.')
      }
    }

    const handleExportClose = () => {
      showExportDialog.value = false
    }
    
    onMounted(() => {
      fetchHealthRecords()
      fetchRabbits()
    })
    
    return {
      isLoading,
      error,
      showFilters,
      healthRecords,
      rabbits,
      filters,
      filteredRecords,
      totalRecords,
      totalPages,
      currentPage,
      paginatedRecords,
      hasFilters,
      selectedRecord,
      recordToDelete,
      isDeleting,
      goBack,
      addHealthRecord,
      fetchHealthRecords,
      applyFilters,
      clearFilters,
      goToPage,
      formatDate,
      getTimeAgo,
      capitalizeFirst,
      formatStatus,
      formatDetailDate,
      formatFrequency,
      viewRecord,
      editRecord,
      deleteRecord,
      closeModal,
      editFromModal,
      cancelDelete,
      confirmDelete,
      exportRecords,
      showExportDialog,
      handleExportConfirm,
      handleExportClose
    }
  }
}
</script>

<style scoped>
.health-records-list-page {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
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

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.primary-button, .secondary-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.primary-button {
  background: #3b82f6;
  color: white;
  border: none;
}

.primary-button:hover {
  background: #2563eb;
}

.secondary-button {
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.secondary-button:hover {
  background: #f8fafc;
}

.filters-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.filter-select, .filter-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.filter-select:focus, .filter-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  height: fit-content;
}

.clear-filters-btn:hover {
  background: #f1f5f9;
}

.records-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
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

.empty-state h3 {
  margin: 0.5rem 0;
  color: #1e293b;
}

.empty-state p {
  margin: 0.5rem 0 1.5rem 0;
  max-width: 400px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.records-count {
  color: #64748b;
  font-size: 0.875rem;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

.table-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.table-action-btn:hover {
  background: #f1f5f9;
}

.records-table {
  display: flex;
  flex-direction: column;
}

.table-header-row, .table-row {
  display: grid;
  grid-template-columns: 120px 150px 100px 180px 120px 150px 120px 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.table-header-row {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.table-row:hover {
  background: #f8fafc;
}

.table-cell {
  display: flex;
  align-items: center;
}

.table-cell.header {
  font-weight: 600;
  color: #374151;
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-primary {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.875rem;
}

.date-secondary {
  font-size: 0.75rem;
  color: #64748b;
}

.rabbit-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rabbit-tag {
  font-weight: 600;
  color: #1e293b;
}

.rabbit-breed {
  font-size: 0.75rem;
  color: #64748b;
}

.type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.type-badge.checkup {
  background: #f0f9ff;
  color: #0369a1;
}

.type-badge.illness {
  background: #fef2f2;
  color: #dc2626;
}

.type-badge.treatment {
  background: #fef3c7;
  color: #d97706;
}

.type-badge.vaccination {
  background: #f0fdf4;
  color: #16a34a;
}

.type-badge.injury {
  background: #fff1f2;
  color: #e11d48;
}

.type-badge.observation {
  background: #f3f4f6;
  color: #374151;
}

.condition-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.condition-text {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.875rem;
}

.severity-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 8px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-badge.mild {
  background: #f0fdf4;
  color: #16a34a;
}

.severity-badge.moderate {
  background: #fef3c7;
  color: #d97706;
}

.severity-badge.severe {
  background: #fef2f2;
  color: #dc2626;
}

.severity-badge.critical {
  background: #f3f4f6;
  color: #1f2937;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.healthy {
  background: #f0fdf4;
  color: #16a34a;
}

.status-badge.under_treatment {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.under_observation {
  background: #f0f9ff;
  color: #0369a1;
}

.status-badge.recovered {
  background: #f0fdf4;
  color: #16a34a;
}

.status-badge.chronic {
  background: #f3f4f6;
  color: #374151;
}

.treatment-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.treatment-text {
  font-size: 0.875rem;
  color: #1e293b;
}

.active-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.625rem;
  color: #16a34a;
  font-weight: 500;
}

.follow-up-cell {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.follow-up-required {
  color: #d97706;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.follow-up-completed {
  color: #16a34a;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.no-data {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.view {
  background: #f0f9ff;
  color: #0369a1;
}

.action-btn.view:hover {
  background: #e0f2fe;
}

.action-btn.edit {
  background: #fef3c7;
  color: #d97706;
}

.action-btn.edit:hover {
  background: #fef2dd;
}

.action-btn.delete {
  background: #fef2f2;
  color: #dc2626;
}

.action-btn.delete:hover {
  background: #fee5e5;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #475569;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #64748b;
  font-size: 0.875rem;
}

.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-content.small {
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.5rem;
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

/* Record Details Styles */
.record-details {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-section {
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1.5rem;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-section h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.125rem;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.875rem;
}

.detail-item span {
  color: #1e293b;
  font-weight: 500;
}

.symptoms-text, .notes-text {
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  white-space: pre-wrap;
  font-weight: 400 !important;
}

.cost-value {
  color: #16a34a;
  font-weight: 600;
}

.follow-up-pending {
  color: #d97706;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.follow-up-completed {
  color: #16a34a;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Delete Confirmation Styles */
.delete-confirmation {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.warning-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.delete-message {
  flex: 1;
}

.delete-message p {
  margin: 0 0 1rem 0;
}

.delete-details {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 0.875rem;
}

.delete-warning {
  color: #dc2626;
  font-weight: 500;
  font-size: 0.875rem;
}

.danger-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.danger-button:hover:not(:disabled) {
  background: #b91c1c;
}

.danger-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    align-self: flex-start;
  }
  
  .filters-content {
    flex-direction: column;
  }
  
  .filter-group {
    min-width: auto;
  }
  
  .table-header-row, .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1rem;
  }
  
  .table-cell {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .table-cell:last-child {
    border-bottom: none;
  }
}

/* Mobile fixes for small screens */
@media (max-width: 480px) {
  .health-records-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    width: 100%;
  }

  /* Filters */
  .filters-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-group {
    width: 100%;
  }

  /* Results summary */
  .results-summary {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }

  /* Table improvements */
  .health-table {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .table-header-row,
  .table-row {
    min-width: 600px; /* Maintain structure when scrolling */
  }

  /* Modal full screen */
  .modal-overlay {
    padding: 0;
  }

  .modal-content {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-footer {
    padding: 1rem;
    flex-direction: column-reverse;
  }

  .modal-footer button {
    width: 100%;
  }

  /* Detail grid single column */
  .detail-grid {
    grid-template-columns: 1fr !important;
  }

  /* Pagination */
  .pagination-info {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .pagination-controls {
    justify-content: center;
  }
}

/* Ultra-narrow screens */
@media (max-width: 360px) {
  .health-records-page {
    padding: 0.5rem;
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .table-row {
    padding: 0.75rem;
  }

  .table-cell {
    font-size: 0.875rem;
  }
}
</style>
