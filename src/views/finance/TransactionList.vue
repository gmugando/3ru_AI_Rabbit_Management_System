<template>
  <div class="transaction-list-page">
    <div class="page-header">
      <div>
        <h1>All Transactions</h1>
        <p class="subtitle">View and manage your financial transactions</p>
      </div>
      <div class="header-actions">
        <router-link to="/finance/add-transaction" class="primary-button">
          <i class="pi pi-plus"></i>
          Add Transaction
        </router-link>
        <router-link to="/finance" class="secondary-button">
          <i class="pi pi-arrow-left"></i>
          Back to Finance
        </router-link>
      </div>
    </div>

    <div class="filters-section">
      <div class="filter-group">
        <label for="dateRange">Date Range</label>
        <select id="dateRange" v-model="filters.dateRange" class="form-control">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="transactionType">Transaction Type</label>
        <select id="transactionType" v-model="filters.type" class="form-control">
          <option value="all">All Types</option>
          <option value="revenue">Revenue</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="category">Category</label>
        <select id="category" v-model="filters.category" class="form-control">
          <option value="all">All Categories</option>
          <option v-if="filters.type !== 'expense'" value="rabbit_sale">Rabbit Sale</option>
          <option v-if="filters.type !== 'expense'" value="market_sales">Market Sales</option>
          <option v-if="filters.type !== 'expense'" value="other_revenue">Other Revenue</option>
          <option v-if="filters.type !== 'revenue'" value="feed_supplies">Feed & Supplies</option>
          <option v-if="filters.type !== 'revenue'" value="equipment">Equipment</option>
          <option v-if="filters.type !== 'revenue'" value="veterinary">Veterinary</option>
          <option v-if="filters.type !== 'revenue'" value="other_expense">Other Expense</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="search">Search</label>
        <div class="search-input">
          <i class="pi pi-search"></i>
          <input 
            type="text" 
            id="search" 
            v-model="filters.search" 
            class="form-control" 
            placeholder="Search by description or reference"
          >
        </div>
      </div>
    </div>

    <div class="transactions-table-container">
      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Loading transactions...</span>
      </div>

      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-else-if="filteredTransactions.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <h3>No transactions found</h3>
        <p>Try adjusting your filters or add a new transaction</p>
        <router-link to="/finance/add-transaction" class="primary-button">
          <i class="pi pi-plus"></i>
          Add Transaction
        </router-link>
      </div>

      <div v-else class="transactions-table">
        <table>
          <thead>
            <tr>
              <th @click="sortBy('date')" :class="{ active: sortField === 'date' }">
                Date
                <i :class="['pi', sortField === 'date' ? (sortOrder === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort']"></i>
              </th>
              <th @click="sortBy('type')" :class="{ active: sortField === 'type' }">
                Type
                <i :class="['pi', sortField === 'type' ? (sortOrder === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort']"></i>
              </th>
              <th @click="sortBy('description')" :class="{ active: sortField === 'description' }">
                Description
                <i :class="['pi', sortField === 'description' ? (sortOrder === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort']"></i>
              </th>
              <th @click="sortBy('category')" :class="{ active: sortField === 'category' }">
                Category
                <i :class="['pi', sortField === 'category' ? (sortOrder === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort']"></i>
              </th>
              <th @click="sortBy('amount')" :class="{ active: sortField === 'amount' }">
                Amount
                <i :class="['pi', sortField === 'amount' ? (sortOrder === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort']"></i>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in paginatedTransactions" :key="transaction.id">
              <td>{{ formatDate(transaction.date) }}</td>
              <td>
                <span :class="['transaction-type', transaction.type]">
                  {{ transaction.type === 'revenue' ? 'Revenue' : 'Expense' }}
                </span>
              </td>
              <td>{{ transaction.description }}</td>
              <td>{{ formatCategory(transaction.category) }}</td>
              <td :class="['amount', transaction.type]">
                {{ transaction.type === 'revenue' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
              </td>
              <td class="actions">
                <button class="action-btn view" @click="viewTransaction(transaction)">
                  <i class="pi pi-eye"></i>
                </button>
                <button class="action-btn edit" @click="editTransaction(transaction)">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="action-btn delete" @click="confirmDelete(transaction)">
                  <i class="pi pi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredTransactions.length > 0" class="pagination">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="pi pi-chevron-left"></i>
        </button>
        <span class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Confirm Delete</h3>
          <button class="close-btn" @click="showDeleteModal = false">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this transaction?</p>
          <p class="transaction-details">
            <strong>Date:</strong> {{ formatDate(transactionToDelete?.date) }}<br>
            <strong>Description:</strong> {{ transactionToDelete?.description }}<br>
            <strong>Amount:</strong> {{ transactionToDelete?.type === 'revenue' ? '+' : '-' }}{{ formatCurrency(transactionToDelete?.amount) }}
          </p>
        </div>
        <div class="modal-footer">
          <button class="secondary-button" @click="showDeleteModal = false">Cancel</button>
          <button class="danger-button" @click="deleteTransaction" :disabled="isDeleting">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import currencyService from '@/services/currency'

export default {
  name: 'TransactionList',
  setup() {
    const router = useRouter()
    const transactions = ref([])
    const isLoading = ref(true)
    const errorMessage = ref('')
    const showDeleteModal = ref(false)
    const transactionToDelete = ref(null)
    const isDeleting = ref(false)
    const currentPage = ref(1)
    const itemsPerPage = 10
    const sortField = ref('date')
    const sortOrder = ref('desc')

    const filters = reactive({
      dateRange: 'all',
      type: 'all',
      category: 'all',
      search: ''
    })

    // Fetch transactions from Supabase
    const fetchTransactions = async () => {
      try {
        isLoading.value = true
        errorMessage.value = ''

        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })

        if (error) throw error

        transactions.value = data || []
      } catch (error) {
        console.error('Error fetching transactions:', error)
        errorMessage.value = 'Failed to load transactions. Please try again later.'
      } finally {
        isLoading.value = false
      }
    }

    // Filter transactions based on current filters
    const filteredTransactions = computed(() => {
      let result = [...transactions.value]

      // Apply date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        let weekAgo, monthAgo, quarterAgo, yearAgo
        
        switch (filters.dateRange) {
          case 'today':
            result = result.filter(t => new Date(t.date) >= today)
            break
          case 'week':
            weekAgo = new Date(today)
            weekAgo.setDate(today.getDate() - 7)
            result = result.filter(t => new Date(t.date) >= weekAgo)
            break
          case 'month':
            monthAgo = new Date(today)
            monthAgo.setMonth(today.getMonth() - 1)
            result = result.filter(t => new Date(t.date) >= monthAgo)
            break
          case 'quarter':
            quarterAgo = new Date(today)
            quarterAgo.setMonth(today.getMonth() - 3)
            result = result.filter(t => new Date(t.date) >= quarterAgo)
            break
          case 'year':
            yearAgo = new Date(today)
            yearAgo.setFullYear(today.getFullYear() - 1)
            result = result.filter(t => new Date(t.date) >= yearAgo)
            break
        }
      }

      // Apply type filter
      if (filters.type !== 'all') {
        result = result.filter(t => t.type === filters.type)
      }

      // Apply category filter
      if (filters.category !== 'all') {
        result = result.filter(t => t.category === filters.category)
      }

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        result = result.filter(t => 
          t.description.toLowerCase().includes(searchTerm) || 
          (t.reference && t.reference.toLowerCase().includes(searchTerm))
        )
      }

      // Apply sorting
      result.sort((a, b) => {
        let aValue = a[sortField.value]
        let bValue = b[sortField.value]

        // Handle date sorting
        if (sortField.value === 'date') {
          aValue = new Date(aValue)
          bValue = new Date(bValue)
        }

        // Handle amount sorting
        if (sortField.value === 'amount') {
          aValue = parseFloat(aValue)
          bValue = parseFloat(bValue)
        }

        if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1
        return 0
      })

      return result
    })

    // Pagination
    const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage))
    
    const paginatedTransactions = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredTransactions.value.slice(start, end)
    })

    // Reset pagination when filters change
    watch([filters, sortField, sortOrder], () => {
      currentPage.value = 1
    })

    // Sorting function
    const sortBy = (field) => {
      if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortField.value = field
        sortOrder.value = 'asc'
      }
    }

    // Format functions
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    }

    const formatAmount = (amount) => {
      return parseFloat(amount).toFixed(2)
    }

    const formatCurrency = (amount) => {
      return currencyService.format(amount)
    }

    const formatCategory = (category) => {
      if (!category) return ''
      
      const categoryMap = {
        'rabbit_sale': 'Rabbit Sale',
        'market_sales': 'Market Sales',
        'other_revenue': 'Other Revenue',
        'feed_supplies': 'Feed & Supplies',
        'equipment': 'Equipment',
        'veterinary': 'Veterinary',
        'other_expense': 'Other Expense'
      }
      
      return categoryMap[category] || category
    }

    // Transaction actions
    const viewTransaction = (transaction) => {
      // Implement view transaction details
      console.log('View transaction:', transaction)
    }

    const editTransaction = (transaction) => {
      // Navigate to edit page
      router.push(`/finance/transactions/${transaction.id}/edit`)
    }

    const confirmDelete = (transaction) => {
      transactionToDelete.value = transaction
      showDeleteModal.value = true
    }

    const deleteTransaction = async () => {
      if (!transactionToDelete.value) return
      
      try {
        isDeleting.value = true
        
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transactionToDelete.value.id)
        
        if (error) throw error
        
        // Remove from local state
        transactions.value = transactions.value.filter(
          t => t.id !== transactionToDelete.value.id
        )
        
        showDeleteModal.value = false
        transactionToDelete.value = null
      } catch (error) {
        console.error('Error deleting transaction:', error)
        errorMessage.value = 'Failed to delete transaction. Please try again.'
      } finally {
        isDeleting.value = false
      }
    }

    // Fetch transactions on component mount
    onMounted(async () => {
      await currencyService.initialize()
      fetchTransactions()
    })

    return {
      transactions,
      filteredTransactions,
      paginatedTransactions,
      isLoading,
      errorMessage,
      filters,
      currentPage,
      totalPages,
      sortField,
      sortOrder,
      showDeleteModal,
      transactionToDelete,
      isDeleting,
      sortBy,
      formatDate,
      formatAmount,
      formatCurrency,
      formatCategory,
      viewTransaction,
      editTransaction,
      confirmDelete,
      deleteTransaction
    }
  }
}
</script>

<style scoped>
.transaction-list-page {
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
  text-decoration: none;
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
  text-decoration: none;
}

.secondary-button:hover {
  background: #f8fafc;
}

.filters-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  color: #64748b;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1e293b;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
}

.search-input {
  position: relative;
}

.search-input i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.search-input .form-control {
  padding-left: 2.5rem;
}

.transactions-table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
  min-height: 400px;
  position: relative;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
}

.error-message {
  background: #fef2f2;
  color: #ef4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.transactions-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 1rem;
  font-size: 0.875rem;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

th.active {
  color: #3b82f6;
}

th i {
  margin-left: 0.5rem;
  font-size: 0.75rem;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.875rem;
  color: #1e293b;
}

tr:last-child td {
  border-bottom: none;
}

.transaction-type {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.transaction-type.revenue {
  background: #f0fdf4;
  color: #10b981;
}

.transaction-type.expense {
  background: #fef2f2;
  color: #ef4444;
}

.amount {
  font-weight: 600;
}

.amount.revenue {
  color: #10b981;
}

.amount.expense {
  color: #ef4444;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.view {
  background: #f1f5f9;
  color: #64748b;
}

.action-btn.edit {
  background: #eff6ff;
  color: #3b82f6;
}

.action-btn.delete {
  background: #fef2f2;
  color: #ef4444;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  color: #64748b;
}

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
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 1.25rem;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0 0 1rem 0;
  color: #1e293b;
}

.transaction-details {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.danger-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.danger-button:hover {
  background: #dc2626;
}

.danger-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
  }

  .primary-button, .secondary-button {
    width: 100%;
    justify-content: center;
  }

  .filters-section {
    grid-template-columns: 1fr;
  }

  .transactions-table {
    overflow-x: auto;
  }

  table {
    min-width: 800px;
  }
}
</style> 