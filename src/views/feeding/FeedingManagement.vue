<template>
  <div class="feeding-page">
    <div class="page-header">
      <div>
        <h1>Feeding Management</h1>
        <p class="subtitle">Track and manage feeding schedules and consumption</p>
      </div>
      <div class="header-actions">
        <router-link to="/feeding/schedule" class="secondary-button">
          <i class="pi pi-calendar"></i>
          Schedule
        </router-link>
        <router-link to="/feeding/records" class="secondary-button">
          <i class="pi pi-list"></i>
          Feed Records
        </router-link>
        <router-link to="/feeding/add-record" class="primary-button">
          <i class="pi pi-plus"></i>
          Add Feed Record
        </router-link>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon consumption-icon">
          <i class="mdi mdi-food-variant"></i>
        </div>
        <div class="stat-content">
          <h3>Daily Consumption</h3>
          <div v-if="consumptionLoading" class="stat-loading">
            <i class="pi pi-spinner pi-spin"></i> Loading...
          </div>
          <div v-else-if="consumptionError" class="stat-error">
            Error loading data
          </div>
          <div v-else class="stat-value">
            {{ dailyConsumption > 0 ? dailyConsumption : '0' }} kg
          </div>
          <p v-if="!consumptionLoading && !consumptionError" class="stat-note">
            {{ dailyConsumption > 0 ? 'Average (last 30 days)' : 'No consumption records' }}
          </p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon stock-icon" :class="{
          'critical': totalStockData.daysRemaining <= 3,
          'low': totalStockData.daysRemaining > 3 && totalStockData.daysRemaining <= 7,
          'good': totalStockData.daysRemaining > 7
        }">
          <i class="pi pi-box"></i>
        </div>
        <div class="stat-content">
          <h3>Total Stock Level</h3>
          <div v-if="stockLoading" class="stat-loading">
            <i class="pi pi-spinner pi-spin"></i> Loading...
          </div>
          <div v-else-if="stockError" class="stat-error">
            Error loading data
          </div>
          <div v-else class="stat-value">
            {{ totalStockData.currentStock }} kg
          </div>
          <p v-if="!stockLoading && !stockError" class="stat-note" :class="{
            'critical': totalStockData.daysRemaining <= 3,
            'warning': totalStockData.daysRemaining > 3 && totalStockData.daysRemaining <= 7,
            'good': totalStockData.daysRemaining > 7
          }">
            {{ formatStockNote() }}
          </p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon cost-icon">
          <CurrencyIcon size="large" />
        </div>
        <div class="stat-content">
          <h3>Monthly Cost</h3>
          <div v-if="costLoading" class="stat-loading">
            <i class="pi pi-spinner pi-spin"></i> Loading...
          </div>
          <div v-else-if="costError" class="stat-error">
            Error loading data
          </div>
          <div v-else class="stat-value">
            {{ monthlyCost }}
          </div>
          <p v-if="!costLoading && !costError" class="stat-note cost-note">
            {{ monthlyCostData.isEstimated ? 'Estimated (last 30 days)' : 'Actual costs (last 30 days)' }}
          </p>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="content-card">
        <div class="card-header">
          <h2>Feeding Schedule</h2>
          <router-link to="/feeding/schedule" class="card-action-btn">
            <i class="pi pi-calendar"></i>
            View All
          </router-link>
        </div>
        
        <!-- Loading State -->
        <div v-if="loading" class="schedule-loading">
          <i class="pi pi-spinner pi-spin"></i>
          <span>Loading schedules...</span>
        </div>
        
        <!-- Error State -->
        <div v-if="error" class="schedule-error">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>
        
        <!-- Empty State -->
        <div v-if="!loading && !error && upcomingSchedules.length === 0" class="schedule-empty">
          <i class="pi pi-calendar-plus"></i>
          <p>No active schedules found</p>
          <router-link to="/feeding/schedule/add" class="empty-action-btn">
            Create Your First Schedule
          </router-link>
        </div>
        
        <!-- Schedule List -->
        <div v-if="!loading && !error && upcomingSchedules.length > 0" class="schedule-list">
          <div 
            v-for="schedule in upcomingSchedules" 
            :key="schedule.id"
            class="schedule-item"
          >
            <div class="time-slot">
              <span class="time">{{ formatTime(schedule.time) }}</span>
              <span class="date">{{ schedule.frequency }}</span>
            </div>
            <div class="schedule-details">
              <h4>{{ schedule.name }}</h4>
              <p>{{ formatFeedType(schedule.feed_type) }}{{ schedule.sections ? ' - ' + schedule.sections : '' }}</p>
              <div v-if="schedule.amount" class="amount-info">
                {{ schedule.amount }} {{ schedule.amount_unit || 'kg' }}
              </div>
            </div>
            <div class="schedule-status" :class="getScheduleStatus(schedule).class">
              <i class="pi" :class="{
                'pi-check-circle': getScheduleStatus(schedule).class === 'completed',
                'pi-clock': getScheduleStatus(schedule).class === 'due-soon',
                'pi-exclamation-triangle': getScheduleStatus(schedule).class === 'overdue',
                'pi-pause': getScheduleStatus(schedule).class === 'inactive',
                'pi-play': getScheduleStatus(schedule).class === 'active'
              }"></i>
              <span>{{ getScheduleStatus(schedule).text }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="content-card">
        <div class="card-header">
          <h2>Feed Stock</h2>
          <router-link to="/feeding/records" class="card-action-btn">
            <i class="pi pi-list"></i>
            View All Records
          </router-link>
        </div>
        
        <!-- Loading State -->
        <div v-if="stockLoading" class="stock-loading">
          <i class="pi pi-spinner pi-spin"></i>
          <span>Loading stock data...</span>
        </div>
        
        <!-- Error State -->
        <div v-if="stockError" class="stock-error">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ stockError }}</span>
        </div>
        
        <!-- Empty State -->
        <div v-if="!stockLoading && !stockError && feedStock.length === 0" class="stock-empty">
          <i class="pi pi-box"></i>
          <p>No feed stock records found</p>
          <router-link to="/feeding/add-record" class="empty-action-btn">
            Add Your First Feed Record
          </router-link>
        </div>
        
        <!-- Stock List -->
        <div v-if="!stockLoading && !stockError && feedStock.length > 0" class="stock-list">
          <div 
            v-for="stock in feedStock.slice(0, 3)" 
            :key="`${stock.feed_type}_${stock.feed_brand}`"
            class="stock-item"
          >
            <div class="stock-info">
              <h4>{{ formatFeedType(stock.feed_type) }}</h4>
              <p>{{ stock.feed_brand }}</p>
              <div class="stock-details">
                <span class="current-amount">{{ stock.current_stock }} kg remaining</span>
                <span class="days-remaining">{{ getDaysRemaining(stock) }} days left</span>
              </div>
            </div>
            <div class="stock-level">
              <div class="progress-bar">
                <div 
                  class="progress" 
                  :class="getStockLevel(stock).class"
                  :style="{ width: getStockPercentage(stock) + '%' }"
                ></div>
              </div>
              <span 
                class="stock-percentage"
                :class="getStockLevel(stock).class"
              >
                {{ getStockPercentage(stock) }}% remaining
              </span>
              <div class="stock-status" :class="getStockLevel(stock).class">
                {{ getStockLevel(stock).text }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Feeding Events -->
    <UpcomingEventsWidget :limit="5" :event-types="['feeding']" />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import currencyService from '@/services/currency'
import { supabase } from '@/supabase'
import UpcomingEventsWidget from '@/components/UpcomingEventsWidget.vue'
import CurrencyIcon from '@/components/CurrencyIcon.vue'

export default {
  name: 'FeedingManagement',
  components: {
    UpcomingEventsWidget,
    CurrencyIcon
  },
  setup() {
    const monthlyCost = ref('$0')
    const upcomingSchedules = ref([])
    const feedStock = ref([])
    const dailyConsumption = ref(0)
    const totalStockData = reactive({
      currentStock: 0,
      daysRemaining: 0,
      stockStatus: 'unknown'
    })
    const monthlyCostData = reactive({
      totalCost: 0,
      breakdown: {},
      isEstimated: true
    })
    const loading = ref(true)
    const stockLoading = ref(true)
    const consumptionLoading = ref(true)
    const costLoading = ref(true)
    const error = ref(null)
    const stockError = ref(null)
    const consumptionError = ref(null)
    const costError = ref(null)

    const formatCurrency = (amount) => {
      return currencyService.format(amount)
    }

    const formatTime = (time) => {
      if (!time) return 'Not set'
      // Convert time to readable format
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minutes} ${ampm}`
    }

    const formatFeedType = (feedType) => {
      const feedTypes = {
        adult_rabbit_feed: 'Adult rabbits',
        growing_rabbit_feed: 'Growing rabbits',
        breeding_rabbit_feed: 'Breeding rabbits',
        hay: 'Hay',
        supplements: 'Supplements'
      }
      return feedTypes[feedType] || feedType
    }

    const getScheduleStatus = (schedule) => {
      if (!schedule.is_active) return { class: 'inactive', text: 'Inactive' }
      
      if (schedule.next_due_at) {
        const now = new Date()
        const dueTime = new Date(schedule.next_due_at)
        const hoursDiff = (dueTime - now) / (1000 * 60 * 60)
        
        if (hoursDiff < 0) return { class: 'overdue', text: 'Overdue' }
        if (hoursDiff < 2) return { class: 'due-soon', text: 'Due Soon' }
      }
      
      return { class: 'active', text: 'Active' }
    }

    const getStockLevel = (stock) => {
      const percentage = (stock.current_stock / stock.initial_stock) * 100
      if (percentage <= 20) return { class: 'critical', text: 'Critical' }
      if (percentage <= 35) return { class: 'low', text: 'Low' }
      if (percentage <= 60) return { class: 'medium', text: 'Medium' }
      return { class: 'good', text: 'Good' }
    }

    const getStockPercentage = (stock) => {
      if (!stock.initial_stock || stock.initial_stock === 0) return 0
      return Math.round((stock.current_stock / stock.initial_stock) * 100)
    }

    const getDaysRemaining = (stock, dailyConsumption = 2) => {
      if (!stock.current_stock || stock.current_stock <= 0) return 0
      return Math.round(stock.current_stock / dailyConsumption)
    }

    const formatStockNote = () => {
      if (totalStockData.currentStock <= 0) {
        return 'No stock available'
      }
      
      if (totalStockData.daysRemaining <= 0) {
        return 'Stock depleted'
      } else if (totalStockData.daysRemaining <= 3) {
        return `${totalStockData.daysRemaining} day${totalStockData.daysRemaining === 1 ? '' : 's'} remaining - Critical!`
      } else if (totalStockData.daysRemaining <= 7) {
        return `${totalStockData.daysRemaining} days remaining - Running low`
      } else if (totalStockData.daysRemaining <= 14) {
        return `${totalStockData.daysRemaining} days remaining`
      } else {
        return `${totalStockData.daysRemaining} days remaining - Good stock`
      }
    }

    // Average market rates per kg (you can adjust these based on your local prices)
    const feedCostRates = {
      adult_rabbit_feed: 2.50,     // $2.50 per kg
      growing_rabbit_feed: 2.75,   // $2.75 per kg  
      breeding_rabbit_feed: 3.00,  // $3.00 per kg
      hay: 1.25,                   // $1.25 per kg
      supplements: 8.00            // $8.00 per kg
    }

    const loadScheduleData = async () => {
      try {
        loading.value = true
        error.value = null

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Load upcoming schedules for today
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('feeding_schedules')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .eq('is_active', true)
          .order('time', { ascending: true })
          .limit(5)

        if (scheduleError) throw scheduleError
        upcomingSchedules.value = scheduleData || []

      } catch (err) {
        error.value = err.message
        console.error('Error loading schedule data:', err)
      } finally {
        loading.value = false
      }
    }

    const loadStockData = async () => {
      try {
        stockLoading.value = true
        stockError.value = null

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Get feed stock data by calculating purchases vs consumption
        const { data: stockData, error: stockDataError } = await supabase
          .from('feed_records')
          .select(`
            feed_type,
            feed_brand,
            record_type,
            amount,
            date
          `)
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('date', { ascending: false })

        if (stockDataError) throw stockDataError

        // Process stock data by feed type
        const stockSummary = {}
        
        if (stockData) {
          stockData.forEach(record => {
            const key = `${record.feed_type}_${record.feed_brand || 'Generic'}`
            
            if (!stockSummary[key]) {
              stockSummary[key] = {
                feed_type: record.feed_type,
                feed_brand: record.feed_brand || 'Generic Brand',
                purchased: 0,
                consumed: 0,
                current_stock: 0,
                initial_stock: 0,
                last_updated: record.date
              }
            }
            
            if (record.record_type === 'stock_update') {
              stockSummary[key].purchased += parseFloat(record.amount || 0)
            } else if (record.record_type === 'consumption') {
              stockSummary[key].consumed += parseFloat(record.amount || 0)
            }
          })
        }

        // Calculate current stock and format for display
        const formattedStock = Object.values(stockSummary).map(stock => {
          stock.initial_stock = stock.purchased
          stock.current_stock = stock.purchased - stock.consumed
          
          // Ensure non-negative stock
          if (stock.current_stock < 0) stock.current_stock = 0
          
          return stock
        }).filter(stock => stock.initial_stock > 0) // Only show feeds that have been purchased

        // If no real stock data, show empty state (no sample data)
        // This ensures users only see their own data

        feedStock.value = formattedStock

        // Calculate total stock across all feed types
        const totalCurrentStock = formattedStock.reduce((sum, stock) => {
          return sum + parseFloat(stock.current_stock || 0)
        }, 0)

        totalStockData.currentStock = Math.round(totalCurrentStock * 100) / 100

        // Calculate days remaining using daily consumption
        if (dailyConsumption.value > 0) {
          totalStockData.daysRemaining = Math.round(totalCurrentStock / dailyConsumption.value)
        } else {
          // Use default consumption rate if no consumption data
          totalStockData.daysRemaining = Math.round(totalCurrentStock / 2)
        }

        // Set stock status
        if (totalStockData.daysRemaining <= 3) {
          totalStockData.stockStatus = 'critical'
        } else if (totalStockData.daysRemaining <= 7) {
          totalStockData.stockStatus = 'low'
        } else {
          totalStockData.stockStatus = 'good'
        }

      } catch (err) {
        stockError.value = err.message
        console.error('Error loading stock data:', err)
        
        // No fallback sample data - show empty state instead
        feedStock.value = []
      } finally {
        stockLoading.value = false
      }
    }

    const loadConsumptionData = async () => {
      try {
        consumptionLoading.value = true
        consumptionError.value = null

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Get consumption records for the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: consumptionData, error: consumptionDataError } = await supabase
          .from('feed_records')
          .select('amount, date')
          .eq('user_id', user.id)
          .eq('record_type', 'consumption')
          .eq('is_deleted', false)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false })

        if (consumptionDataError) throw consumptionDataError

        // Calculate daily average
        if (consumptionData && consumptionData.length > 0) {
          const totalConsumption = consumptionData.reduce((sum, record) => {
            return sum + parseFloat(record.amount || 0)
          }, 0)

          // Get unique days with consumption
          const uniqueDays = new Set(consumptionData.map(record => record.date))
          const daysWithData = uniqueDays.size

          if (daysWithData > 0) {
            dailyConsumption.value = Math.round((totalConsumption / daysWithData) * 100) / 100
          } else {
            dailyConsumption.value = 0
          }
        } else {
          dailyConsumption.value = 0
        }

      } catch (err) {
        consumptionError.value = err.message
        console.error('Error loading consumption data:', err)
        dailyConsumption.value = 0 // fallback
      } finally {
        consumptionLoading.value = false
      }
    }

    const loadMonthlyCostData = async () => {
      try {
        costLoading.value = true
        costError.value = null

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        // Get both consumption and stock update records for the last 30 days to calculate costs
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // Get consumption records with cost data
        const { data: consumptionData, error: consumptionError } = await supabase
          .from('feed_records')
          .select('feed_type, feed_brand, amount, cost_per_kg, total_cost, date')
          .eq('user_id', user.id)
          .eq('record_type', 'consumption')
          .eq('is_deleted', false)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

        if (consumptionError) throw consumptionError

        // Get recent stock purchases to get average cost per kg for records without cost data
        const { data: stockData, error: stockError } = await supabase
          .from('feed_records')
          .select('feed_type, feed_brand, amount, cost_per_kg, total_cost, date')
          .eq('user_id', user.id)
          .eq('record_type', 'stock_update')
          .eq('is_deleted', false)
          .not('cost_per_kg', 'is', null)
          .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 90 days
          .order('date', { ascending: false })

        if (stockError) throw stockError

        // Create lookup for average costs per feed type from recent purchases
        const averageCosts = {}
        if (stockData) {
          const costGroups = {}
          stockData.forEach(record => {
            const key = `${record.feed_type}_${record.feed_brand || 'generic'}`
            if (record.cost_per_kg) {
              if (!costGroups[key]) {
                costGroups[key] = []
              }
              costGroups[key].push(parseFloat(record.cost_per_kg))
            }
          })

          // Calculate averages
          Object.keys(costGroups).forEach(key => {
            const costs = costGroups[key]
            averageCosts[key] = costs.reduce((sum, cost) => sum + cost, 0) / costs.length
          })
        }

        // Calculate monthly cost by feed type
        const breakdown = {}
        let totalMonthlyCost = 0
        let hasActualCostData = false

        if (consumptionData && consumptionData.length > 0) {
          consumptionData.forEach(record => {
            const feedType = record.feed_type
            const feedBrand = record.feed_brand || 'generic'
            const amount = parseFloat(record.amount || 0)
            const key = `${feedType}_${feedBrand}`
            
            if (!breakdown[feedType]) {
              breakdown[feedType] = {
                amount: 0,
                cost: 0,
                hasActualCost: false,
                brands: {}
              }
            }

            let recordCost = 0

            // Use actual cost data if available
            if (record.total_cost) {
              recordCost = parseFloat(record.total_cost)
              breakdown[feedType].hasActualCost = true
              hasActualCostData = true
            } else if (record.cost_per_kg) {
              recordCost = amount * parseFloat(record.cost_per_kg)
              breakdown[feedType].hasActualCost = true
              hasActualCostData = true
            } else if (averageCosts[key]) {
              // Use average cost from recent purchases
              recordCost = amount * averageCosts[key]
              breakdown[feedType].hasActualCost = true
              hasActualCostData = true
            } else {
              // Fallback to estimated rates
              recordCost = amount * (feedCostRates[feedType] || 2.50)
            }
            
            breakdown[feedType].amount += amount
            breakdown[feedType].cost += recordCost

            // Track by brand
            if (!breakdown[feedType].brands[feedBrand]) {
              breakdown[feedType].brands[feedBrand] = { amount: 0, cost: 0 }
            }
            breakdown[feedType].brands[feedBrand].amount += amount
            breakdown[feedType].brands[feedBrand].cost += recordCost
          })

          // Calculate total
          totalMonthlyCost = Object.values(breakdown).reduce((sum, item) => sum + item.cost, 0)
        }

        // If no consumption data, estimate based on daily consumption and average purchase costs
        if (totalMonthlyCost === 0 && dailyConsumption.value > 0) {
          // Use average cost from recent purchases if available
          const recentAverageCost = stockData && stockData.length > 0 
            ? stockData.reduce((sum, record) => sum + parseFloat(record.cost_per_kg || 0), 0) / stockData.length
            : 2.50

          totalMonthlyCost = dailyConsumption.value * 30 * recentAverageCost
          
          breakdown.estimated = {
            amount: dailyConsumption.value * 30,
            cost: totalMonthlyCost,
            rate: recentAverageCost,
            hasActualCost: stockData && stockData.length > 0
          }
        }

        monthlyCostData.totalCost = Math.round(totalMonthlyCost * 100) / 100
        monthlyCostData.breakdown = breakdown
        monthlyCostData.isEstimated = !hasActualCostData

        // Format for display
        monthlyCost.value = formatCurrency(monthlyCostData.totalCost)

      } catch (err) {
        costError.value = err.message
        console.error('Error loading monthly cost data:', err)
        
        // Fallback calculation using estimated rates
        if (dailyConsumption.value > 0) {
          const fallbackCost = dailyConsumption.value * 30 * 2.50
          monthlyCost.value = formatCurrency(fallbackCost)
          monthlyCostData.isEstimated = true
        } else {
          monthlyCost.value = formatCurrency(0)
        }
      } finally {
        costLoading.value = false
      }
    }

    onMounted(async () => {
      try {
        await currencyService.initialize()
      } catch (error) {
        console.error('Error initializing currency service:', error)
      }
      
      // Load all data in parallel
      await Promise.all([
        loadScheduleData(),
        loadStockData(),
        loadConsumptionData()
      ])

      // Load cost data after consumption data is loaded
      await loadMonthlyCostData()
    })

    return {
      monthlyCost,
      upcomingSchedules,
      feedStock,
      dailyConsumption,
      totalStockData,
      monthlyCostData,
      loading,
      stockLoading,
      consumptionLoading,
      costLoading,
      error,
      stockError,
      consumptionError,
      costError,
      formatCurrency,
      formatTime,
      formatFeedType,
      getScheduleStatus,
      getStockLevel,
      getStockPercentage,
      getDaysRemaining,
      formatStockNote
    }
  }
}
</script>

<style scoped>
.feeding-page {
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
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.consumption-icon {
  background: #fef2f2;
  color: #dc2626;
}

.stat-icon.stock-icon.good {
  background: #f0fdf4;
  color: #16a34a;
}

.stat-icon.stock-icon.low {
  background: #fff7ed;
  color: #ea580c;
}

.stat-icon.stock-icon.critical {
  background: #fef2f2;
  color: #dc2626;
}

.stat-icon.cost-icon {
  background: #f0f9ff;
  color: #0369a1;
}

.stat-icon .currency-icon {
  font-size: inherit;
  width: auto;
  height: auto;
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

.stat-note {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.stat-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0.5rem 0;
}

.stat-loading i {
  font-size: 1rem;
}

.stat-error {
  font-size: 0.875rem;
  color: #dc2626;
  margin: 0.5rem 0;
}

.stat-note.good {
  color: #16a34a;
}

.stat-note.warning {
  color: #ea580c;
}

.stat-note.critical {
  color: #dc2626;
  font-weight: 600;
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

.card-action-btn {
  text-decoration: none;
}

.card-action-btn:hover {
  background: #f1f5f9;
}

.schedule-loading,
.schedule-error,
.schedule-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #64748b;
}

.schedule-loading i,
.schedule-error i,
.schedule-empty i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.schedule-error {
  color: #dc2626;
}

.schedule-error i {
  color: #fbbf24;
}

.empty-action-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: background 0.3s ease;
}

.empty-action-btn:hover {
  background: #2563eb;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.time-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.time {
  font-weight: 600;
  color: #1e293b;
}

.date {
  font-size: 0.875rem;
  color: #64748b;
}

.schedule-details {
  flex: 1;
}

.schedule-details h4 {
  margin: 0;
  color: #1e293b;
}

.schedule-details p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.schedule-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.schedule-status.completed {
  color: #10b981;
}

.schedule-status.pending,
.schedule-status.due-soon {
  color: #f59e0b;
}

.schedule-status.active {
  color: #10b981;
}

.schedule-status.overdue {
  color: #ef4444;
}

.schedule-status.inactive {
  color: #6b7280;
}

.amount-info {
  font-size: 0.75rem;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
  margin-top: 0.25rem;
}

.stock-loading,
.stock-error,
.stock-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #64748b;
}

.stock-loading i,
.stock-error i,
.stock-empty i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stock-error {
  color: #dc2626;
}

.stock-error i {
  color: #fbbf24;
}

.stock-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stock-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stock-info h4 {
  margin: 0;
  color: #1e293b;
}

.stock-info p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.stock-details {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.current-amount,
.days-remaining {
  font-size: 0.75rem;
  color: #9ca3af;
  background: #f8fafc;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.days-remaining.critical {
  background: #fef2f2;
  color: #dc2626;
}

.stock-level {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  height: 10px;
  background: #e2e8f0;
  border-radius: 5px;
  overflow: hidden;
}

.progress {
  height: 100%;
  border-radius: 5px;
  transition: all 0.3s ease;
}

.progress.good {
  background: #10b981;
}

.progress.medium {
  background: #3b82f6;
}

.progress.low {
  background: #f59e0b;
}

.progress.critical {
  background: #ef4444;
}

.stock-percentage {
  font-size: 0.875rem;
  font-weight: 500;
}

.stock-percentage.good {
  color: #10b981;
}

.stock-percentage.medium {
  color: #3b82f6;
}

.stock-percentage.low {
  color: #f59e0b;
}

.stock-percentage.critical {
  color: #ef4444;
}

.stock-status {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stock-status.good {
  color: #10b981;
}

.stock-status.medium {
  color: #3b82f6;
}

.stock-status.low {
  color: #f59e0b;
}

.stock-status.critical {
  color: #ef4444;
}

@media (max-width: 768px) {
  .stats-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .schedule-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .time-slot {
    min-width: auto;
  }
}
</style> 