<template>
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p class="subtitle">Welcome back, {{ userName }}!</p>
      </div>
      <div class="header-actions">
        <button class="refresh-button" @click="fetchDashboardData" :disabled="loading">
          <i class="pi" :class="loading ? 'pi-spin pi-spinner' : 'pi-refresh'"></i>
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-icon">
          <i class="mdi mdi-rabbit"></i>
        </div>
        <div class="stat-content">
          <h3>Total Rabbits</h3>
          <p class="stat-value">{{ loading ? '...' : dashboardStats.totalRabbits }}</p>
          <div class="stat-footer">
            <span class="stat-change positive">
              <i class="pi pi-arrow-up"></i>
              {{ dashboardStats.activeRabbits }}
            </span>
            <span class="stat-period">active</span>
          </div>
        </div>
      </div>

      <div class="stat-card success">
        <div class="stat-icon">
          <i class="mdi mdi-rabbit-variant"></i>
        </div>
        <div class="stat-content">
          <h3>Breeding Pairs</h3>
          <p class="stat-value">{{ loading ? '...' : dashboardStats.breedingPairs }}</p>
          <div class="stat-footer">
            <span class="stat-change positive">
              <i class="pi pi-arrow-up"></i>
              Active
            </span>
            <span class="stat-period">pairs</span>
          </div>
        </div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon">
          <i class="pi pi-calendar"></i>
        </div>
        <div class="stat-content">
          <h3>Expected Births</h3>
          <p class="stat-value">{{ loading ? '...' : dashboardStats.expectedBirths }}</p>
          <div class="stat-footer">
            <span class="stat-period">This month</span>
          </div>
        </div>
      </div>

      <div class="stat-card info">
        <div class="stat-icon">
          <i class="pi pi-dollar"></i>
        </div>
        <div class="stat-content">
          <h3>Monthly Revenue</h3>
          <p class="stat-value">{{ loading ? '...' : formatCurrency(dashboardStats.monthlyRevenue) }}</p>
          <div class="stat-footer">
            <span class="stat-change positive">
              <i class="pi pi-arrow-up"></i>
              {{ formatCurrency(dashboardStats.monthlyExpenses) }}
            </span>
            <span class="stat-period">expenses</span>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <!-- Population Chart -->
      <div class="content-card">
        <div class="card-header">
          <h2>Population Growth</h2>
        </div>
        <div class="chart-container">
          <canvas ref="populationChart"></canvas>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div class="content-card">
        <div class="card-header">
          <h2>Weekly Revenue</h2>
        </div>
        <div class="chart-container">
          <canvas ref="revenueChart"></canvas>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-card">
        <div class="card-header">
          <h2>Recent Activities</h2>
          <button class="card-action-btn">View All</button>
        </div>
        <div class="activity-list">
          <div v-if="loading" class="activity-item">
            <div class="activity-icon info">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <div class="activity-content">
              <p>Loading activities...</p>
            </div>
          </div>
          <div v-else-if="recentActivities.length === 0" class="activity-item">
            <div class="activity-icon info">
              <i class="pi pi-info-circle"></i>
            </div>
            <div class="activity-content">
              <p>No recent activities</p>
            </div>
          </div>
          <div v-else v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-icon" :class="activity.type === 'breeding' ? 'primary' : 'success'">
              <i :class="activity.type === 'breeding' ? 'pi pi-heart-fill' : 'pi pi-check-circle'"></i>
            </div>
            <div class="activity-content">
              <p>{{ activity.message }}</p>
              <span class="activity-time">{{ formatTimeAgo(activity.time) }}</span>
            </div>
          </div>
        </div>
      </div>

      <UpcomingEventsWidget :limit="6" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import Chart from 'chart.js/auto'
import dashboardService from '@/services/dashboard'
import currencyService from '@/services/currency'
import UpcomingEventsWidget from '@/components/UpcomingEventsWidget.vue'

export default {
  name: 'AppDashboard',
  components: {
    UpcomingEventsWidget
  },
  setup() {
    const store = useStore()
    const userName = ref('User')
    
    const fetchUserProfile = async () => {
      try {
        const storeUser = store.state.user
        console.log('Dashboard user data from store:', storeUser)
        
        if (storeUser?.name) {
          userName.value = storeUser.name
          return
        }
        
        // Fetch from Supabase auth user metadata
        const { data: { user } } = await dashboardService.supabase.auth.getUser()
        console.log('User data from auth:', user)
        
        if (user) {
          // If stored separately
          if (user.user_metadata.first_name && user.user_metadata.last_name) {
            userName.value = `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
          }
          // If stored as full_name
          else if (user.user_metadata.full_name) {
            userName.value = user.user_metadata.full_name
          }
          // fallback to email
          else {
            userName.value = user.email
          }
          console.log('Set userName to:', userName.value)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }
    
    const populationChart = ref(null)
    const revenueChart = ref(null)
    let populationChartInstance = null
    let revenueChartInstance = null
    
    // Dashboard stats
    const dashboardStats = ref({
      totalRabbits: 0,
      breedingPairs: 0,
      expectedBirths: 0,
      monthlyRevenue: 0,
      activeRabbits: 0,
      monthlyExpenses: 0
    })
    
    const recentActivities = ref([])
    const upcomingTasks = ref([])
    const loading = ref(true)

    const populationData = ref({
      labels: [],
      datasets: [{
        label: 'Rabbit Population',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    })

    const revenueData = ref({
      labels: [],
      datasets: [{
        label: 'Revenue',
        data: [],
        backgroundColor: '#10b981',
        borderRadius: 6
      }]
    })

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
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

    const fetchPopulationTrends = async () => {
      try {
        // Fetch population trends from dashboard service
        const trends = await dashboardService.getPopulationTrends()
        console.log('Population trends received:', trends)
        
        if (trends && trends.length > 0) {
          populationData.value.labels = trends.map(t => {
            const date = new Date(t.month)
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          })
          populationData.value.datasets[0].data = trends.map(t => t.population)
          
          // Update chart if it exists
          if (populationChartInstance) {
            populationChartInstance.data = populationData.value
            populationChartInstance.update()
          }
        }
      } catch (error) {
        console.error('Error fetching population trends:', error)
        // Fallback to current month data if available
        if (dashboardStats.value.totalRabbits > 0) {
          const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          populationData.value.labels = [currentMonth]
          populationData.value.datasets[0].data = [dashboardStats.value.totalRabbits]
          
          if (populationChartInstance) {
            populationChartInstance.data = populationData.value
            populationChartInstance.update()
          }
        }
      }
    }

    const fetchRevenueTrends = async () => {
      try {
        // Fetch weekly revenue trends from dashboard service
        const trends = await dashboardService.getWeeklyRevenueTrends()
        console.log('Revenue trends received:', trends)
        
        if (trends && trends.length > 0) {
          revenueData.value.labels = trends.map(t => t.week)
          revenueData.value.datasets[0].data = trends.map(t => t.revenue)
          
          // Update chart if it exists
          if (revenueChartInstance) {
            revenueChartInstance.data = revenueData.value
            revenueChartInstance.update()
          }
        }
      } catch (error) {
        console.error('Error fetching revenue trends:', error)
        // Fallback to current week data if available
        if (dashboardStats.value.monthlyRevenue > 0) {
          const currentWeek = `Week ${Math.ceil(new Date().getDate() / 7)}`
          const weeklyEstimate = dashboardStats.value.monthlyRevenue / 4 // Rough weekly estimate
          revenueData.value.labels = [currentWeek]
          revenueData.value.datasets[0].data = [weeklyEstimate]
          
          if (revenueChartInstance) {
            revenueChartInstance.data = revenueData.value
            revenueChartInstance.update()
          }
        }
      }
    }

    const fetchDashboardData = async () => {
      try {
        loading.value = true
        console.log('Starting to fetch dashboard data...')
        
        // Fetch dashboard stats
        const stats = await dashboardService.getDashboardStats()
        console.log('Dashboard stats received:', stats)
        dashboardStats.value = stats
        
        // Fetch recent activities
        const activities = await dashboardService.getRecentActivities()
        console.log('Recent activities received:', activities)
        recentActivities.value = activities
        
        // Fetch upcoming tasks
        const tasks = await dashboardService.getUpcomingTasks()
        console.log('Upcoming tasks received:', tasks)
        upcomingTasks.value = tasks
        
        // Fetch population trends
        await fetchPopulationTrends()
        
        // Fetch revenue trends
        await fetchRevenueTrends()
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        loading.value = false
        console.log('Dashboard data fetch completed')
      }
    }

    const formatCurrency = (amount) => {
      return currencyService.format(amount)
    }

    const formatTimeAgo = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
      
      if (diffInHours < 1) return 'Just now'
      if (diffInHours < 24) return `${diffInHours} hours ago`
      
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) return `${diffInDays} days ago`
      
      const diffInWeeks = Math.floor(diffInDays / 7)
      return `${diffInWeeks} weeks ago`
    }

    const formatDueDate = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffInDays = Math.floor((date - now) / (1000 * 60 * 60 * 24))
      
      if (diffInDays < 0) return 'Overdue'
      if (diffInDays === 0) return 'Due today'
      if (diffInDays === 1) return 'Due tomorrow'
      if (diffInDays < 7) return `Due in ${diffInDays} days`
      
      const diffInWeeks = Math.floor(diffInDays / 7)
      return `Due in ${diffInWeeks} weeks`
    }

    onMounted(async () => {
      // Initialize currency service
      await currencyService.initialize()
      
      // Fetch user profile first
      await fetchUserProfile()
      
      // Fetch dashboard data
      await fetchDashboardData()
      
      // Create Population Chart
      if (populationChart.value) {
        populationChartInstance = new Chart(populationChart.value, {
          type: 'line',
          data: populationData.value,
          options: chartOptions
        })
      }

      // Create Revenue Chart
      if (revenueChart.value) {
        revenueChartInstance = new Chart(revenueChart.value, {
          type: 'bar',
          data: revenueData.value,
          options: chartOptions
        })
      }
    })

    return {
      userName,
      populationChart,
      revenueChart,
      dashboardStats,
      recentActivities,
      upcomingTasks,
      loading,
      formatCurrency,
      formatTimeAgo,
      formatDueDate,
      fetchDashboardData
    }
  }
}
</script>

<style scoped>
.dashboard {
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

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-button:hover {
  background: #f8fafc;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.activity-icon.info { background: #f0f9ff; color: #0ea5e9; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Mobile override - immediately after definition */
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr !important;
    min-width: 0 !important;
  }
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1rem;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.primary .stat-icon { background: #eff6ff; color: #3b82f6; }
.stat-card.success .stat-icon { background: #f0fdf4; color: #10b981; }
.stat-card.warning .stat-icon { background: #fef3c7; color: #f59e0b; }
.stat-card.info .stat-icon { background: #f0f9ff; color: #0ea5e9; }

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.stat-value {
  margin: 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: #1e293b;
}

.stat-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-change.positive {
  color: #10b981;
}

.stat-period {
  color: #64748b;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Mobile override - immediately after definition */
@media (max-width: 480px) {
  .dashboard-grid {
    grid-template-columns: 1fr !important;
    min-width: 0 !important;
  }
}

.dashboard-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.chart-card {
  min-height: 400px;
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
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.card-action-btn:hover {
  background: #f1f5f9;
}

.chart-container {
  height: 300px;
}

.activity-list, .task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.activity-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.activity-icon.success { background: #f0fdf4; color: #10b981; }
.activity-icon.primary { background: #eff6ff; color: #3b82f6; }
.activity-icon.warning { background: #fef3c7; color: #f59e0b; }

.activity-content {
  flex: 1;
}

.activity-content p {
  margin: 0;
  color: #1e293b;
  font-weight: 500;
}

.activity-time {
  font-size: 0.875rem;
  color: #64748b;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.task-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.task-checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.task-checkbox input {
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.task-checkbox input:checked ~ .checkmark {
  background: #3b82f6;
  border-color: #3b82f6;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.task-checkbox input:checked ~ .checkmark:after {
  display: block;
}

.task-content {
  flex: 1;
}

.task-content p {
  margin: 0;
  color: #1e293b;
  font-weight: 500;
}

.task-due {
  font-size: 0.875rem;
  color: #64748b;
}

.task-due.warning {
  color: #f59e0b;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Mobile override - immediately after definition */
@media (max-width: 480px) {
  .charts-grid {
    grid-template-columns: 1fr !important;
    min-width: 0 !important;
  }
}

.content-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  margin-bottom: 1.5rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

/* Tablet only - not for small phones */
@media (min-width: 481px) and (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* Mobile fixes for small screens - NUCLEAR OPTION */
@media screen and (max-width: 480px) {
  /* Diagnostic indicator */
  .dashboard::before {
    content: "📱 Mobile Mode";
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

  /* Lock down page */
  .dashboard,
  div.dashboard {
    padding: 1rem !important;
    max-width: 100vw !important;
    width: 100vw !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }

  /* Prevent ANY child from expanding */
  .dashboard *,
  .dashboard * > * {
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  /* STATS GRID - Nuclear lock */
  .dashboard .stats-grid,
  div.stats-grid,
  .stats-grid,
  [class*="stats-grid"] {
    display: grid !important;
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
    grid-auto-columns: 1fr !important;
    grid-auto-flow: row !important;
    gap: 1rem !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .stats-grid > .stat-card,
  .stats-grid > * {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    grid-column: 1 / -1 !important;
  }

  /* DASHBOARD GRID - Nuclear lock */
  .dashboard .dashboard-grid,
  div.dashboard-grid,
  .dashboard-grid,
  [class*="dashboard-grid"] {
    display: grid !important;
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
    grid-auto-columns: 1fr !important;
    grid-auto-flow: row !important;
    gap: 1rem !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .dashboard-grid > *,
  .dashboard-grid > .dashboard-card {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    grid-column: 1 / -1 !important;
  }

  /* CHARTS GRID - Nuclear lock */
  .dashboard .charts-grid,
  div.charts-grid,
  .charts-grid,
  [class*="charts-grid"] {
    display: grid !important;
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
    grid-auto-columns: 1fr !important;
    grid-auto-flow: row !important;
    gap: 1rem !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .charts-grid > *,
  .charts-grid > .content-card {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    grid-column: 1 / -1 !important;
  }

  /* Page header */
  .page-header {
    flex-direction: column !important;
    gap: 1rem;
  }

  /* Stat cards compact */
  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  /* Dashboard cards */
  .dashboard-card,
  .content-card {
    padding: 1rem;
    max-width: 100% !important;
    overflow-x: hidden !important;
  }

  /* Chart containers */
  .chart-card {
    min-height: 250px;
  }

  /* Quick actions */
  .quick-actions {
    grid-template-columns: 1fr !important;
  }

  /* Tasks list */
  .tasks-list {
    max-width: 100% !important;
  }

  .task-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

/* Ultra-narrow screens */
@media (max-width: 360px) {
  .dashboard {
    padding: 0.5rem !important;
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .stat-card {
    padding: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .dashboard-card {
    padding: 0.75rem;
  }
}
</style> 