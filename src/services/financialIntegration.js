import { supabase } from '@/supabase'

/**
 * Financial Integration Service
 * Automatically creates financial transactions from farm activities
 * and provides comprehensive financial analytics
 */
export class FinancialIntegrationService {
  constructor() {
    this.supabase = supabase
  }

  /**
   * Create financial transaction from health record costs
   * @param {Object} healthRecord - The health record with cost information
   * @param {string} userId - The user ID
   */
  async createHealthExpenseTransaction(healthRecord, userId) {
    if (!healthRecord.cost || healthRecord.cost <= 0) {
      return null
    }

    try {
      const transactionData = {
        type: 'expense',
        amount: parseFloat(healthRecord.cost),
        description: `Health: ${healthRecord.condition || 'Treatment'} - ${healthRecord.rabbit_name || 'Rabbit Care'}`,
        date: healthRecord.record_date,
        category: 'Veterinary & Health',
        reference: `health_record_${healthRecord.id}`,
        notes: this.buildHealthTransactionNotes(healthRecord),
        user_id: userId
      }

      const { data, error } = await this.supabase
        .from('transactions')
        .insert([transactionData])
        .select()

      if (error) throw error
      
      console.log('Created health expense transaction:', data[0])
      return data[0]
    } catch (error) {
      console.error('Failed to create health expense transaction:', error)
      throw error
    }
  }

  /**
   * Create financial transaction from feed purchase
   * @param {Object} feedRecord - The feed record with cost information
   * @param {string} userId - The user ID
   */
  async createFeedExpenseTransaction(feedRecord, userId) {
    if (!feedRecord.total_cost || feedRecord.total_cost <= 0) {
      return null
    }

    try {
      const transactionData = {
        type: 'expense',
        amount: parseFloat(feedRecord.total_cost),
        description: `Feed Purchase: ${feedRecord.feed_brand} ${feedRecord.feed_type.replace(/_/g, ' ')}`,
        date: feedRecord.date,
        category: 'Feed & Supplies',
        reference: `feed_record_${feedRecord.id}`,
        notes: this.buildFeedTransactionNotes(feedRecord),
        user_id: userId
      }

      const { data, error } = await this.supabase
        .from('transactions')
        .insert([transactionData])
        .select()

      if (error) throw error
      
      console.log('Created feed expense transaction:', data[0])
      return data[0]
    } catch (error) {
      console.error('Failed to create feed expense transaction:', error)
      throw error
    }
  }

  /**
   * Create revenue transaction from rabbit sale
   * @param {Object} saleData - Sale information
   * @param {string} userId - The user ID
   */
  async createRabbitSaleTransaction(saleData, userId) {
    try {
      const transactionData = {
        type: 'revenue',
        amount: parseFloat(saleData.sale_price),
        description: `Rabbit Sale: ${saleData.rabbit_name} (${saleData.breed})`,
        date: saleData.sale_date,
        category: 'Livestock Sales',
        reference: `rabbit_sale_${saleData.rabbit_id}`,
        notes: this.buildSaleTransactionNotes(saleData),
        user_id: userId
      }

      const { data, error } = await this.supabase
        .from('transactions')
        .insert([transactionData])
        .select()

      if (error) throw error
      
      console.log('Created rabbit sale transaction:', data[0])
      return data[0]
    } catch (error) {
      console.error('Failed to create rabbit sale transaction:', error)
      throw error
    }
  }

  /**
   * Get comprehensive financial analytics
   * @param {string} userId - The user ID
   * @param {number} months - Number of months to analyze (default: 12)
   */
  async getFinancialAnalytics(userId, months = 12) {
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)
      const startDateStr = startDate.toISOString().split('T')[0]

      // Get all transactions for the period
      const { data: transactions, error: transError } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .gte('date', startDateStr)
        .order('date', { ascending: true })

      if (transError) throw transError

      // Calculate analytics
      const analytics = this.calculateFinancialAnalytics(transactions)
      
      // Get farm activity costs
      const farmCosts = await this.getFarmActivityCosts(userId, startDateStr)
      
      // Combine with farm-specific metrics
      return {
        ...analytics,
        farmCosts,
        costPerRabbit: await this.calculateCostPerRabbit(userId, startDateStr),
        profitability: await this.calculateProfitabilityMetrics(userId, startDateStr),
        forecast: this.generateFinancialForecast(transactions)
      }
    } catch (error) {
      console.error('Failed to get financial analytics:', error)
      throw error
    }
  }

  /**
   * Calculate cost per rabbit analytics
   * @param {string} userId - The user ID
   * @param {string} startDate - Start date for calculations
   */
  async calculateCostPerRabbit(userId, startDate) {
    try {
      // Get current rabbit count
      const { data: rabbits, error: rabbitError } = await this.supabase
        .from('rabbits')
        .select('id')
        .eq('created_by', userId)
        .eq('status', 'active')
        .or('is_deleted.is.null,is_deleted.eq.false')

      if (rabbitError) {
        console.error('Rabbit query error:', rabbitError)
        // Return default values instead of throwing
        return {
          rabbitCount: 1,
          totalExpenses: 0,
          costPerRabbit: 0,
          monthlyExpenses: 0,
          monthlyCostPerRabbit: 0
        }
      }

      const rabbitCount = rabbits?.length || 1 // Avoid division by zero

      // Get total expenses for the period
      const { data: expenses, error: expenseError } = await this.supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .eq('is_deleted', false)
        .gte('date', startDate)

      if (expenseError) throw expenseError

      const totalExpenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0

      return {
        rabbitCount,
        totalExpenses,
        costPerRabbit: totalExpenses / rabbitCount,
        monthlyExpenses: totalExpenses / 12,
        monthlyCostPerRabbit: (totalExpenses / 12) / rabbitCount
      }
    } catch (error) {
      console.error('Failed to calculate cost per rabbit:', error)
      return {
        rabbitCount: 0,
        totalExpenses: 0,
        costPerRabbit: 0,
        monthlyExpenses: 0,
        monthlyCostPerRabbit: 0
      }
    }
  }

  /**
   * Get farm activity costs breakdown
   * @param {string} userId - The user ID
   * @param {string} startDate - Start date for calculations
   */
  async getFarmActivityCosts(userId, startDate) {
    try {
      // Health costs
      const { data: healthCosts, error: healthError } = await this.supabase
        .from('health_records')
        .select('cost, record_date, condition, treatment_type')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .gte('record_date', startDate)
        .not('cost', 'is', null)

      if (healthError) throw healthError

      // Feed costs
      const { data: feedCosts, error: feedError } = await this.supabase
        .from('feed_records')
        .select('total_cost, date, feed_type, feed_brand')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .gte('date', startDate)
        .not('total_cost', 'is', null)

      if (feedError) throw feedError

      const totalHealthCosts = healthCosts?.reduce((sum, record) => sum + parseFloat(record.cost), 0) || 0
      const totalFeedCosts = feedCosts?.reduce((sum, record) => sum + parseFloat(record.total_cost), 0) || 0

      return {
        health: {
          total: totalHealthCosts,
          records: healthCosts?.length || 0,
          averagePerRecord: healthCosts?.length ? totalHealthCosts / healthCosts.length : 0,
          breakdown: this.calculateHealthCostBreakdown(healthCosts)
        },
        feed: {
          total: totalFeedCosts,
          records: feedCosts?.length || 0,
          averagePerRecord: feedCosts?.length ? totalFeedCosts / feedCosts.length : 0,
          breakdown: this.calculateFeedCostBreakdown(feedCosts)
        },
        totalDirectCosts: totalHealthCosts + totalFeedCosts
      }
    } catch (error) {
      console.error('Failed to get farm activity costs:', error)
      return {
        health: { total: 0, records: 0, averagePerRecord: 0, breakdown: {} },
        feed: { total: 0, records: 0, averagePerRecord: 0, breakdown: {} },
        totalDirectCosts: 0
      }
    }
  }

  /**
   * Calculate profitability metrics
   * @param {string} userId - The user ID
   * @param {string} startDate - Start date for calculations
   */
  async calculateProfitabilityMetrics(userId, startDate) {
    try {
      // Get revenue and expense totals
      const { data: revenue, error: revenueError } = await this.supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'revenue')
        .eq('is_deleted', false)
        .gte('date', startDate)

      if (revenueError) throw revenueError

      const { data: expenses, error: expenseError } = await this.supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .eq('is_deleted', false)
        .gte('date', startDate)

      if (expenseError) throw expenseError

      const totalRevenue = revenue?.reduce((sum, rev) => sum + parseFloat(rev.amount), 0) || 0
      const totalExpenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0
      const netProfit = totalRevenue - totalExpenses
      
      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        roi: totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0,
        breakEvenPoint: totalExpenses > 0 ? totalExpenses / 12 : 0, // Monthly breakeven
        monthlyAverageRevenue: totalRevenue / 12,
        monthlyAverageExpenses: totalExpenses / 12,
        monthlyAverageProfit: netProfit / 12
      }
    } catch (error) {
      console.error('Failed to calculate profitability metrics:', error)
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        roi: 0,
        breakEvenPoint: 0,
        monthlyAverageRevenue: 0,
        monthlyAverageExpenses: 0,
        monthlyAverageProfit: 0
      }
    }
  }

  /**
   * Generate financial forecast based on historical data
   * @param {Array} transactions - Historical transaction data
   */
  generateFinancialForecast(transactions) {
    if (!transactions || transactions.length === 0) {
      return {
        nextMonthRevenue: 0,
        nextMonthExpenses: 0,
        nextMonthProfit: 0,
        confidence: 'low'
      }
    }

    // Calculate monthly averages for last 6 months
    const recentMonths = 6
    const monthlyData = {}
    
    transactions.forEach(transaction => {
      const monthKey = new Date(transaction.date).toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0 }
      }
      
      if (transaction.type === 'revenue') {
        monthlyData[monthKey].revenue += parseFloat(transaction.amount)
      } else {
        monthlyData[monthKey].expenses += parseFloat(transaction.amount)
      }
    })

    const months = Object.keys(monthlyData).sort().slice(-recentMonths)
    const avgRevenue = months.reduce((sum, month) => sum + monthlyData[month].revenue, 0) / months.length
    const avgExpenses = months.reduce((sum, month) => sum + monthlyData[month].expenses, 0) / months.length

    // Factor in seasonal trends and farm activity costs
    const seasonalFactor = this.calculateSeasonalFactor()
    const confidenceLevel = months.length >= 3 ? 'high' : months.length >= 1 ? 'medium' : 'low'

    return {
      nextMonthRevenue: avgRevenue * seasonalFactor,
      nextMonthExpenses: avgExpenses * seasonalFactor,
      nextMonthProfit: (avgRevenue * seasonalFactor) - (avgExpenses * seasonalFactor),
      confidence: confidenceLevel,
      baseRevenue: avgRevenue,
      baseExpenses: avgExpenses,
      seasonalFactor,
      dataPoints: months.length
    }
  }

  // Helper methods
  calculateFinancialAnalytics(transactions) {
    if (!transactions || transactions.length === 0) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        transactionCount: 0,
        categoryBreakdown: {},
        monthlyTrends: []
      }
    }

    let totalRevenue = 0
    let totalExpenses = 0
    const categoryBreakdown = {}
    const monthlyTrends = {}

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount)
      const month = new Date(transaction.date).toISOString().slice(0, 7)
      
      if (transaction.type === 'revenue') {
        totalRevenue += amount
      } else {
        totalExpenses += amount
      }

      // Category breakdown
      if (!categoryBreakdown[transaction.category]) {
        categoryBreakdown[transaction.category] = { revenue: 0, expenses: 0, count: 0 }
      }
      
      if (transaction.type === 'revenue') {
        categoryBreakdown[transaction.category].revenue += amount
      } else {
        categoryBreakdown[transaction.category].expenses += amount
      }
      categoryBreakdown[transaction.category].count += 1

      // Monthly trends
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { revenue: 0, expenses: 0, profit: 0 }
      }
      
      if (transaction.type === 'revenue') {
        monthlyTrends[month].revenue += amount
      } else {
        monthlyTrends[month].expenses += amount
      }
      monthlyTrends[month].profit = monthlyTrends[month].revenue - monthlyTrends[month].expenses
    })

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      transactionCount: transactions.length,
      categoryBreakdown,
      monthlyTrends: Object.keys(monthlyTrends).sort().map(month => ({
        month,
        ...monthlyTrends[month]
      }))
    }
  }

  calculateHealthCostBreakdown(healthCosts) {
    const breakdown = {}
    
    healthCosts?.forEach(record => {
      const category = record.treatment_type || 'General Care'
      if (!breakdown[category]) {
        breakdown[category] = { total: 0, count: 0 }
      }
      breakdown[category].total += parseFloat(record.cost)
      breakdown[category].count += 1
    })

    return breakdown
  }

  calculateFeedCostBreakdown(feedCosts) {
    const breakdown = {}
    
    feedCosts?.forEach(record => {
      const category = record.feed_type.replace(/_/g, ' ')
      if (!breakdown[category]) {
        breakdown[category] = { total: 0, count: 0 }
      }
      breakdown[category].total += parseFloat(record.total_cost)
      breakdown[category].count += 1
    })

    return breakdown
  }

  calculateSeasonalFactor() {
    const month = new Date().getMonth()
    // Simple seasonal adjustment - can be enhanced with historical data
    const seasonalFactors = [
      1.0, // January
      1.0, // February
      1.1, // March (breeding season starts)
      1.2, // April (spring activity)
      1.1, // May
      1.0, // June
      0.9, // July (summer slow)
      0.9, // August
      1.1, // September (fall activity)
      1.2, // October (breeding prep)
      1.1, // November
      0.8  // December (holiday slow)
    ]
    
    return seasonalFactors[month]
  }

  buildHealthTransactionNotes(healthRecord) {
    const notes = []
    if (healthRecord.veterinarian) notes.push(`Vet: ${healthRecord.veterinarian}`)
    if (healthRecord.treatment_type) notes.push(`Treatment: ${healthRecord.treatment_type}`)
    if (healthRecord.medication) notes.push(`Medication: ${healthRecord.medication}`)
    if (healthRecord.severity) notes.push(`Severity: ${healthRecord.severity}`)
    return notes.join(' | ')
  }

  buildFeedTransactionNotes(feedRecord) {
    const notes = []
    notes.push(`Amount: ${feedRecord.amount}kg`)
    if (feedRecord.cost_per_kg) notes.push(`Cost/kg: $${feedRecord.cost_per_kg}`)
    if (feedRecord.sections) notes.push(`Sections: ${feedRecord.sections}`)
    return notes.join(' | ')
  }

  buildSaleTransactionNotes(saleData) {
    const notes = []
    if (saleData.buyer_name) notes.push(`Buyer: ${saleData.buyer_name}`)
    if (saleData.weight) notes.push(`Weight: ${saleData.weight}kg`)
    if (saleData.age_months) notes.push(`Age: ${saleData.age_months} months`)
    return notes.join(' | ')
  }
}

// Export singleton instance
export const financialIntegration = new FinancialIntegrationService()
