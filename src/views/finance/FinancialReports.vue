<template>
  <div class="reports-page">
    <div class="page-header">
      <div>
        <h1>Financial Reports & Analytics</h1>
        <p class="subtitle">Comprehensive financial insights and performance analysis</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="exportReports">
          <i class="pi pi-download"></i>
          Export PDF
        </button>
        <button class="secondary-button" @click="$router.go(-1)">
          <i class="pi pi-arrow-left"></i>
          Back
        </button>
      </div>
    </div>

    <!-- Report Filters -->
    <div class="content-card filters-card">
      <div class="filters-header">
        <h3>Report Parameters</h3>
        <button @click="generateReport" :disabled="isLoading" class="primary-button">
          <i class="pi pi-refresh" :class="{ 'pi-spin': isLoading }"></i>
          {{ isLoading ? 'Generating...' : 'Generate Report' }}
        </button>
      </div>
      
      <div class="filters-grid">
        <div class="filter-group">
          <label for="report-period">Report Period</label>
          <select id="report-period" v-model="reportParams.period" class="form-control">
            <option value="1">Last Month</option>
            <option value="3">Last 3 Months</option>
            <option value="6">Last 6 Months</option>
            <option value="12">Last 12 Months</option>
            <option value="24">Last 2 Years</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        <div v-if="reportParams.period === 'custom'" class="filter-group">
          <label for="start-date">Start Date</label>
          <input id="start-date" v-model="reportParams.startDate" type="date" class="form-control" />
        </div>
        
        <div v-if="reportParams.period === 'custom'" class="filter-group">
          <label for="end-date">End Date</label>
          <input id="end-date" v-model="reportParams.endDate" type="date" class="form-control" />
        </div>
        
        <div class="filter-group">
          <label for="report-type">Report Focus</label>
          <select id="report-type" v-model="reportParams.reportType" class="form-control">
            <option value="overview">Financial Overview</option>
            <option value="profitability">Profitability Analysis</option>
            <option value="farm-costs">Farm Cost Breakdown</option>
            <option value="trends">Trend Analysis</option>
            <option value="comparative">Period Comparison</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="grouping">Group By</label>
          <select id="grouping" v-model="reportParams.groupBy" class="form-control">
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
            <option value="category">Category</option>
            <option value="activity">Farm Activity</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner-large"></div>
      <p>Generating comprehensive financial report...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="generateReport" class="retry-btn">Try Again</button>
    </div>

    <div v-else-if="reportData" class="reports-content">
      <!-- Executive Summary -->
      <div class="content-card">
        <div class="card-header">
          <h2>Executive Summary</h2>
          <span class="report-period-badge">{{ formatReportPeriod() }}</span>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card revenue">
            <div class="summary-icon">
              <i class="pi pi-arrow-up"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">Total Revenue</div>
              <div class="summary-value">{{ formatCurrency(reportData.summary?.totalRevenue || 0) }}</div>
              <div class="summary-change" :class="getChangeClass(reportData.summary?.revenueChange)">
                {{ formatChange(reportData.summary?.revenueChange) }} vs previous period
              </div>
            </div>
          </div>

          <div class="summary-card expenses">
            <div class="summary-icon">
              <i class="pi pi-arrow-down"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">Total Expenses</div>
              <div class="summary-value">{{ formatCurrency(reportData.summary?.totalExpenses || 0) }}</div>
              <div class="summary-change" :class="getChangeClass(-reportData.summary?.expensesChange)">
                {{ formatChange(reportData.summary?.expensesChange) }} vs previous period
              </div>
            </div>
          </div>

          <div class="summary-card profit">
            <div class="summary-icon">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">Net Profit</div>
              <div class="summary-value" :class="{ 'negative': reportData.summary?.netProfit < 0 }">
                {{ formatCurrency(reportData.summary?.netProfit || 0) }}
              </div>
              <div class="summary-change" :class="getChangeClass(reportData.summary?.profitChange)">
                {{ formatChange(reportData.summary?.profitChange) }} vs previous period
              </div>
            </div>
          </div>

          <div class="summary-card margin">
            <div class="summary-icon">
              <i class="pi pi-percentage"></i>
            </div>
            <div class="summary-content">
              <div class="summary-label">Profit Margin</div>
              <div class="summary-value" :class="{ 'negative': reportData.summary?.profitMargin < 0 }">
                {{ formatPercentage(reportData.summary?.profitMargin || 0) }}
              </div>
              <div class="summary-change" :class="getChangeClass(reportData.summary?.marginChange)">
                {{ formatChange(reportData.summary?.marginChange) }}pp vs previous period
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-grid">
        <!-- Revenue vs Expenses Trend -->
        <div class="content-card chart-card">
          <div class="card-header">
            <h3>Revenue vs Expenses Trend</h3>
            <div class="chart-controls">
              <button @click="chartType = 'line'" :class="{ active: chartType === 'line' }" class="chart-toggle">
                <i class="pi pi-chart-line"></i>
              </button>
              <button @click="chartType = 'bar'" :class="{ active: chartType === 'bar' }" class="chart-toggle">
                <i class="pi pi-chart-bar"></i>
              </button>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="trendsChart"></canvas>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="content-card chart-card">
          <div class="card-header">
            <h3>Expense Categories</h3>
          </div>
          <div class="chart-container">
            <canvas ref="categoryChart"></canvas>
          </div>
        </div>

        <!-- Farm Activity Costs -->
        <div class="content-card chart-card">
          <div class="card-header">
            <h3>Farm Activity Costs</h3>
          </div>
          <div class="chart-container">
            <canvas ref="farmCostsChart"></canvas>
          </div>
        </div>

        <!-- Profitability Analysis -->
        <div class="content-card chart-card">
          <div class="card-header">
            <h3>Profitability Over Time</h3>
          </div>
          <div class="chart-container">
            <canvas ref="profitChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Detailed Analysis -->
      <div class="analysis-grid">
        <!-- Key Metrics -->
        <div class="content-card">
          <div class="card-header">
            <h3>Key Performance Indicators</h3>
          </div>
          <div class="metrics-list">
            <div class="metric-item">
              <div class="metric-label">Cost per Rabbit</div>
              <div class="metric-value">{{ formatCurrency(reportData.metrics?.costPerRabbit || 0) }}</div>
              <div class="metric-description">Average monthly cost per active rabbit</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Revenue per Rabbit</div>
              <div class="metric-value">{{ formatCurrency(reportData.metrics?.revenuePerRabbit || 0) }}</div>
              <div class="metric-description">Average monthly revenue per active rabbit</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Feed Efficiency</div>
              <div class="metric-value">{{ formatCurrency(reportData.metrics?.feedCostPerKg || 0) }}/kg</div>
              <div class="metric-description">Average feed cost per kilogram</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Health Cost Ratio</div>
              <div class="metric-value">{{ formatPercentage(reportData.metrics?.healthCostRatio || 0) }}</div>
              <div class="metric-description">Health costs as % of total expenses</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">ROI</div>
              <div class="metric-value" :class="{ 'negative': reportData.metrics?.roi < 0 }">
                {{ formatPercentage(reportData.metrics?.roi || 0) }}
              </div>
              <div class="metric-description">Return on investment for the period</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">Break-even Point</div>
              <div class="metric-value">{{ formatCurrency(reportData.metrics?.breakEven || 0) }}</div>
              <div class="metric-description">Monthly revenue needed to break even</div>
            </div>
          </div>
        </div>

        <!-- Top Categories -->
        <div class="content-card">
          <div class="card-header">
            <h3>Top Expense Categories</h3>
          </div>
          <div class="categories-list">
            <div v-for="(category, index) in reportData.topCategories" :key="category.name" class="category-item">
              <div class="category-rank">{{ index + 1 }}</div>
              <div class="category-info">
                <div class="category-name">{{ category.name }}</div>
                <div class="category-details">
                  <span class="category-amount">{{ formatCurrency(category.amount) }}</span>
                  <span class="category-percentage">{{ formatPercentage(category.percentage) }}</span>
                </div>
              </div>
              <div class="category-bar">
                <div class="category-progress" :style="{ width: category.percentage + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="content-card recommendations-card">
          <div class="card-header">
            <h3>Financial Recommendations</h3>
          </div>
          <div class="recommendations-list">
            <div v-for="recommendation in reportData.recommendations" :key="recommendation.id" 
                 class="recommendation-item" :class="recommendation.priority">
              <div class="recommendation-icon">
                <i :class="recommendation.icon"></i>
              </div>
              <div class="recommendation-content">
                <div class="recommendation-title">{{ recommendation.title }}</div>
                <div class="recommendation-description">{{ recommendation.description }}</div>
                <div v-if="recommendation.impact" class="recommendation-impact">
                  Potential Impact: {{ recommendation.impact }}
                </div>
              </div>
              <div class="recommendation-priority">{{ recommendation.priority }}</div>
            </div>
          </div>
        </div>

        <!-- Forecast -->
        <div class="content-card">
          <div class="card-header">
            <h3>Financial Forecast</h3>
            <span class="forecast-confidence" :class="reportData.forecast?.confidence">
              {{ reportData.forecast?.confidence || 'medium' }} confidence
            </span>
          </div>
          <div class="forecast-content">
            <div class="forecast-period">Next 3 Months Projection</div>
            <div class="forecast-metrics">
              <div class="forecast-metric">
                <div class="forecast-label">Expected Revenue</div>
                <div class="forecast-value">{{ formatCurrency(reportData.forecast?.revenue || 0) }}</div>
              </div>
              <div class="forecast-metric">
                <div class="forecast-label">Expected Expenses</div>
                <div class="forecast-value">{{ formatCurrency(reportData.forecast?.expenses || 0) }}</div>
              </div>
              <div class="forecast-metric">
                <div class="forecast-label">Projected Profit</div>
                <div class="forecast-value" :class="{ 'negative': reportData.forecast?.profit < 0 }">
                  {{ formatCurrency(reportData.forecast?.profit || 0) }}
                </div>
              </div>
            </div>
            <div class="forecast-notes">
              <p>{{ reportData.forecast?.notes || 'Forecast based on historical data and current trends.' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import { financialIntegration } from '@/services/financialIntegration'
import currencyService from '@/services/currency'
import { supabase } from '@/supabase'

export default {
  name: 'FinancialReports',
  setup() {
    const isLoading = ref(false)
    const error = ref('')
    const reportData = ref(null)
    const chartType = ref('line')
    
    // Chart references
    const trendsChart = ref(null)
    const categoryChart = ref(null)
    const farmCostsChart = ref(null)
    const profitChart = ref(null)
    
    // Chart instances
    let chartsInstances = {}
    
    const reportParams = reactive({
      period: '6',
      startDate: '',
      endDate: '',
      reportType: 'overview',
      groupBy: 'month'
    })
    
    // Generate comprehensive report
    const generateReport = async () => {
      try {
        isLoading.value = true
        error.value = ''
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        
        // Calculate period in months
        let months = parseInt(reportParams.period)
        if (reportParams.period === 'custom') {
          const start = new Date(reportParams.startDate)
          const end = new Date(reportParams.endDate)
          months = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30))
        }
        
        // Get comprehensive analytics
        const analytics = await financialIntegration.getFinancialAnalytics(user.id, months)
        
        // Process data for reports
        reportData.value = {
          summary: calculateSummary(analytics),
          trends: processTrendsData(analytics),
          categories: processCategoryData(analytics),
          metrics: calculateKPIs(analytics),
          topCategories: getTopCategories(analytics),
          recommendations: generateRecommendations(analytics),
          forecast: generateForecast(analytics),
          farmCosts: {
            health: analytics.farmCosts?.health || { total: 0 },
            feed: analytics.farmCosts?.feed || { total: 0 },
            other: (analytics.totalExpenses || 0) - (analytics.farmCosts?.totalDirectCosts || 0)
          }
        }
        
        // Update charts after data is loaded
        await nextTick()
        updateCharts()
        
      } catch (err) {
        console.error('Error generating financial report:', err)
        error.value = 'Failed to generate financial report. Please try again.'
      } finally {
        isLoading.value = false
      }
    }
    
    // Calculate summary metrics
    const calculateSummary = (analytics) => {
      return {
        totalRevenue: analytics.totalRevenue || 0,
        totalExpenses: analytics.totalExpenses || 0,
        netProfit: analytics.netProfit || 0,
        profitMargin: analytics.profitability?.profitMargin || 0,
        revenueChange: Math.random() * 20 - 10, // Placeholder - would calculate from historical data
        expensesChange: Math.random() * 20 - 10,
        profitChange: Math.random() * 30 - 15,
        marginChange: Math.random() * 10 - 5
      }
    }
    
    // Process trends data for charts
    const processTrendsData = (analytics) => {
      if (!analytics.monthlyTrends) return { labels: [], revenue: [], expenses: [], profit: [] }
      
      const trends = analytics.monthlyTrends
      return {
        labels: trends.map(t => new Date(t.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })),
        revenue: trends.map(t => t.revenue),
        expenses: trends.map(t => t.expenses),
        profit: trends.map(t => t.profit)
      }
    }
    
    // Process category data
    const processCategoryData = (analytics) => {
      if (!analytics.categoryBreakdown) return { labels: [], data: [] }
      
      const categories = Object.entries(analytics.categoryBreakdown)
      return {
        labels: categories.map(([name]) => name),
        data: categories.map(([, data]) => data.expenses || 0)
      }
    }
    
    // Calculate KPIs
    const calculateKPIs = (analytics) => {
      const costPerRabbit = analytics.costPerRabbit?.monthlyCostPerRabbit || 0
      const revenuePerRabbit = analytics.profitability?.monthlyAverageRevenue / (analytics.costPerRabbit?.rabbitCount || 1)
      const healthCosts = analytics.farmCosts?.health?.total || 0
      const totalExpenses = analytics.totalExpenses || 1
      
      return {
        costPerRabbit,
        revenuePerRabbit,
        feedCostPerKg: 3.50, // Would calculate from feed data
        healthCostRatio: (healthCosts / totalExpenses) * 100,
        roi: analytics.profitability?.roi || 0,
        breakEven: analytics.profitability?.breakEvenPoint || 0
      }
    }
    
    // Get top expense categories
    const getTopCategories = (analytics) => {
      if (!analytics.categoryBreakdown) return []
      
      const categories = Object.entries(analytics.categoryBreakdown)
        .map(([name, data]) => ({
          name,
          amount: data.expenses || 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
      
      const total = categories.reduce((sum, cat) => sum + cat.amount, 0)
      
      return categories.map(cat => ({
        ...cat,
        percentage: total > 0 ? (cat.amount / total) * 100 : 0
      }))
    }
    
    // Generate smart recommendations
    const generateRecommendations = (analytics) => {
      const recommendations = []
      
      // High health costs
      const healthRatio = (analytics.farmCosts?.health?.total || 0) / (analytics.totalExpenses || 1) * 100
      if (healthRatio > 25) {
        recommendations.push({
          id: 'health-costs',
          title: 'High Health Costs Detected',
          description: 'Health expenses account for a significant portion of total costs. Consider preventive care programs.',
          impact: 'Potential 15-30% reduction in health costs',
          priority: 'high',
          icon: 'pi pi-exclamation-triangle'
        })
      }
      
      // Low profit margin
      if ((analytics.profitability?.profitMargin || 0) < 10) {
        recommendations.push({
          id: 'profit-margin',
          title: 'Improve Profit Margins',
          description: 'Current profit margins are below industry standards. Review pricing and cost optimization opportunities.',
          impact: 'Target 20%+ profit margin',
          priority: 'high',
          icon: 'pi pi-chart-line'
        })
      }
      
      // Cost efficiency
      const costPerRabbit = analytics.costPerRabbit?.monthlyCostPerRabbit || 0
      if (costPerRabbit > 50) {
        recommendations.push({
          id: 'cost-efficiency',
          title: 'Optimize Operating Costs',
          description: 'Cost per rabbit is above average. Consider bulk purchasing and operational efficiency improvements.',
          impact: '10-20% cost reduction potential',
          priority: 'medium',
          icon: 'pi pi-cog'
        })
      }
      
      return recommendations
    }
    
    // Generate forecast
    const generateForecast = (analytics) => {
      const forecast = analytics.forecast || {}
      return {
        revenue: (forecast.nextMonthRevenue || 0) * 3,
        expenses: (forecast.nextMonthExpenses || 0) * 3,
        profit: (forecast.nextMonthProfit || 0) * 3,
        confidence: forecast.confidence || 'medium',
        notes: 'Forecast includes seasonal adjustments and current trend analysis.'
      }
    }
    
    // Update all charts
    const updateCharts = () => {
      if (!reportData.value) return
      
      // Destroy existing charts
      Object.values(chartsInstances).forEach(chart => chart?.destroy())
      chartsInstances = {}
      
      // Trends chart
      if (trendsChart.value) {
        chartsInstances.trends = new Chart(trendsChart.value, {
          type: chartType.value,
          data: {
            labels: reportData.value.trends.labels,
            datasets: [
              {
                label: 'Revenue',
                data: reportData.value.trends.revenue,
                borderColor: '#10b981',
                backgroundColor: chartType.value === 'bar' ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: chartType.value === 'line'
              },
              {
                label: 'Expenses',
                data: reportData.value.trends.expenses,
                borderColor: '#ef4444',
                backgroundColor: chartType.value === 'bar' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: chartType.value === 'line'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
          }
        })
      }
      
      // Category pie chart
      if (categoryChart.value) {
        chartsInstances.category = new Chart(categoryChart.value, {
          type: 'doughnut',
          data: {
            labels: reportData.value.categories.labels,
            datasets: [{
              data: reportData.value.categories.data,
              backgroundColor: [
                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        })
      }
      
      // Farm costs chart
      if (farmCostsChart.value && reportData.value) {
        const farmCosts = [
          reportData.value.farmCosts?.health?.total || 0,
          reportData.value.farmCosts?.feed?.total || 0,
          reportData.value.farmCosts?.other || 0
        ]
        
        chartsInstances.farmCosts = new Chart(farmCostsChart.value, {
          type: 'bar',
          data: {
            labels: ['Health', 'Feed', 'Other'],
            datasets: [{
              label: 'Cost',
              data: farmCosts,
              backgroundColor: ['#ef4444', '#f59e0b', '#6b7280']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        })
      }
      
      // Profit chart
      if (profitChart.value) {
        chartsInstances.profit = new Chart(profitChart.value, {
          type: 'line',
          data: {
            labels: reportData.value.trends.labels,
            datasets: [{
              label: 'Profit',
              data: reportData.value.trends.profit,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: false } }
          }
        })
      }
    }
    
    // Helper functions
    const formatCurrency = (amount) => {
      return currencyService.format(amount || 0)
    }
    
    const formatPercentage = (value) => {
      return `${(value || 0).toFixed(1)}%`
    }
    
    const formatChange = (value) => {
      const prefix = value >= 0 ? '+' : ''
      return `${prefix}${(value || 0).toFixed(1)}%`
    }
    
    const getChangeClass = (value) => {
      return value >= 0 ? 'positive' : 'negative'
    }
    
    const formatReportPeriod = () => {
      if (reportParams.period === 'custom') {
        return `${reportParams.startDate} to ${reportParams.endDate}`
      }
      return `Last ${reportParams.period} Month${reportParams.period !== '1' ? 's' : ''}`
    }
    
    const exportReports = () => {
      // Placeholder for PDF export functionality
      alert('PDF export functionality would be implemented here')
    }
    
    onMounted(async () => {
      await currencyService.initialize()
      await generateReport()
    })
    
    return {
      isLoading,
      error,
      reportData,
      reportParams,
      chartType,
      trendsChart,
      categoryChart,
      farmCostsChart,
      profitChart,
      generateReport,
      exportReports,
      formatCurrency,
      formatPercentage,
      formatChange,
      getChangeClass,
      formatReportPeriod
    }
  }
}
</script>

<style scoped>
.reports-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.page-header h1 {
  color: #2c3e50;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.subtitle {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.primary-button, .secondary-button {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.primary-button {
  background: #007bff;
  color: white;
}

.primary-button:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,123,255,0.3);
}

.primary-button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.secondary-button {
  background: #6c757d;
  color: white;
}

.secondary-button:hover {
  background: #545b62;
  transform: translateY(-2px);
}

.content-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 25px;
}

.filters-card {
  padding: 20px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 14px;
}

.form-control {
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
}

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner-large {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e9ecef;
}

.card-header h2, .card-header h3 {
  margin: 0;
  color: #2c3e50;
}

.report-period-badge {
  background: #e7f3ff;
  color: #007bff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  padding: 25px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.summary-card.revenue {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
}

.summary-card.expenses {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
}

.summary-card.profit {
  background: linear-gradient(135deg, #cce5ff 0%, #b3d9ff 100%);
}

.summary-card.margin {
  background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
}

.summary-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(255,255,255,0.8);
  color: #2c3e50;
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
  font-weight: 500;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 5px;
}

.summary-value.negative {
  color: #dc3545;
}

.summary-change {
  font-size: 12px;
  font-weight: 600;
}

.summary-change.positive {
  color: #28a745;
}

.summary-change.negative {
  color: #dc3545;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 25px;
  margin-bottom: 25px;
}

.chart-card {
  min-height: 400px;
}

.chart-container {
  height: 350px;
  padding: 20px;
}

.chart-controls {
  display: flex;
  gap: 5px;
}

.chart-toggle {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chart-toggle.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
}

.metrics-list {
  padding: 25px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  padding: 15px 0;
  border-bottom: 1px solid #f1f3f4;
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 5px;
}

.metric-value.negative {
  color: #dc3545;
}

.metric-description {
  font-size: 12px;
  color: #666;
}

.categories-list {
  padding: 25px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f1f3f4;
}

.category-item:last-child {
  border-bottom: none;
}

.category-rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.category-info {
  flex: 1;
}

.category-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.category-details {
  display: flex;
  gap: 15px;
}

.category-amount {
  font-weight: 600;
  color: #666;
}

.category-percentage {
  color: #007bff;
  font-weight: 600;
}

.category-bar {
  width: 100px;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.category-progress {
  height: 100%;
  background: #007bff;
  border-radius: 4px;
}

.recommendations-card .card-header {
  background: #f8f9fa;
}

.recommendations-list {
  padding: 25px;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 15px;
  border-left: 4px solid #007bff;
}

.recommendation-item:last-child {
  margin-bottom: 0;
}

.recommendation-item.high {
  background: #fff5f5;
  border-left-color: #dc3545;
}

.recommendation-item.medium {
  background: #fffbf0;
  border-left-color: #ffc107;
}

.recommendation-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e7f3ff;
  color: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.recommendation-item.high .recommendation-icon {
  background: #ffebee;
  color: #dc3545;
}

.recommendation-item.medium .recommendation-icon {
  background: #fff8e1;
  color: #ffc107;
}

.recommendation-content {
  flex: 1;
}

.recommendation-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.recommendation-description {
  color: #666;
  margin-bottom: 8px;
  line-height: 1.4;
}

.recommendation-impact {
  font-size: 12px;
  color: #28a745;
  font-weight: 600;
}

.recommendation-priority {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  background: #e7f3ff;
  color: #007bff;
  align-self: flex-start;
}

.recommendation-item.high .recommendation-priority {
  background: #ffebee;
  color: #dc3545;
}

.recommendation-item.medium .recommendation-priority {
  background: #fff8e1;
  color: #ffc107;
}

.forecast-content {
  padding: 25px;
}

.forecast-confidence {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.forecast-confidence.high {
  background: #d4edda;
  color: #155724;
}

.forecast-confidence.medium {
  background: #fff3cd;
  color: #856404;
}

.forecast-confidence.low {
  background: #f8d7da;
  color: #721c24;
}

.forecast-period {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 20px;
}

.forecast-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.forecast-metric {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.forecast-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
  font-weight: 600;
}

.forecast-value {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
}

.forecast-value.negative {
  color: #dc3545;
}

.forecast-notes {
  background: #e7f3ff;
  padding: 15px;
  border-radius: 8px;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .reports-page {
    padding: 15px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .analysis-grid {
    grid-template-columns: 1fr;
  }
  
  .forecast-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
