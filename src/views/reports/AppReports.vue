<template>
  <div class="reports-page">
    <div class="page-header">
      <div>
        <h1>Reports</h1>
        <p class="subtitle">Generate and analyze farm performance reports</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button">
          <i class="pi pi-calendar"></i>
          Date Range
        </button>
        <button class="primary-button">
          <i class="pi pi-download"></i>
          Export Report
        </button>
      </div>
    </div>

    <div class="reports-grid">
      <!-- Report Types Section -->
      <div class="report-types">
        <div class="content-card">
          <h3>Report Types</h3>
          <div class="type-list">
            <button class="type-item active">
              <i class="pi pi-chart-line"></i>
              <div>
                <h4>Population Report</h4>
                <span>Growth and demographics</span>
              </div>
            </button>
            <button class="type-item">
              <i class="pi pi-heart"></i>
              <div>
                <h4>Health Report</h4>
                <span>Health records and trends</span>
              </div>
            </button>
            <button class="type-item">
              <i class="pi pi-dollar"></i>
              <div>
                <h4>Financial Report</h4>
                <span>Revenue and expenses</span>
              </div>
            </button>
            <button class="type-item">
              <i class="pi pi-calendar"></i>
              <div>
                <h4>Breeding Report</h4>
                <span>Breeding performance</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Report Content Section -->
      <div class="report-content">
        <div class="content-card">
          <div class="card-header">
            <h2>Population Report</h2>
            <div class="header-filters">
              <select class="form-control">
                <option>Last 30 Days</option>
                <option>Last 3 Months</option>
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
          </div>

          <!-- Summary Stats -->
          <div class="summary-stats">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-users"></i>
              </div>
              <div class="stat-content">
                <h3>Total Population</h3>
                <p class="stat-value">245</p>
                <p class="stat-change positive">+12% from last month</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-heart-fill"></i>
              </div>
              <div class="stat-content">
                <h3>Breeding Pairs</h3>
                <p class="stat-value">28</p>
                <p class="stat-change">+2 new pairs</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-plus"></i>
              </div>
              <div class="stat-content">
                <h3>New Births</h3>
                <p class="stat-value">36</p>
                <p class="stat-change positive">+8% success rate</p>
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="charts-section">
            <div class="chart-container">
              <canvas ref="populationChart"></canvas>
            </div>
          </div>

          <!-- Detailed Stats Table -->
          <div class="details-section">
            <h3>Detailed Statistics</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Change</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Adult Females</td>
                    <td>85</td>
                    <td class="positive">+5</td>
                    <td>
                      <div class="mini-chart">
                        <div class="chart-bar" style="height: 60%"></div>
                        <div class="chart-bar" style="height: 80%"></div>
                        <div class="chart-bar" style="height: 75%"></div>
                        <div class="chart-bar active" style="height: 90%"></div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Adult Males</td>
                    <td>65</td>
                    <td class="positive">+3</td>
                    <td>
                      <div class="mini-chart">
                        <div class="chart-bar" style="height: 70%"></div>
                        <div class="chart-bar" style="height: 65%"></div>
                        <div class="chart-bar" style="height: 85%"></div>
                        <div class="chart-bar active" style="height: 95%"></div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Young Rabbits</td>
                    <td>95</td>
                    <td class="positive">+12</td>
                    <td>
                      <div class="mini-chart">
                        <div class="chart-bar" style="height: 50%"></div>
                        <div class="chart-bar" style="height: 65%"></div>
                        <div class="chart-bar" style="height: 80%"></div>
                        <div class="chart-bar active" style="height: 100%"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'AppReports',
  setup() {
    const populationChart = ref(null)

    const populationData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Total Population',
          data: [180, 195, 210, 225, 235, 245],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
      if (populationChart.value) {
        new Chart(populationChart.value, {
          type: 'line',
          data: populationData,
          options: chartOptions
        })
      }
    })

    return {
      populationChart
    }
  }
}
</script>

<style scoped>
.reports-page {
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

.reports-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
}

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.report-types h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
}

.type-item:hover {
  background: #f8fafc;
}

.type-item.active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.type-item i {
  font-size: 1.25rem;
  color: #3b82f6;
}

.type-item h4 {
  margin: 0;
  color: #1e293b;
}

.type-item span {
  font-size: 0.875rem;
  color: #64748b;
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

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
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
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
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

.charts-section {
  margin-bottom: 2rem;
}

.chart-container {
  height: 300px;
}

.chart-container h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
}

.details-section h3 {
  margin: 0 0 1rem 0;
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

.positive {
  color: #10b981;
}

.mini-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 24px;
}

.chart-bar {
  flex: 1;
  background: #e2e8f0;
  border-radius: 1px;
}

.chart-bar.active {
  background: #3b82f6;
}

@media (max-width: 1024px) {
  .reports-grid {
    grid-template-columns: 1fr;
  }

  .type-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .summary-stats {
    grid-template-columns: 1fr;
  }
}
</style> 