<template>
  <div class="weight-records-list-page">
    <div class="page-header">
      <div class="header-content">
        <button class="back-button" @click="goBack">
          <i class="pi pi-arrow-left"></i>
          Back to Weight Tracking
        </button>
        <div class="header-title">
          <h1>All Weight Records</h1>
          <p class="subtitle">Complete history of rabbit weight measurements</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="showFilters = !showFilters">
          <i class="pi pi-filter"></i>
          {{ showFilters ? 'Hide Filters' : 'Show Filters' }}
        </button>
        <button class="primary-button" @click="addWeightRecord">
          <i class="pi pi-plus"></i>
          Add Weight Record
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
          <label for="date-from">Date From</label>
          <input id="date-from" type="date" v-model="filters.dateFrom" @change="applyFilters" class="filter-input">
        </div>
        
        <div class="filter-group">
          <label for="date-to">Date To</label>
          <input id="date-to" type="date" v-model="filters.dateTo" @change="applyFilters" class="filter-input">
        </div>
        
        <div class="filter-group">
          <label for="measurement-type">Type</label>
          <select id="measurement-type" v-model="filters.measurementType" @change="applyFilters" class="filter-select">
            <option value="">All Types</option>
            <option value="routine">Routine</option>
            <option value="health">Health</option>
            <option value="breeding">Breeding</option>
            <option value="growth">Growth</option>
          </select>
        </div>
        
        <button @click="clearFilters" class="clear-filters-btn">
          <i class="pi pi-times"></i>
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Records Table -->
    <div class="records-container">
      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spinner pi-spin"></i>
        <span>Loading weight records...</span>
      </div>
      
      <div v-else-if="error" class="error-state">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ error }}</span>
        <button @click="fetchWeightRecords" class="retry-btn">
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
            <div class="table-cell header">Weight</div>
            <div class="table-cell header">Change</div>
            <div class="table-cell header">BCS</div>
            <div class="table-cell header">Type</div>
            <div class="table-cell header">Notes</div>
            <div class="table-cell header">Actions</div>
          </div>
          
          <div v-for="record in paginatedRecords" :key="record.id" class="table-row">
            <div class="table-cell">
              <div class="date-cell">
                <span class="date-primary">{{ formatDate(record.measurement_date) }}</span>
                <span class="date-secondary">{{ formatTime(record.time_of_day) }}</span>
              </div>
            </div>
            <div class="table-cell">
              <div class="rabbit-cell">
                <span class="rabbit-tag">{{ record.rabbit_tag }}</span>
                <span class="rabbit-breed">{{ record.breed }}</span>
              </div>
            </div>
            <div class="table-cell">
              <span class="weight-value">{{ record.weight }} kg</span>
            </div>
            <div class="table-cell">
              <span v-if="record.weight_change > 0" class="change positive">
                +{{ Math.abs(record.weight_change).toFixed(1) }} kg
              </span>
              <span v-else-if="record.weight_change < 0" class="change negative">
                -{{ Math.abs(record.weight_change).toFixed(1) }} kg
              </span>
              <span v-else class="change neutral">-</span>
            </div>
            <div class="table-cell">
              <span v-if="record.body_condition_score" class="bcs-badge">
                {{ record.body_condition_score }}
              </span>
              <span v-else class="no-data">-</span>
            </div>
            <div class="table-cell">
              <span class="type-badge" :class="record.measurement_type">
                {{ capitalizeFirst(record.measurement_type) }}
              </span>
            </div>
            <div class="table-cell">
              <span v-if="record.notes" class="notes-preview" :title="record.notes">
                {{ truncateText(record.notes, 30) }}
              </span>
              <span v-else class="no-data">-</span>
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
        <i class="pi pi-inbox"></i>
        <h3>No Weight Records Found</h3>
        <p>{{ filters.rabbitId || filters.dateFrom || filters.dateTo || filters.measurementType ? 'No records match your filters.' : 'No weight records have been created yet.' }}</p>
        <button v-if="!filters.rabbitId && !filters.dateFrom && !filters.dateTo && !filters.measurementType" class="primary-button" @click="addWeightRecord">
          <i class="pi pi-plus"></i>
          Add First Weight Record
        </button>
        <button v-else @click="clearFilters" class="secondary-button">
          <i class="pi pi-times"></i>
          Clear Filters
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'WeightRecordsList',
  setup() {
    const router = useRouter()
    const isLoading = ref(false)
    const error = ref('')
    const showFilters = ref(false)
    
    // Data
    const weightRecords = ref([])
    const rabbits = ref([])
    const currentPage = ref(1)
    const itemsPerPage = 20
    
    // Filters
    const filters = reactive({
      rabbitId: '',
      dateFrom: '',
      dateTo: '',
      measurementType: ''
    })
    
    // Computed properties
    const filteredRecords = computed(() => {
      let filtered = weightRecords.value
      
      if (filters.rabbitId) {
        filtered = filtered.filter(record => record.rabbit_id === filters.rabbitId)
      }
      
      if (filters.dateFrom) {
        filtered = filtered.filter(record => record.measurement_date >= filters.dateFrom)
      }
      
      if (filters.dateTo) {
        filtered = filtered.filter(record => record.measurement_date <= filters.dateTo)
      }
      
      if (filters.measurementType) {
        filtered = filtered.filter(record => record.measurement_type === filters.measurementType)
      }
      
      return filtered
    })
    
    const totalRecords = computed(() => weightRecords.value.length)
    const totalPages = computed(() => Math.ceil(filteredRecords.value.length / itemsPerPage))
    
    const paginatedRecords = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredRecords.value.slice(start, end)
    })
    
    // Methods
    const goBack = () => {
      router.push('/weight-tracking')
    }
    
    const addWeightRecord = () => {
      router.push('/weight-tracking/add')
    }
    
    const fetchWeightRecords = async () => {
      try {
        isLoading.value = true
        error.value = ''
        
        const { data, error: fetchError } = await supabase
          .from('weight_records_with_rabbit')
          .select('*')
          .order('measurement_date', { ascending: false })
        
        if (fetchError) throw fetchError
        
        weightRecords.value = data || []
        console.log('Fetched all weight records:', data?.length || 0)
        
      } catch (err) {
        console.error('Error fetching weight records:', err)
        error.value = 'Failed to load weight records'
      } finally {
        isLoading.value = false
      }
    }
    
    const fetchRabbits = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('rabbits')
          .select('id, rabbit_id, name')
          .eq('status', 'active')
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
      filters.dateFrom = ''
      filters.dateTo = ''
      filters.measurementType = ''
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
    
    const formatTime = (timeString) => {
      if (!timeString) return ''
      return timeString.substring(0, 5) // HH:MM format
    }
    
    const capitalizeFirst = (str) => {
      return str.charAt(0).toUpperCase() + str.slice(1)
    }
    
    const truncateText = (text, maxLength) => {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }
    
    const viewRecord = (record) => {
      // TODO: Implement view record modal
      console.log('View record:', record)
    }
    
    const editRecord = (record) => {
      // TODO: Navigate to edit form
      console.log('Edit record:', record)
    }
    
    const deleteRecord = (record) => {
      // TODO: Implement delete confirmation
      console.log('Delete record:', record)
    }
    
    const exportRecords = () => {
      // TODO: Implement export functionality
      console.log('Export records')
    }
    
    onMounted(() => {
      fetchWeightRecords()
      fetchRabbits()
    })
    
    return {
      isLoading,
      error,
      showFilters,
      weightRecords,
      rabbits,
      filters,
      filteredRecords,
      totalRecords,
      totalPages,
      currentPage,
      paginatedRecords,
      goBack,
      addWeightRecord,
      fetchWeightRecords,
      applyFilters,
      clearFilters,
      goToPage,
      formatDate,
      formatTime,
      capitalizeFirst,
      truncateText,
      viewRecord,
      editRecord,
      deleteRecord,
      exportRecords
    }
  }
}
</script>

<style scoped>
.weight-records-list-page {
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
  grid-template-columns: 120px 150px 100px 100px 60px 100px 1fr 120px;
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

.weight-value {
  font-weight: 600;
  color: #1e293b;
}

.change.positive {
  color: #10b981;
  font-weight: 500;
}

.change.negative {
  color: #ef4444;
  font-weight: 500;
}

.change.neutral {
  color: #64748b;
}

.bcs-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
}

.type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.type-badge.routine {
  background: #f0f9ff;
  color: #0369a1;
}

.type-badge.health {
  background: #fef3c7;
  color: #d97706;
}

.type-badge.breeding {
  background: #fce7f3;
  color: #be185d;
}

.type-badge.growth {
  background: #f0fdf4;
  color: #16a34a;
}

.notes-preview {
  font-size: 0.875rem;
  color: #64748b;
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
  
  .table-cell.header::before {
    content: attr(data-label);
    font-weight: 600;
    color: #374151;
    display: block;
    margin-bottom: 0.25rem;
  }
}
</style>
