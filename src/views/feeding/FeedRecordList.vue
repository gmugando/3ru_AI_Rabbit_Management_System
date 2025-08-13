<template>
  <div class="feed-records-page">
    <div class="page-header">
      <div>
        <h1>Feed Records</h1>
        <p class="subtitle">Track feed consumption and stock updates</p>
      </div>
      <div class="header-actions">
        <router-link to="/feeding" class="secondary-button">
          <i class="pi pi-arrow-left"></i>
          Back to Feeding
        </router-link>
        <router-link to="/feeding/add-record" class="primary-button">
          <i class="pi pi-plus"></i>
          Add Record
        </router-link>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon consumption">
          <i class="pi pi-chart-line"></i>
        </div>
        <div class="card-content">
          <h3>{{ summary.totalConsumption }} kg</h3>
          <p>Total Consumption</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon stock">
          <i class="pi pi-box"></i>
        </div>
        <div class="card-content">
          <h3>{{ summary.totalStock }} kg</h3>
          <p>Total Stock Added</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon current">
          <i class="pi pi-warehouse"></i>
        </div>
        <div class="card-content">
          <h3>{{ summary.currentStock }} kg</h3>
          <p>Current Stock</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon records">
          <i class="pi pi-list"></i>
        </div>
        <div class="card-content">
          <h3>{{ filteredRecords.length }}</h3>
          <p>Total Records</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label>Feed Type</label>
          <select v-model="filters.feedType" class="filter-control">
            <option value="">All Feed Types</option>
            <option value="adult_rabbit_feed">Adult Rabbit Feed</option>
            <option value="growing_rabbit_feed">Growing Rabbit Feed</option>
            <option value="breeding_rabbit_feed">Breeding Rabbit Feed</option>
            <option value="hay">Hay</option>
            <option value="supplements">Supplements</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Record Type</label>
          <select v-model="filters.recordType" class="filter-control">
            <option value="">All Types</option>
            <option value="consumption">Consumption</option>
            <option value="stock_update">Stock Update</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Date From</label>
          <input type="date" v-model="filters.dateFrom" class="filter-control">
        </div>

        <div class="filter-group">
          <label>Date To</label>
          <input type="date" v-model="filters.dateTo" class="filter-control">
        </div>

        <div class="filter-group">
          <label>Search</label>
          <input 
            type="text" 
            v-model="filters.search" 
            placeholder="Search brand, notes..."
            class="filter-control"
          >
        </div>

        <div class="filter-actions">
          <button @click="clearFilters" class="clear-filters-btn">
            <i class="pi pi-filter-slash"></i>
            Clear
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spinner pi-spin"></i>
      <span>Loading feed records...</span>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && records.length === 0" class="empty-state">
      <i class="pi pi-inbox"></i>
      <h3>No Feed Records Found</h3>
      <p>Start tracking your feed consumption and stock updates</p>
      <router-link to="/feeding/add-record" class="empty-action-btn">
        Add Your First Record
      </router-link>
    </div>

    <!-- Records Table -->
    <div v-if="!loading && !error && filteredRecords.length > 0" class="records-section">
      <div class="table-header">
        <h2>Feed Records ({{ filteredRecords.length }})</h2>
        <div class="table-actions">
          <button @click="exportRecords" class="export-btn">
            <i class="pi pi-download"></i>
            Export
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="records-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Feed Type</th>
              <th>Brand</th>
              <th>Amount</th>
              <th>Sections</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in paginatedRecords" :key="record.id">
              <td>{{ formatDate(record.date) }}</td>
              <td>
                <span class="record-type-badge" :class="record.record_type">
                  <i class="pi" :class="{
                    'pi-chart-line': record.record_type === 'consumption',
                    'pi-box': record.record_type === 'stock_update'
                  }"></i>
                  {{ formatRecordType(record.record_type) }}
                </span>
              </td>
              <td>{{ formatFeedType(record.feed_type) }}</td>
              <td>{{ record.feed_brand }}</td>
              <td class="amount-cell">
                <span class="amount" :class="record.record_type">
                  {{ record.record_type === 'consumption' ? '-' : '+' }}{{ record.amount }} kg
                </span>
              </td>
              <td>{{ record.sections || '-' }}</td>
              <td class="notes-cell">
                <span class="notes" :title="record.notes">
                  {{ truncateText(record.notes, 30) }}
                </span>
              </td>
              <td class="actions-cell">
                <button @click="editRecord(record)" class="action-btn edit">
                  <i class="pi pi-pencil"></i>
                </button>
                <button @click="deleteRecord(record)" class="action-btn delete">
                  <i class="pi pi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button 
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          <i class="pi pi-chevron-left"></i>
        </button>
        
        <span class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        
        <button 
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Delete Feed Record</h3>
          <button @click="cancelDelete" class="close-button">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this feed record?</p>
          <div class="record-details">
            <strong>{{ formatDate(recordToDelete?.date) }}</strong> - 
            {{ formatRecordType(recordToDelete?.record_type) }} - 
            {{ recordToDelete?.amount }} kg {{ formatFeedType(recordToDelete?.feed_type) }}
          </div>
        </div>
        <div class="modal-actions">
          <button @click="cancelDelete" class="cancel-btn">Cancel</button>
          <button @click="confirmDelete" class="delete-btn" :disabled="isDeleting">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'FeedRecordList',
  setup() {
    const router = useRouter()
    
    const loading = ref(true)
    const error = ref(null)
    const records = ref([])
    const currentPage = ref(1)
    const itemsPerPage = ref(20)
    const showDeleteModal = ref(false)
    const recordToDelete = ref(null)
    const isDeleting = ref(false)

    const filters = reactive({
      feedType: '',
      recordType: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    })

    const summary = reactive({
      totalConsumption: 0,
      totalStock: 0,
      currentStock: 0
    })

    // Computed properties
    const filteredRecords = computed(() => {
      let filtered = records.value

      if (filters.feedType) {
        filtered = filtered.filter(r => r.feed_type === filters.feedType)
      }

      if (filters.recordType) {
        filtered = filtered.filter(r => r.record_type === filters.recordType)
      }

      if (filters.dateFrom) {
        filtered = filtered.filter(r => r.date >= filters.dateFrom)
      }

      if (filters.dateTo) {
        filtered = filtered.filter(r => r.date <= filters.dateTo)
      }

      if (filters.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter(r => 
          r.feed_brand.toLowerCase().includes(search) ||
          (r.notes && r.notes.toLowerCase().includes(search)) ||
          (r.sections && r.sections.toLowerCase().includes(search))
        )
      }

      return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    const paginatedRecords = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredRecords.value.slice(start, end)
    })

    const totalPages = computed(() => {
      return Math.ceil(filteredRecords.value.length / itemsPerPage.value)
    })

    // Methods
    const loadRecords = async () => {
      try {
        loading.value = true
        error.value = null

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { data, error: fetchError } = await supabase
          .from('feed_records')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('date', { ascending: false })

        if (fetchError) throw fetchError

        records.value = data || []
        calculateSummary()

      } catch (err) {
        error.value = err.message
        console.error('Error loading feed records:', err)
      } finally {
        loading.value = false
      }
    }

    const calculateSummary = () => {
      let consumption = 0
      let stock = 0

      records.value.forEach(record => {
        if (record.record_type === 'consumption') {
          consumption += parseFloat(record.amount || 0)
        } else if (record.record_type === 'stock_update') {
          stock += parseFloat(record.amount || 0)
        }
      })

      summary.totalConsumption = Math.round(consumption * 100) / 100
      summary.totalStock = Math.round(stock * 100) / 100
      summary.currentStock = Math.round((stock - consumption) * 100) / 100
    }

    const editRecord = (record) => {
      router.push(`/feeding/record/${record.id}/edit`)
    }

    const deleteRecord = (record) => {
      recordToDelete.value = record
      showDeleteModal.value = true
    }

    const confirmDelete = async () => {
      try {
        isDeleting.value = true

        const { error: deleteError } = await supabase
          .from('feed_records')
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString() 
          })
          .eq('id', recordToDelete.value.id)

        if (deleteError) throw deleteError

        await loadRecords()
        cancelDelete()

      } catch (err) {
        error.value = err.message
        console.error('Error deleting record:', err)
      } finally {
        isDeleting.value = false
      }
    }

    const cancelDelete = () => {
      showDeleteModal.value = false
      recordToDelete.value = null
      isDeleting.value = false
    }

    const clearFilters = () => {
      filters.feedType = ''
      filters.recordType = ''
      filters.dateFrom = ''
      filters.dateTo = ''
      filters.search = ''
      currentPage.value = 1
    }

    const exportRecords = () => {
      const csvContent = [
        ['Date', 'Type', 'Feed Type', 'Brand', 'Amount (kg)', 'Sections', 'Notes'],
        ...filteredRecords.value.map(record => [
          record.date,
          formatRecordType(record.record_type),
          formatFeedType(record.feed_type),
          record.feed_brand,
          record.amount,
          record.sections || '',
          record.notes || ''
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `feed-records-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }

    // Formatting functions
    const formatDate = (date) => {
      if (!date) return 'Unknown'
      return new Date(date).toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

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

    const formatRecordType = (recordType) => {
      return recordType === 'consumption' ? 'Consumption' : 'Stock Update'
    }

    const truncateText = (text, maxLength) => {
      if (!text) return '-'
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }

    onMounted(loadRecords)

    return {
      loading,
      error,
      records,
      filteredRecords,
      paginatedRecords,
      currentPage,
      totalPages,
      filters,
      summary,
      showDeleteModal,
      recordToDelete,
      isDeleting,
      loadRecords,
      editRecord,
      deleteRecord,
      confirmDelete,
      cancelDelete,
      clearFilters,
      exportRecords,
      formatDate,
      formatFeedType,
      formatRecordType,
      truncateText
    }
  }
}
</script>

<style scoped>
.feed-records-page {
  padding: 1.5rem;
  min-height: 100vh;
  background-color: #f8fafc;
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

.primary-button, .secondary-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
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

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.card-icon.consumption {
  background: #ef4444;
}

.card-icon.stock {
  background: #10b981;
}

.card-icon.current {
  background: #3b82f6;
}

.card-icon.records {
  background: #8b5cf6;
}

.card-content h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
}

.card-content p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.875rem;
}

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-control {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.filter-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-actions {
  display: flex;
  align-items: end;
}

.clear-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.875rem;
}

.clear-filters-btn:hover {
  background: #e5e7eb;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-state i, .error-state i, .empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #9ca3af;
}

.error-state {
  color: #dc2626;
}

.error-state i {
  color: #fbbf24;
}

.empty-action-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.3s ease;
}

.empty-action-btn:hover {
  background: #2563eb;
}

.records-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.table-header h2 {
  margin: 0;
  color: #1e293b;
}

.table-actions {
  display: flex;
  gap: 1rem;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  font-size: 0.875rem;
}

.export-btn:hover {
  background: #f1f5f9;
}

.table-container {
  overflow-x: auto;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
}

.records-table th,
.records-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.records-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.records-table tbody tr:hover {
  background: #f8fafc;
}

.record-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.record-type-badge.consumption {
  background: #fef2f2;
  color: #dc2626;
}

.record-type-badge.stock_update {
  background: #f0fdf4;
  color: #16a34a;
}

.amount-cell .amount {
  font-weight: 600;
}

.amount-cell .amount.consumption {
  color: #dc2626;
}

.amount-cell .amount.stock_update {
  color: #16a34a;
}

.notes-cell {
  max-width: 200px;
}

.notes {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-cell {
  width: 100px;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  font-size: 0.875rem;
}

.action-btn.edit {
  background: #f0f9ff;
  color: #0369a1;
}

.action-btn.edit:hover {
  background: #e0f2fe;
}

.action-btn.delete {
  background: #fef2f2;
  color: #dc2626;
}

.action-btn.delete:hover {
  background: #fecaca;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.pagination-btn {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
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
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  color: #1e293b;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 1.25rem;
}

.modal-body {
  margin-bottom: 2rem;
}

.record-details {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #4b5563;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn, .delete-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #6b7280;
}

.delete-btn {
  background: #dc2626;
  border: none;
  color: white;
}

.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .feed-records-page {
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

  .summary-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .filters-row {
    grid-template-columns: 1fr;
  }

  .table-container {
    font-size: 0.875rem;
  }

  .records-table th,
  .records-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>
