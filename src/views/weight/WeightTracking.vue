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
        <button class="primary-button" @click="addWeightRecord">
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
            <div class="period-selector">
              <button 
                @click="changePeriod(7)" 
                :class="['period-btn', { active: selectedPeriod === 7 }]"
                :disabled="isLoadingChart"
              >
                7 Days
              </button>
              <button 
                @click="changePeriod(30)" 
                :class="['period-btn', { active: selectedPeriod === 30 }]"
                :disabled="isLoadingChart"
              >
                30 Days
              </button>
              <button 
                @click="changePeriod(90)" 
                :class="['period-btn', { active: selectedPeriod === 90 }]"
                :disabled="isLoadingChart"
              >
                90 Days
              </button>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <!-- Chart Loading Overlay -->
          <div v-if="isLoadingChart" class="chart-loading-overlay">
            <i class="pi pi-spinner pi-spin"></i>
            <span>Loading chart data...</span>
          </div>
          
          <!-- Chart Error Overlay -->
          <div v-if="chartError" class="chart-error-overlay">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ chartError }}</span>
            <button @click="fetchChartData" class="retry-chart-btn">
              <i class="pi pi-refresh"></i>
              Retry
            </button>
          </div>
          
          <!-- Chart Canvas - Always present -->
          <canvas ref="growthChart" :style="{ opacity: isLoadingChart || chartError ? 0.3 : 1 }"></canvas>
        </div>
      </div>

      <div class="content-card">
        <div class="card-header">
          <h2>Recent Weight Records</h2>
          <button class="card-action-btn" @click="viewAllRecords">View All</button>
        </div>
        <div class="weight-records">
          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
            <i class="pi pi-spinner pi-spin"></i>
            <span>Loading weight records...</span>
          </div>
          
          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ error }}</span>
          </div>
          
          <!-- Records List -->
          <div v-else-if="weightRecords.length > 0">
            <div v-for="record in weightRecords.slice(0, 5)" :key="record.id" class="record-item">
              <div class="record-info">
                <div class="rabbit-info">
                  <h4>{{ record.tag }}</h4>
                  <span>{{ record.breed }}</span>
                </div>
                <div class="weight-info">
                  <div class="weight-value">
                    <span class="current">{{ record.weight }} kg</span>
                    <span v-if="record.change > 0" class="change positive">+{{ Math.abs(record.change).toFixed(1) }} kg</span>
                    <span v-else-if="record.change < 0" class="change negative">-{{ Math.abs(record.change).toFixed(1) }} kg</span>
                  </div>
                  <span class="date">{{ record.date }}</span>
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
          </div>
          
          <!-- Empty State -->
          <div v-else class="no-records">
            <i class="pi pi-inbox"></i>
            <p>No weight records yet</p>
            <span>Start by adding your first weight measurement</span>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import Chart from 'chart.js/auto'

export default {
  name: 'WeightTracking',
  setup() {
    const router = useRouter()
    const growthChart = ref(null)
    const isLoading = ref(false)
    const isLoadingChart = ref(false)
    const error = ref('')
    const chartError = ref('')
    const selectedPeriod = ref(30) // Default to 30 days

    // Real weight records data from database
    const weightRecords = ref([])
    const chartData = ref(null)
    let chartInstance = null

    // This will be replaced with dynamic data
    const getDefaultChartData = () => ({
      labels: ['No data available'],
      datasets: [
        {
          label: 'Average Weight',
          data: [0],
          borderColor: '#e2e8f0',
          backgroundColor: 'rgba(226, 232, 240, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    })

    const getChartOptions = () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1e293b',
          bodyColor: '#64748b',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: function(context) {
              return context[0].label
            },
            label: function(context) {
              return `Average Weight: ${context.parsed.y} kg`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            display: true,
            drawBorder: false,
            color: '#f1f5f9'
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 12
            },
            callback: function(value) {
              return value + ' kg'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#64748b',
            font: {
              size: 12
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6,
          backgroundColor: '#3b82f6',
          borderColor: '#ffffff',
          borderWidth: 2
        }
      }
    })

    // Methods
    const addWeightRecord = () => {
      router.push('/weight-tracking/add')
    }

    const viewAllRecords = () => {
      router.push('/weight-tracking/records')
    }

    const changePeriod = async (days) => {
      console.log('Changing period to:', days, 'days')
      selectedPeriod.value = days
      await fetchChartData()
    }

    // Fetch weight data for chart
    const fetchChartData = async () => {
      try {
        isLoadingChart.value = true
        chartError.value = ''

        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - selectedPeriod.value)

        // Fetch weight records for the selected period
        const { data, error: fetchError } = await supabase
          .from('weight_records_with_rabbit')
          .select('measurement_date, weight, rabbit_tag')
          .gte('measurement_date', startDate.toISOString().split('T')[0])
          .lte('measurement_date', endDate.toISOString().split('T')[0])
          .order('measurement_date', { ascending: true })

        if (fetchError) throw fetchError

        if (!data || data.length === 0) {
          chartData.value = getDefaultChartData()
          updateChart()
          return
        }

        // Process data for chart
        const processedData = processChartData(data)
        chartData.value = processedData
        
        console.log('Chart data processed:', processedData)
        
        // Update chart or initialize if not exists
        if (chartInstance) {
          updateChart()
        } else {
          // If chart doesn't exist yet, try to initialize it
          setTimeout(() => {
            initializeChart()
          }, 100)
        }

      } catch (err) {
        console.error('Error fetching chart data:', err)
        chartError.value = 'Failed to load chart data'
        chartData.value = getDefaultChartData()
        updateChart()
      } finally {
        isLoadingChart.value = false
      }
    }

    // Process raw weight data into chart format
    const processChartData = (rawData) => {
      // Group data by date and calculate daily averages
      const dateGroups = {}
      
      rawData.forEach(record => {
        const date = record.measurement_date
        if (!dateGroups[date]) {
          dateGroups[date] = {
            weights: [],
            count: 0
          }
        }
        dateGroups[date].weights.push(record.weight)
        dateGroups[date].count++
      })

      // Calculate averages and create chart data
      const dates = Object.keys(dateGroups).sort()
      const labels = []
      const averages = []

      dates.forEach(date => {
        const group = dateGroups[date]
        const average = group.weights.reduce((sum, weight) => sum + weight, 0) / group.count
        
        labels.push(formatChartDate(date))
        averages.push(Math.round(average * 100) / 100) // Round to 2 decimal places
      })

      // If we have fewer than 5 data points, we might want to interpolate or show weekly/monthly averages
      let finalLabels = labels
      let finalData = averages

      if (selectedPeriod.value > 30 && dates.length > 15) {
        // For longer periods, group by weeks
        const weeklyData = groupByWeeks(dates, dateGroups)
        finalLabels = weeklyData.labels
        finalData = weeklyData.averages
      }

      return {
        labels: finalLabels,
        datasets: [
          {
            label: 'Average Weight',
            data: finalData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      }
    }

    // Group data by weeks for longer periods
    const groupByWeeks = (dates, dateGroups) => {
      const weeks = {}
      
      dates.forEach(date => {
        const dateObj = new Date(date)
        const weekStart = new Date(dateObj)
        weekStart.setDate(dateObj.getDate() - dateObj.getDay()) // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeks[weekKey]) {
          weeks[weekKey] = {
            weights: [],
            startDate: weekStart
          }
        }
        weeks[weekKey].weights.push(...dateGroups[date].weights)
      })

      const labels = []
      const averages = []

      Object.keys(weeks).sort().forEach(weekKey => {
        const week = weeks[weekKey]
        const average = week.weights.reduce((sum, weight) => sum + weight, 0) / week.weights.length
        
        labels.push(formatChartDate(weekKey, true)) // true for week format
        averages.push(Math.round(average * 100) / 100)
      })

      return { labels, averages }
    }

    // Format date for chart labels
    const formatChartDate = (dateString, isWeek = false) => {
      const date = new Date(dateString)
      
      if (isWeek) {
        const endDate = new Date(date)
        endDate.setDate(date.getDate() + 6)
        return `Week of ${date.getMonth() + 1}/${date.getDate()}`
      }
      
      if (selectedPeriod.value <= 7) {
        // For week view, show day names
        return date.toLocaleDateString('en-US', { weekday: 'short' })
      } else if (selectedPeriod.value <= 30) {
        // For month view, show month/day
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else {
        // For longer periods, show month/day
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    }

    // Update the chart instance
    const updateChart = () => {
      if (chartInstance && chartData.value) {
        console.log('Updating chart with new data:', chartData.value)
        chartInstance.data = chartData.value
        chartInstance.update('active')
      } else {
        console.warn('Chart instance or data not available for update')
      }
    }

    // Initialize chart
    const initializeChart = (force = false) => {
      // Destroy existing chart if forcing recreation
      if (force && chartInstance) {
        console.log('Destroying existing chart for recreation')
        chartInstance.destroy()
        chartInstance = null
      }
      
      if (growthChart.value && !chartInstance) {
        console.log('Initializing chart with data:', chartData.value)
        try {
          chartInstance = new Chart(growthChart.value, {
            type: 'line',
            data: chartData.value || getDefaultChartData(),
            options: getChartOptions()
          })
          console.log('Chart initialized successfully')
        } catch (error) {
          console.error('Error initializing chart:', error)
        }
      } else if (chartInstance) {
        console.log('Chart already exists, updating instead')
        updateChart()
      }
    }

    // Fetch recent weight records from database
    const fetchWeightRecords = async () => {
      try {
        isLoading.value = true
        error.value = ''

        // Get weight records with rabbit information using the view
        const { data, error: fetchError } = await supabase
          .from('weight_records_with_rabbit')
          .select('*')
          .order('measurement_date', { ascending: false })
          .limit(10)

        if (fetchError) throw fetchError

        // Transform data for display
        const transformedRecords = data?.map(record => ({
          id: record.id,
          rabbitId: record.rabbit_id,
          tag: record.rabbit_tag,
          breed: record.breed,
          weight: record.weight,
          previousWeight: record.previous_weight || 0,
          date: formatDate(record.measurement_date),
          change: record.weight_change || 0,
          measurement_date: record.measurement_date
        })) || []

        weightRecords.value = transformedRecords
        console.log('Fetched weight records:', transformedRecords)

      } catch (err) {
        console.error('Error fetching weight records:', err)
        error.value = 'Failed to load weight records'
        // Show mock data if database fails
        weightRecords.value = []
      } finally {
        isLoading.value = false
      }
    }

    // Format date for display
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

    onMounted(async () => {
      console.log('Component mounted, initializing...')
      
      // Initialize with default chart data
      chartData.value = getDefaultChartData()
      console.log('Default chart data set')
      
      // Fetch weight records first
      await fetchWeightRecords()
      
      // Then fetch chart data
      await fetchChartData()
      
      // Initialize chart after data is loaded with a longer delay
      setTimeout(() => {
        console.log('Attempting to initialize chart, canvas element:', growthChart.value)
        initializeChart()
      }, 200) // Longer delay to ensure DOM is ready
    })

    return {
      growthChart,
      weightRecords,
      isLoading,
      isLoadingChart,
      error,
      chartError,
      selectedPeriod,
      addWeightRecord,
      viewAllRecords,
      changePeriod,
      fetchChartData
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

.period-selector {
  display: flex;
  gap: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.25rem;
  background: #f8fafc;
}

.period-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  color: #64748b;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.period-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #475569;
}

.period-btn.active {
  background: #3b82f6;
  color: white;
}

.period-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chart-container {
  height: 300px;
  position: relative;
}

.chart-loading-overlay, .chart-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
  color: #64748b;
}

.chart-error-overlay {
  color: #dc2626;
}

.retry-chart-btn {
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

.retry-chart-btn:hover {
  background: #b91c1c;
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

.change.negative {
  color: #ef4444;
}

.no-records {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.no-records i {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

.no-records p {
  margin: 0.5rem 0;
  font-weight: 500;
}

.no-records span {
  font-size: 0.875rem;
}

.loading-state, .error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #64748b;
}

.error-state {
  color: #dc2626;
}

.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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