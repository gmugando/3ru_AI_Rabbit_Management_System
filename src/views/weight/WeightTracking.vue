<template>
  <div class="weight-tracking-page">
    <div class="page-header">
      <div>
        <h1>Weight Tracking</h1>
        <p class="subtitle">Monitor rabbit growth and health</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button">
          <i class="pi pi-filter"></i>
          Filter
        </button>
        <button class="primary-button">
          <i class="pi pi-plus"></i>
          Add Weight Record
        </button>
      </div>
    </div>

    <div class="content-grid">
      <div class="content-card chart-card">
        <div class="card-header">
          <h2>Growth Trends</h2>
          <div class="card-actions">
            <button class="card-action-btn">
              <i class="pi pi-calendar"></i>
              Last 30 Days
            </button>
          </div>
        </div>
        <div class="chart-container">
          <canvas ref="growthChart"></canvas>
        </div>
      </div>

      <div class="content-card">
        <div class="card-header">
          <h2>Recent Weight Records</h2>
          <button class="card-action-btn">View All</button>
        </div>
        <div class="weight-records">
          <div class="record-item">
            <div class="record-info">
              <div class="rabbit-info">
                <h4>R-001</h4>
                <span>New Zealand White</span>
              </div>
              <div class="weight-info">
                <div class="weight-value">
                  <span class="current">4.2 kg</span>
                  <span class="change positive">+0.3 kg</span>
                </div>
                <span class="date">Today</span>
              </div>
            </div>
            <div class="weight-chart">
              <div class="mini-chart">
                <div class="chart-bar" style="height: 60%"></div>
                <div class="chart-bar" style="height: 75%"></div>
                <div class="chart-bar" style="height: 85%"></div>
                <div class="chart-bar active" style="height: 100%"></div>
              </div>
            </div>
          </div>

          <div class="record-item">
            <div class="record-info">
              <div class="rabbit-info">
                <h4>R-002</h4>
                <span>California White</span>
              </div>
              <div class="weight-info">
                <div class="weight-value">
                  <span class="current">3.8 kg</span>
                  <span class="change positive">+0.2 kg</span>
                </div>
                <span class="date">Yesterday</span>
              </div>
            </div>
            <div class="weight-chart">
              <div class="mini-chart">
                <div class="chart-bar" style="height: 70%"></div>
                <div class="chart-bar" style="height: 80%"></div>
                <div class="chart-bar" style="height: 90%"></div>
                <div class="chart-bar active" style="height: 95%"></div>
              </div>
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
  name: 'WeightTracking',
  setup() {
    const growthChart = ref(null)

    const growthData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Average Weight',
          data: [2.5, 3.0, 3.5, 4.2],
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
      if (growthChart.value) {
        new Chart(growthChart.value, {
          type: 'line',
          data: growthData,
          options: chartOptions
        })
      }
    })

    return {
      growthChart
    }
  }
}
</script>

<style scoped>
.weight-tracking-page {
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
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.content-card {
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.chart-container {
  height: 300px;
}

.weight-records {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.record-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rabbit-info h4 {
  margin: 0;
  color: #1e293b;
}

.rabbit-info span {
  font-size: 0.875rem;
  color: #64748b;
}

.weight-info {
  text-align: right;
}

.weight-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.current {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.change {
  font-size: 0.875rem;
}

.change.positive {
  color: #10b981;
}

.date {
  font-size: 0.875rem;
  color: #64748b;
}

.weight-chart {
  width: 100px;
}

.mini-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 40px;
}

.chart-bar {
  flex: 1;
  background: #e2e8f0;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.chart-bar.active {
  background: #3b82f6;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .record-item {
    flex-direction: column;
    align-items: stretch;
  }

  .record-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .weight-info {
    text-align: left;
  }

  .weight-chart {
    width: 100%;
    margin-top: 1rem;
  }
}
</style> 