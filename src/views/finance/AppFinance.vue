<template>
  <div class="finance-page">
    <div class="page-header">
      <div>
        <h1>Financial Management</h1>
        <p class="subtitle">Track revenue, expenses, and financial performance</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button">
          <i class="pi pi-calendar"></i>
          Date Range
        </button>
        <router-link to="/finance/add-transaction" class="primary-button">
          <i class="pi pi-plus"></i>
          Add Transaction
        </router-link>
      </div>
    </div>

    <!-- Financial Overview -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon revenue">
          <i class="pi pi-dollar"></i>
        </div>
        <div class="stat-content">
          <h3>Total Revenue</h3>
          <p class="stat-value">{{ formatCurrency(financialStats.totalRevenue) }}</p>
          <p :class="['stat-change', financialStats.revenueChange >= 0 ? 'positive' : 'negative']">
            {{ formatPercentage(financialStats.revenueChange) }} from last month
          </p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon expenses">
          <i class="pi pi-wallet"></i>
        </div>
        <div class="stat-content">
          <h3>Total Expenses</h3>
          <p class="stat-value">{{ formatCurrency(financialStats.totalExpenses) }}</p>
          <p :class="['stat-change', financialStats.expensesChange <= 0 ? 'positive' : 'negative']">
            {{ formatPercentage(financialStats.expensesChange) }} from last month
          </p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon profit">
          <i class="pi pi-chart-line"></i>
        </div>
        <div class="stat-content">
          <h3>Net Profit</h3>
          <p class="stat-value">{{ formatCurrency(financialStats.netProfit) }}</p>
          <p :class="['stat-change', financialStats.profitChange >= 0 ? 'positive' : 'negative']">
            {{ formatPercentage(financialStats.profitChange) }} from last month
          </p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pending">
          <i class="pi pi-clock"></i>
        </div>
        <div class="stat-content">
          <h3>Pending Payments</h3>
          <p class="stat-value">{{ formatCurrency(financialStats.pendingPayments) }}</p>
          <p class="stat-change">{{ financialStats.pendingCount }} invoices pending</p>
        </div>
      </div>
    </div>

    <div class="finance-grid">
      <!-- Charts Section -->
      <div class="content-card">
        <div class="card-header">
          <h2>Financial Overview</h2>
          <div class="header-filters">
            <select class="form-control">
              <option>Last 6 Months</option>
              <option>Last Year</option>
              <option>Year to Date</option>
            </select>
          </div>
        </div>
        <div class="chart-container">
          <canvas ref="financeChart"></canvas>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="content-card">
        <div class="card-header">
          <h2>Recent Transactions</h2>
          <router-link to="/finance/transactions" class="card-action-btn">
            View All
          </router-link>
        </div>
        <div v-if="isLoading" class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading transactions...</span>
        </div>
        <div v-else-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <div v-else-if="recentTransactions.length === 0" class="empty-state">
          <i class="pi pi-inbox"></i>
          <h3>No transactions found</h3>
          <p>Add your first transaction to get started</p>
          <router-link to="/finance/add-transaction" class="primary-button">
            <i class="pi pi-plus"></i>
            Add Transaction
          </router-link>
        </div>
        <div v-else class="transactions-list">
          <div v-for="transaction in recentTransactions" :key="transaction.id" class="transaction-item">
            <div :class="['transaction-icon', transaction.type]">
              <i :class="transaction.type === 'revenue' ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>
            </div>
            <div class="transaction-details">
              <div class="transaction-info">
                <h4>{{ transaction.description }}</h4>
                <p>{{ transaction.category }}</p>
              </div>
              <div :class="['transaction-amount', transaction.type]">
                {{ transaction.type === 'revenue' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expense Categories -->
      <div class="content-card">
        <div class="card-header">
          <h2>Expense Breakdown</h2>
          <div class="header-filters">
            <select class="form-control">
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last Quarter</option>
            </select>
          </div>
        </div>
        <div class="expense-categories">
          <div class="category-item">
            <div class="category-info">
              <h4>Feed & Supplies</h4>
              <div class="progress-bar">
                <div class="progress" style="width: 45%"></div>
              </div>
            </div>
            <div class="category-amount">
              <span class="amount">$1,926</span>
              <span class="percentage">45%</span>
            </div>
          </div>

          <div class="category-item">
            <div class="category-info">
              <h4>Equipment</h4>
              <div class="progress-bar">
                <div class="progress" style="width: 25%"></div>
              </div>
            </div>
            <div class="category-amount">
              <span class="amount">$1,070</span>
              <span class="percentage">25%</span>
            </div>
          </div>

          <div class="category-item">
            <div class="category-info">
              <h4>Veterinary</h4>
              <div class="progress-bar">
                <div class="progress" style="width: 20%"></div>
              </div>
            </div>
            <div class="category-amount">
              <span class="amount">$856</span>
              <span class="percentage">20%</span>
            </div>
          </div>

          <div class="category-item">
            <div class="category-info">
              <h4>Other</h4>
              <div class="progress-bar">
                <div class="progress" style="width: 10%"></div>
              </div>
            </div>
            <div class="category-amount">
              <span class="amount">$428</span>
              <span class="percentage">10%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue'
import Chart from 'chart.js/auto'
import { supabase } from '@/supabase'

export default {
  name: 'AppFinance',
  setup() {
    const financeChart = ref(null)
    const recentTransactions = ref([])
    const isLoading = ref(true)
    const errorMessage = ref('')
    const financialStats = reactive({
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      pendingPayments: 0,
      pendingCount: 0,
      revenueChange: 0,
      expensesChange: 0,
      profitChange: 0
    })

    const financeData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue',
          data: [8500, 9200, 10500, 11200, 12000, 12450],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Expenses',
          data: [3200, 3600, 3900, 4100, 4000, 4280],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            drawBorder: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }

    // Fetch recent transactions from the database
    const fetchRecentTransactions = async () => {
      try {
        isLoading.value = true
        errorMessage.value = ''

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('You must be logged in to view transactions')
        }

        // Fetch the 5 most recent transactions
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(5)

        if (error) throw error

        recentTransactions.value = data || []
        
        // Calculate financial statistics
        calculateFinancialStats()
        
      } catch (error) {
        console.error('Error fetching transactions:', error)
        errorMessage.value = error.message
      } finally {
        isLoading.value = false
      }
    }

    // Calculate financial statistics based on transactions
    const calculateFinancialStats = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        // Get current date info
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        // First day of current month
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
        // First day of previous month
        const firstDayOfPrevMonth = new Date(currentYear, currentMonth - 1, 1)
        
        // Fetch all transactions for the current month
        const { data: currentMonthData, error: currentMonthError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', firstDayOfMonth.toISOString().split('T')[0])
          .lte('date', now.toISOString().split('T')[0])
        
        if (currentMonthError) throw currentMonthError
        
        // Fetch all transactions for the previous month
        const { data: prevMonthData, error: prevMonthError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', firstDayOfPrevMonth.toISOString().split('T')[0])
          .lt('date', firstDayOfMonth.toISOString().split('T')[0])
        
        if (prevMonthError) throw prevMonthError
        
        // Calculate current month totals
        let currentMonthRevenue = 0
        let currentMonthExpenses = 0
        
        currentMonthData?.forEach(transaction => {
          if (transaction.type === 'revenue') {
            currentMonthRevenue += parseFloat(transaction.amount)
          } else {
            currentMonthExpenses += parseFloat(transaction.amount)
          }
        })
        
        // Calculate previous month totals
        let prevMonthRevenue = 0
        let prevMonthExpenses = 0
        
        prevMonthData?.forEach(transaction => {
          if (transaction.type === 'revenue') {
            prevMonthRevenue += parseFloat(transaction.amount)
          } else {
            prevMonthExpenses += parseFloat(transaction.amount)
          }
        })
        
        // Calculate changes
        const revenueChange = prevMonthRevenue > 0 
          ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
          : 0
        
        const expensesChange = prevMonthExpenses > 0 
          ? ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 
          : 0
        
        const currentMonthProfit = currentMonthRevenue - currentMonthExpenses
        const prevMonthProfit = prevMonthRevenue - prevMonthExpenses
        
        const profitChange = prevMonthProfit > 0 
          ? ((currentMonthProfit - prevMonthProfit) / prevMonthProfit) * 100 
          : 0
        
        // Update reactive stats
        financialStats.totalRevenue = currentMonthRevenue
        financialStats.totalExpenses = currentMonthExpenses
        financialStats.netProfit = currentMonthProfit
        financialStats.revenueChange = revenueChange
        financialStats.expensesChange = expensesChange
        financialStats.profitChange = profitChange
        
        // For now, we'll set pending payments to 0 as we don't have that data yet
        financialStats.pendingPayments = 0
        financialStats.pendingCount = 0
        
      } catch (error) {
        console.error('Error calculating financial stats:', error)
      }
    }

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    }

    // Format percentage
    const formatPercentage = (value) => {
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
    }

    onMounted(() => {
      // Initialize chart
      if (financeChart.value) {
        new Chart(financeChart.value, {
          type: 'line',
          data: financeData,
          options: chartOptions
        })
      }
      
      // Fetch transactions
      fetchRecentTransactions()
    })

    return {
      financeChart,
      recentTransactions,
      isLoading,
      errorMessage,
      financialStats,
      formatCurrency,
      formatPercentage
    }
  }
}
</script>

<style scoped>
.finance-page {
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
}

.secondary-button:hover {
  background: #f8fafc;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1rem;
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

.stat-icon.revenue {
  background: #f0fdf4;
  color: #10b981;
}

.stat-icon.expenses {
  background: #fef2f2;
  color: #ef4444;
}

.stat-icon.profit {
  background: #eff6ff;
  color: #3b82f6;
}

.stat-icon.pending {
  background: #fef3c7;
  color: #f59e0b;
}

.stat-content h3 {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.stat-value {
  margin: 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.stat-change {
  margin: 0;
  font-size: 0.875rem;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.finance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
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

.form-control {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1e293b;
}

.chart-container {
  height: 300px;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.transaction-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.transaction-icon.revenue {
  background: #f0fdf4;
  color: #10b981;
}

.transaction-icon.expenses {
  background: #fef2f2;
  color: #ef4444;
}

.transaction-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-info h4 {
  margin: 0;
  color: #1e293b;
}

.transaction-info p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.transaction-amount {
  font-weight: 600;
}

.transaction-amount.positive {
  color: #10b981;
}

.transaction-amount.negative {
  color: #ef4444;
}

.card-action-btn {
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-action-btn:hover {
  background: #f1f5f9;
}

.expense-categories {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.category-info {
  flex: 1;
}

.category-info h4 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #3b82f6;
  border-radius: 4px;
}

.category-amount {
  text-align: right;
}

.category-amount .amount {
  display: block;
  font-weight: 600;
  color: #1e293b;
}

.category-amount .percentage {
  font-size: 0.875rem;
  color: #64748b;
}

@media (max-width: 768px) {
  .transaction-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .transaction-amount {
    align-self: flex-start;
  }

  .category-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .category-info {
    width: 100%;
  }

  .category-amount {
    width: 100%;
    text-align: left;
    margin-top: 0.5rem;
  }
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
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
</style> 