<template>
  <div class="reports-page">
    <div class="page-header">
      <div>
        <h1>Reports</h1>
        <p class="subtitle">Generate and analyze farm performance reports</p>
      </div>
      <div class="header-actions">
        <select v-model="selectedTimeframe" @change="changeTimeframe" class="secondary-button select-button">
          <option value="1">Last Month</option>
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
          <option value="12">Last Year</option>
        </select>
        <button @click="exportReport" class="primary-button">
          <i class="pi pi-download"></i>
          Export Report
        </button>
        <router-link to="/reports/schedules" class="secondary-button">
          <i class="pi pi-calendar"></i>
          Schedule Reports
        </router-link>
      </div>
    </div>

    <div class="reports-grid">
      <!-- Report Types Section -->
      <div class="report-types">
        <div class="content-card">
          <h3>Report Types</h3>
          <div class="type-list">
            <button 
              v-for="reportType in reportTypes" 
              :key="reportType.id"
              :class="['type-item', { active: currentReportType === reportType.id }]"
              @click="selectReportType(reportType.id)"
            >
              <i :class="reportType.icon"></i>
              <div>
                <h4>{{ reportType.title }}</h4>
                <span>{{ reportType.description }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Report Content Section -->
      <div class="report-content">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading {{ currentReportType }} report...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <p>{{ error }}</p>
          <button @click="loadReportData" class="retry-btn">Try Again</button>
        </div>

        <div v-else-if="currentReport" class="content-card">
          <div class="card-header">
            <h2>{{ reportTypes.find(r => r.id === currentReportType)?.title }}</h2>
            <div class="report-status">
              <span class="status-indicator success"></span>
              <span>Data updated</span>
            </div>
          </div>

          <!-- Summary Stats - Dynamic based on report type -->
          <div class="summary-stats">
            <!-- Population Report Stats -->
            <template v-if="currentReportType === 'population'">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-users"></i>
                </div>
                <div class="stat-content">
                  <h3>Total Population</h3>
                  <p class="stat-value">{{ formatNumber(currentReport.summary?.totalPopulation) }}</p>
                  <p class="stat-change positive">{{ formatPercentage(currentReport.summary?.growthRate) }} growth rate</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-heart-fill"></i>
                </div>
                <div class="stat-content">
                  <h3>Breeding Pairs</h3>
                  <p class="stat-value">{{ formatNumber(currentReport.summary?.breedingPairs) }}</p>
                  <p class="stat-change">{{ formatNumber(currentReport.summary?.males) }} males, {{ formatNumber(currentReport.summary?.females) }} females</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-plus"></i>
                </div>
                <div class="stat-content">
                  <h3>Young Rabbits</h3>
                  <p class="stat-value">{{ formatNumber(currentReport.summary?.young) }}</p>
                  <p class="stat-change">Under 6 months old</p>
                </div>
              </div>
            </template>

            <!-- Health Report Stats -->
            <template v-if="currentReportType === 'health'">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-clipboard"></i>
                </div>
                <div class="stat-content">
                  <h3>Health Records</h3>
                  <p class="stat-value">{{ formatNumber(currentReport.summary?.totalRecords) }}</p>
                  <p class="stat-change">Total recorded</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-dollar"></i>
                </div>
                <div class="stat-content">
                  <h3>Health Costs</h3>
                  <p class="stat-value">{{ formatCurrency(currentReport.summary?.totalHealthCost) }}</p>
                  <p class="stat-change">{{ formatCurrency(currentReport.summary?.averageCostPerRecord) }} per record</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-heart"></i>
                </div>
                <div class="stat-content">
                  <h3>Healthy Status</h3>
                  <p class="stat-value">{{ formatNumber(currentReport.summary?.statusDistribution?.healthy || 0) }}</p>
                  <p class="stat-change">Healthy rabbits</p>
                </div>
              </div>
            </template>

            <!-- Financial Report Stats -->
            <template v-if="currentReportType === 'financial'">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-arrow-up"></i>
                </div>
                <div class="stat-content">
                  <h3>Total Revenue</h3>
                  <p class="stat-value">{{ formatCurrency(currentReport.summary?.totalRevenue) }}</p>
                  <p class="stat-change positive">Revenue generated</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-arrow-down"></i>
                </div>
                <div class="stat-content">
                  <h3>Total Expenses</h3>
                  <p class="stat-value">{{ formatCurrency(currentReport.summary?.totalExpenses) }}</p>
                  <p class="stat-change">Total spent</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-chart-line"></i>
                </div>
                <div class="stat-content">
                  <h3>Net Profit</h3>
                  <p class="stat-value" :class="{ 'negative': currentReport.summary?.netProfit < 0 }">
                    {{ formatCurrency(currentReport.summary?.netProfit) }}
                  </p>
                  <p class="stat-change">{{ formatPercentage(currentReport.summary?.profitMargin) }} margin</p>
                </div>
              </div>
            </template>

            <!-- Breeding Report Stats -->
            <template v-if="currentReportType === 'breeding'">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-calendar"></i>
                </div>
                <div class="stat-content">
                  <h3>Total Breedings</h3>
                  <p class="stat-value">{{ formatNumber(currentReport.summary?.totalBreedings) }}</p>
                  <p class="stat-change">Breeding attempts</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-check"></i>
                </div>
                <div class="stat-content">
                  <h3>Success Rate</h3>
                  <p class="stat-value">{{ formatPercentage(currentReport.summary?.successRate) }}</p>
                  <p class="stat-change positive">{{ formatNumber(currentReport.summary?.successful) }} successful</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-users"></i>
                </div>
                <div class="stat-content">
                  <h3>Active Pairs</h3>
                  <p class="stat-value">{{ formatNumber(currentReport.summary?.totalPairs) }}</p>
                  <p class="stat-change">Breeding pairs</p>
                </div>
              </div>
            </template>
          </div>

          <!-- Charts Section -->
          <div v-if="hasChartData" class="charts-section">
            <div class="chart-container">
              <canvas ref="populationChart"></canvas>
            </div>
          </div>
          
          <!-- No Chart Data Message -->
          <div v-else-if="currentReport && !isLoading" class="no-chart-data">
            <div class="info-message">
              <i class="pi pi-info-circle"></i>
              <p>Chart will appear when you have sufficient data for trends analysis</p>
            </div>
          </div>

          <!-- Dynamic Details Section -->
          <div class="details-section">
            <h3>Detailed Analysis</h3>
            
            <!-- Population Details -->
            <div v-if="currentReportType === 'population' && currentReport.detailedStats" class="table-container">
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
                  <tr v-for="stat in currentReport.detailedStats" :key="stat.category">
                    <td>{{ stat.category }}</td>
                    <td>{{ stat.count }}</td>
                    <td :class="{ 'positive': stat.change > 0, 'negative': stat.change < 0 }">
                      {{ stat.change > 0 ? '+' : '' }}{{ stat.change }}
                    </td>
                    <td>
                      <div class="trend-indicator" :class="stat.trend">
                        <i :class="{
                          'pi pi-arrow-up': stat.trend === 'up',
                          'pi pi-arrow-down': stat.trend === 'down',
                          'pi pi-minus': stat.trend === 'stable'
                        }"></i>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Recommendations -->
            <div v-if="currentReport.recommendations && currentReport.recommendations.length > 0" class="recommendations-section">
              <h4>Recommendations</h4>
              <div class="recommendations-list">
                <div v-for="rec in currentReport.recommendations" :key="rec.type" 
                     class="recommendation-item" :class="rec.priority">
                  <div class="recommendation-icon">
                    <i class="pi pi-lightbulb"></i>
                  </div>
                  <div class="recommendation-content">
                    <h5>{{ rec.title }}</h5>
                    <p>{{ rec.description }}</p>
                    <span class="recommendation-action">{{ rec.action }}</span>
                  </div>
                  <div class="recommendation-priority">{{ rec.priority }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="pi pi-chart-bar"></i>
          <h3>No data available</h3>
          <p>Select a report type to view data</p>
        </div>
      </div>
    </div>

    <!-- Export Dialog -->
    <ExportDialog 
      :show="showExportDialog"
      default-format="pdf"
      @confirm="handleExportConfirm"
      @close="handleExportClose"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import Chart from 'chart.js/auto'
import { reportsService } from '@/services/reportsService'
import { supabase } from '@/supabase'
import currencyService from '@/services/currency'
import { exportService } from '@/services/exportService'

export default {
  name: 'AppReports',
  setup() {
    const populationChart = ref(null)
    
    // State management
    const currentReportType = ref('population')
    const selectedTimeframe = ref(6)
    const isLoading = ref(false)
    const error = ref('')
    
    // Chart instance
    let chartInstance = null
    
    // Report data
    const reportData = reactive({
      population: null,
      health: null,
      financial: null,
      breeding: null,
      feeding: null
    })

    // Computed properties
    const currentReport = computed(() => reportData[currentReportType.value])
    
    // Check if current report has chart data
    const hasChartData = computed(() => {
      const report = currentReport.value
      if (!report || !report.trends || !Array.isArray(report.trends)) return false
      
      // Always show chart if we have trend data, even if minimal
      return report.trends.length > 0
    })
    
    const reportTypes = ref([
      {
        id: 'population',
        icon: 'pi pi-chart-line',
        title: 'Population Report',
        description: 'Growth and demographics'
      },
      {
        id: 'health',
        icon: 'pi pi-heart',
        title: 'Health Report',
        description: 'Health records and trends'
      },
      {
        id: 'financial',
        icon: 'pi pi-dollar',
        title: 'Financial Report',
        description: 'Revenue and expenses'
      },
      {
        id: 'breeding',
        icon: 'pi pi-calendar',
        title: 'Breeding Report',
        description: 'Breeding performance'
      }
    ])

    // Chart configuration
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

    // Methods
    const selectReportType = (reportType) => {
      currentReportType.value = reportType
      loadReportData()
    }

    const changeTimeframe = () => {
      loadReportData()
    }

    const loadReportData = async () => {
      try {
        isLoading.value = true
        error.value = ''

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        let data
        switch (currentReportType.value) {
          case 'population':
            data = await reportsService.generatePopulationReport(user.id, selectedTimeframe.value)
            break
          case 'health':
            data = await reportsService.generateHealthReport(user.id, selectedTimeframe.value)
            break
          case 'financial':
            data = await reportsService.generateFinancialReport(user.id, selectedTimeframe.value)
            break
          case 'breeding':
            data = await reportsService.generateBreedingReport(user.id, selectedTimeframe.value)
            break
          case 'feeding':
            data = await reportsService.generateFeedingReport(user.id, selectedTimeframe.value)
            break
          default:
            throw new Error('Unknown report type')
        }

        reportData[currentReportType.value] = data
        updateChart()

        console.log(`${currentReportType.value} report loaded:`, data)
      } catch (err) {
        console.error('Error loading report data:', err)
        error.value = `Failed to load ${currentReportType.value} report: ${err.message}`
      } finally {
        isLoading.value = false
      }
    }

    const updateChart = () => {
      if (!chartInstance || !currentReport.value) return

      try {
        const report = currentReport.value
        let chartData = {}

        switch (currentReportType.value) {
          case 'population':
            chartData = {
              labels: report.trends?.map(t => {
                const date = new Date(t.month)
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
              }) || [],
              datasets: [{
                label: 'Population',
                data: report.trends?.map(t => t.population) || [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
              }]
            }
            break
          
          case 'health':
            chartData = {
              labels: report.trends?.map(t => {
                const date = new Date(t.month)
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
              }) || [],
              datasets: [{
                label: 'Health Records',
                data: report.trends?.map(t => t.recordCount) || [],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true
              }]
            }
            break
          
          case 'financial':
            chartData = {
              labels: report.trends?.map(t => {
                const date = new Date(t.month)
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
              }) || [],
              datasets: [
                {
                  label: 'Revenue',
                  data: report.trends?.map(t => t.revenue) || [],
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  tension: 0.4,
                  fill: true
                },
                {
                  label: 'Expenses',
                  data: report.trends?.map(t => t.expenses) || [],
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  tension: 0.4,
                  fill: true
                }
              ]
            }
            break
          
          case 'breeding':
            chartData = {
              labels: report.trends?.map(t => {
                const date = new Date(t.month)
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
              }) || [],
              datasets: [{
                label: 'Success Rate (%)',
                data: report.trends?.map(t => t.successRate) || [],
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: true
              }]
            }
            break
          
          default:
            return
        }

        chartInstance.data = chartData
        chartInstance.update()
      } catch (err) {
        console.error('Error updating chart:', err)
      }
    }

    const showExportDialog = ref(false)

    const exportReport = async () => {
      if (!currentReport.value) {
        alert('No report data available to export')
        return
      }
      showExportDialog.value = true
    }

    const handleExportConfirm = async (format) => {
      try {
        await exportService.exportFarmReport(currentReport.value, currentReportType.value, format)
        showExportDialog.value = false
        
        // Show success message
        console.log(`${currentReportType.value} report exported successfully as ${format.toUpperCase()}`)
      } catch (error) {
        console.error('Failed to export report:', error)
        alert('Failed to export report. Please try again.')
      }
    }

    const handleExportClose = () => {
      showExportDialog.value = false
    }

    const formatCurrency = (amount) => {
      return currencyService.format(amount || 0)
    }

    const formatNumber = (number) => {
      return number?.toLocaleString() || '0'
    }

    const formatPercentage = (value) => {
      return `${(value || 0).toFixed(1)}%`
    }

    onMounted(async () => {
      try {
        // Initialize currency service
        await currencyService.initialize()
        
        // Initialize chart
        if (populationChart.value) {
          chartInstance = new Chart(populationChart.value, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: chartOptions
          })
        }
        
        // Load initial report data
        await loadReportData()
      } catch (err) {
        console.error('Error during component initialization:', err)
        error.value = 'Failed to initialize reports'
      }
    })

    return {
      populationChart,
      currentReportType,
      selectedTimeframe,
      isLoading,
      error,
      reportData,
      currentReport,
      hasChartData,
      reportTypes,
      selectReportType,
      changeTimeframe,
      loadReportData,
      exportReport,
      showExportDialog,
      handleExportConfirm,
      handleExportClose,
      formatCurrency,
      formatNumber,
      formatPercentage
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

.no-chart-data {
  margin-bottom: 2rem;
}

.info-message {
  padding: 2rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
  color: #64748b;
}

.info-message i {
  font-size: 2rem;
  color: #3b82f6;
  margin-bottom: 0.5rem;
  display: block;
}

.info-message p {
  margin: 0;
  font-size: 0.875rem;
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

/* New Styles for Enhanced Reports */
.select-button {
  background: white !important;
  color: #64748b !important;
  border: 1px solid #e2e8f0 !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 8px !important;
  font-size: 14px !important;
  cursor: pointer !important;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state i {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #2563eb;
}

.report-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.success {
  background: #10b981;
}

.stat-value.negative {
  color: #ef4444;
}

.trend-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.trend-indicator.up {
  background: #dcfce7;
  color: #16a34a;
}

.trend-indicator.down {
  background: #fecaca;
  color: #dc2626;
}

.trend-indicator.stable {
  background: #f3f4f6;
  color: #6b7280;
}

.recommendations-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.recommendations-section h4 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.125rem;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

.recommendation-item.high {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.recommendation-item.medium {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.recommendation-item.low {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.recommendation-icon {
  width: 40px;
  height: 40px;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.recommendation-item.high .recommendation-icon {
  background: #fef2f2;
  color: #ef4444;
}

.recommendation-item.medium .recommendation-icon {
  background: #fffbeb;
  color: #f59e0b;
}

.recommendation-item.low .recommendation-icon {
  background: #f0fdf4;
  color: #10b981;
}

.recommendation-content {
  flex: 1;
}

.recommendation-content h5 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
}

.recommendation-content p {
  margin: 0 0 0.75rem 0;
  color: #64748b;
  line-height: 1.5;
}

.recommendation-action {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.recommendation-item.high .recommendation-action {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.recommendation-item.medium .recommendation-action {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.recommendation-item.low .recommendation-action {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.recommendation-priority {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #f3f4f6;
  color: #6b7280;
  align-self: flex-start;
}

.recommendation-item.high .recommendation-priority {
  background: #fecaca;
  color: #991b1b;
}

.recommendation-item.medium .recommendation-priority {
  background: #fed7aa;
  color: #92400e;
}

.recommendation-item.low .recommendation-priority {
  background: #bbf7d0;
  color: #065f46;
}
</style> 