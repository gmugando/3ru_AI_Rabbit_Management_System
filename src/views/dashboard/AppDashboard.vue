<template>
  <div class="dashboard">
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p class="subtitle">Welcome back, {{ userName }}!</p>
      </div>
      <div class="header-actions">
        <button class="refresh-button">
          <i class="pi pi-refresh"></i>
          Refresh
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
          <p class="stat-value">156</p>
          <div class="stat-footer">
            <span class="stat-change positive">
              <i class="pi pi-arrow-up"></i>
              12%
            </span>
            <span class="stat-period">vs last month</span>
          </div>
        </div>
      </div>

      <div class="stat-card success">
        <div class="stat-icon">
          <i class="mdi mdi-rabbit-variant"></i>
        </div>
        <div class="stat-content">
          <h3>Breeding Pairs</h3>
          <p class="stat-value">24</p>
          <div class="stat-footer">
            <span class="stat-change positive">
              <i class="pi pi-arrow-up"></i>
              8%
            </span>
            <span class="stat-period">vs last month</span>
          </div>
        </div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon">
          <i class="pi pi-calendar"></i>
        </div>
        <div class="stat-content">
          <h3>Expected Births</h3>
          <p class="stat-value">18</p>
          <div class="stat-footer">
            <span class="stat-period">Next 30 days</span>
          </div>
        </div>
      </div>

      <div class="stat-card info">
        <div class="stat-icon">
          <i class="pi pi-dollar"></i>
        </div>
        <div class="stat-content">
          <h3>Monthly Revenue</h3>
          <p class="stat-value">$2,450</p>
          <div class="stat-footer">
            <span class="stat-change positive">
              <i class="pi pi-arrow-up"></i>
              15%
            </span>
            <span class="stat-period">vs last month</span>
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
          <div class="activity-item">
            <div class="activity-icon success">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="activity-content">
              <p>New rabbit added to cage #A123</p>
              <span class="activity-time">2 hours ago</span>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-icon primary">
              <i class="pi pi-heart-fill"></i>
            </div>
            <div class="activity-content">
              <p>Successful breeding pair #BP45</p>
              <span class="activity-time">5 hours ago</span>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-icon warning">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="activity-content">
              <p>Vaccination scheduled for 12 rabbits</p>
              <span class="activity-time">1 day ago</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-card">
        <div class="card-header">
          <h2>Upcoming Tasks</h2>
          <button class="card-action-btn">View All</button>
        </div>
        <div class="task-list">
          <div class="task-item">
            <label class="task-checkbox">
              <input type="checkbox">
              <span class="checkmark"></span>
            </label>
            <div class="task-content">
              <p>Vaccinate new rabbits</p>
              <span class="task-due warning">Due tomorrow</span>
            </div>
          </div>
          <div class="task-item">
            <label class="task-checkbox">
              <input type="checkbox">
              <span class="checkmark"></span>
            </label>
            <div class="task-content">
              <p>Clean cages in Section B</p>
              <span class="task-due">Due in 2 days</span>
            </div>
          </div>
          <div class="task-item">
            <label class="task-checkbox">
              <input type="checkbox">
              <span class="checkmark"></span>
            </label>
            <div class="task-content">
              <p>Restock feed supplies</p>
              <span class="task-due">Due in 3 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import Chart from 'chart.js/auto'

export default {
  name: 'AppDashboard',
  setup() {
    const store = useStore()
    const userName = computed(() => store.state.user?.name || 'User')
    
    const populationChart = ref(null)
    const revenueChart = ref(null)

    const populationData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Rabbit Population',
        data: [120, 135, 142, 156, 168, 172, 185, 190, 205, 215, 230, 245],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    }

    const revenueData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Revenue',
        data: [1200, 1900, 1600, 2450],
        backgroundColor: '#10b981',
        borderRadius: 6
      }]
    }

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

    onMounted(() => {
      // Create Population Chart
      if (populationChart.value) {
        new Chart(populationChart.value, {
          type: 'line',
          data: populationData,
          options: chartOptions
        })
      }

      // Create Revenue Chart
      if (revenueChart.value) {
        new Chart(revenueChart.value, {
          type: 'bar',
          data: revenueData,
          options: chartOptions
        })
      }
    })

    return {
      userName,
      populationChart,
      revenueChart
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style> 