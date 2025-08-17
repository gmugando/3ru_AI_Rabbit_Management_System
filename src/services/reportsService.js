import { supabase } from '@/supabase'
import { financialIntegration } from '@/services/financialIntegration'

/**
 * Comprehensive Reports Service
 * Generates detailed reports across all farm operations
 */
export class ReportsService {
  constructor() {
    this.supabase = supabase
  }

  /**
   * Generate Population Report
   * @param {string} userId - The user ID
   * @param {number} months - Number of months to analyze
   */
  async generatePopulationReport(userId, months = 6) {
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)
      const startDateStr = startDate.toISOString().split('T')[0]

      // Get current rabbit population
      const { data: currentRabbits, error: rabbitsError } = await this.supabase
        .from('rabbits')
        .select('id, name, breed, gender, date_of_birth, created_at, status')
        .eq('created_by', userId)
        .or('is_deleted.is.null,is_deleted.eq.false')

      if (rabbitsError) throw rabbitsError

      // Get breeding records for breeding pairs calculation
      const { data: breedingRecords, error: breedingError } = await this.supabase
        .from('breeding_plans')
        .select('doe_id, buck_id, planned_date, status')
        .eq('created_by', userId)
        .gte('planned_date', startDateStr)

      if (breedingError) console.warn('Breeding data not available:', breedingError)

      // Calculate population metrics
      const populationMetrics = this.calculatePopulationMetrics(currentRabbits, breedingRecords)
      
      // Generate population trends
      const populationTrends = this.generatePopulationTrends(currentRabbits, months)
      
      // Generate breed distribution
      const breedDistribution = this.calculateBreedDistribution(currentRabbits)
      
      // Calculate age demographics
      const ageDemographics = this.calculateAgeDemographics(currentRabbits)

      return {
        summary: populationMetrics,
        trends: populationTrends,
        breedDistribution,
        ageDemographics,
        detailedStats: this.generateDetailedPopulationStats(currentRabbits),
        recommendations: this.generatePopulationRecommendations(populationMetrics)
      }
    } catch (error) {
      console.error('Error generating population report:', error)
      throw error
    }
  }

  /**
   * Generate Health Report
   * @param {string} userId - The user ID
   * @param {number} months - Number of months to analyze
   */
  async generateHealthReport(userId, months = 6) {
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)
      const startDateStr = startDate.toISOString().split('T')[0]

      // Get health records
      let healthQuery = this.supabase
        .from('health_records_with_rabbit')
        .select('*')
        .eq('user_id', userId)
        .gte('record_date', startDateStr)
        .eq('is_deleted', false)

      // Fallback if view doesn't exist
      const { data: healthRecords, error: healthError } = await healthQuery

      if (healthError) {
        console.warn('Health records view not available, using base table:', healthError)
        // Fallback to base table
        const { data: fallbackData, error: fallbackError } = await this.supabase
          .from('health_records')
          .select('*')
          .eq('user_id', userId)
          .gte('record_date', startDateStr)
          .eq('is_deleted', false)
        
        if (fallbackError) throw fallbackError
        return this.processHealthReport(fallbackData || [], months)
      }

      return this.processHealthReport(healthRecords || [], months)
    } catch (error) {
      console.error('Error generating health report:', error)
      throw error
    }
  }

  /**
   * Generate Financial Report
   * @param {string} userId - The user ID
   * @param {number} months - Number of months to analyze
   */
  async generateFinancialReport(userId, months = 6) {
    try {
      // Use existing financial integration service
      const analytics = await financialIntegration.getFinancialAnalytics(userId, months)
      
      // Process for reporting format
      return {
        summary: {
          totalRevenue: analytics.totalRevenue || 0,
          totalExpenses: analytics.totalExpenses || 0,
          netProfit: analytics.netProfit || 0,
          profitMargin: analytics.profitability?.profitMargin || 0,
          roi: analytics.profitability?.roi || 0
        },
        trends: analytics.monthlyTrends || [],
        categoryBreakdown: analytics.categoryBreakdown || {},
        farmCosts: analytics.farmCosts || {},
        profitability: analytics.profitability || {},
        forecast: analytics.forecast || {},
        recommendations: this.generateFinancialRecommendations(analytics)
      }
    } catch (error) {
      console.error('Error generating financial report:', error)
      throw error
    }
  }

  /**
   * Generate Breeding Report
   * @param {string} userId - The user ID
   * @param {number} months - Number of months to analyze
   */
  async generateBreedingReport(userId, months = 6) {
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)
      const startDateStr = startDate.toISOString().split('T')[0]

      // Get breeding plans
      const { data: breedingPlans, error: breedingError } = await this.supabase
        .from('breeding_plans')
        .select('*')
        .eq('created_by', userId)
        .gte('planned_date', startDateStr)

      if (breedingError) throw breedingError

      // Get rabbit data for breeding analysis
      const { data: rabbits, error: rabbitsError } = await this.supabase
        .from('rabbits')
        .select('id, name, breed, gender, date_of_birth, status')
        .eq('created_by', userId)
        .or('is_deleted.is.null,is_deleted.eq.false')

      if (rabbitsError) throw rabbitsError

      return this.processBreedingReport(breedingPlans || [], rabbits || [], months)
    } catch (error) {
      console.error('Error generating breeding report:', error)
      throw error
    }
  }

  /**
   * Generate Feeding Report
   * @param {string} userId - The user ID  
   * @param {number} months - Number of months to analyze
   */
  async generateFeedingReport(userId, months = 6) {
    try {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)
      const startDateStr = startDate.toISOString().split('T')[0]

      // Get feed records
      const { data: feedRecords, error: feedError } = await this.supabase
        .from('feed_records')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .eq('is_deleted', false)

      if (feedError) throw feedError

      // Get feeding schedules
      const { data: feedingSchedules, error: scheduleError } = await this.supabase
        .from('feeding_schedules')
        .select('*')
        .eq('user_id', userId)

      if (scheduleError) console.warn('Feeding schedules not available:', scheduleError)

      return this.processFeedingReport(feedRecords || [], feedingSchedules || [], months)
    } catch (error) {
      console.error('Error generating feeding report:', error)
      throw error
    }
  }

  // Helper methods for population calculations
  calculatePopulationMetrics(rabbits, breedingRecords) {
    const total = rabbits.length
    const males = rabbits.filter(r => r.gender === 'male').length
    const females = rabbits.filter(r => r.gender === 'female').length
    
    // Calculate age groups
    const now = new Date()
    const ageGroups = {
      young: 0, // Under 6 months
      adult: 0, // 6 months to 3 years
      senior: 0 // Over 3 years
    }

    rabbits.forEach(rabbit => {
      const birthDate = new Date(rabbit.date_of_birth)
      const ageInMonths = (now - birthDate) / (1000 * 60 * 60 * 24 * 30.44)
      
      if (ageInMonths < 6) {
        ageGroups.young++
      } else if (ageInMonths < 36) {
        ageGroups.adult++
      } else {
        ageGroups.senior++
      }
    })

    // Calculate breeding pairs
    const activePairs = new Set()
    breedingRecords?.forEach(record => {
              if (record.status === 'Planned' || record.status === 'successful') {
        activePairs.add(`${record.doe_id}-${record.buck_id}`)
      }
    })

    return {
      totalPopulation: total,
      males,
      females,
      ...ageGroups,
      breedingPairs: activePairs.size,
      growthRate: this.calculateGrowthRate(rabbits)
    }
  }

  calculateGrowthRate(rabbits) {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    
    const recentAdditions = rabbits.filter(r => new Date(r.created_at) >= lastMonth).length
    const totalPopulation = rabbits.length
    
    return totalPopulation > 0 ? (recentAdditions / totalPopulation) * 100 : 0
  }

  generatePopulationTrends(rabbits, months) {
    const trends = []
    const now = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
      
      const populationAtEndOfMonth = rabbits.filter(r => {
        const createdDate = new Date(r.created_at)
        return createdDate <= endOfMonth
      }).length
      
      trends.push({
        month: targetDate.toISOString().slice(0, 7),
        population: populationAtEndOfMonth,
        date: targetDate
      })
    }
    
    // Ensure we always have at least current month data for chart display
    if (trends.length === 0 || trends.every(t => t.population === 0)) {
      const currentMonth = new Date()
      trends.push({
        month: currentMonth.toISOString().slice(0, 7),
        population: rabbits.length,
        date: currentMonth
      })
    }
    
    return trends
  }

  calculateBreedDistribution(rabbits) {
    const distribution = {}
    rabbits.forEach(rabbit => {
      const breed = rabbit.breed || 'Unknown'
      distribution[breed] = (distribution[breed] || 0) + 1
    })
    
    const total = rabbits.length
    return Object.entries(distribution).map(([breed, count]) => ({
      breed,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    })).sort((a, b) => b.count - a.count)
  }

  calculateAgeDemographics(rabbits) {
    const now = new Date()
    const demographics = {
      '0-3 months': 0,
      '3-6 months': 0,
      '6-12 months': 0,
      '1-2 years': 0,
      '2+ years': 0
    }

    rabbits.forEach(rabbit => {
      if (!rabbit.date_of_birth) return
      
      const birthDate = new Date(rabbit.date_of_birth)
      const ageInMonths = (now - birthDate) / (1000 * 60 * 60 * 24 * 30.44)
      
      if (ageInMonths < 3) {
        demographics['0-3 months']++
      } else if (ageInMonths < 6) {
        demographics['3-6 months']++
      } else if (ageInMonths < 12) {
        demographics['6-12 months']++
      } else if (ageInMonths < 24) {
        demographics['1-2 years']++
      } else {
        demographics['2+ years']++
      }
    })

    return demographics
  }

  generateDetailedPopulationStats(rabbits) {
    const stats = []
    
    // Calculate by gender and age group
    const categories = [
      { name: 'Adult Females', filter: r => r.gender === 'female' && this.getAgeInMonths(r.date_of_birth) >= 6 },
      { name: 'Adult Males', filter: r => r.gender === 'male' && this.getAgeInMonths(r.date_of_birth) >= 6 },
      { name: 'Young Rabbits', filter: r => this.getAgeInMonths(r.date_of_birth) < 6 },
      { name: 'Breeding Does', filter: r => r.gender === 'female' && this.isBreedingAge(r.date_of_birth) },
      { name: 'Breeding Bucks', filter: r => r.gender === 'male' && this.isBreedingAge(r.date_of_birth) }
    ]

    categories.forEach(category => {
      const current = rabbits.filter(category.filter).length
      const trend = this.calculateCategoryTrend(rabbits, category.filter)
      
      stats.push({
        category: category.name,
        count: current,
        change: trend.change,
        changePercent: trend.changePercent,
        trend: trend.direction
      })
    })

    return stats
  }

  getAgeInMonths(birthDate) {
    if (!birthDate) return 0
    const now = new Date()
    const birth = new Date(birthDate)
    return (now - birth) / (1000 * 60 * 60 * 24 * 30.44)
  }

  isBreedingAge(birthDate) {
    const ageInMonths = this.getAgeInMonths(birthDate)
    return ageInMonths >= 6 && ageInMonths <= 60 // 6 months to 5 years
  }

  calculateCategoryTrend(rabbits, filterFn) {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    
    const current = rabbits.filter(filterFn).length
    const lastMonthCount = rabbits.filter(r => {
      return filterFn(r) && new Date(r.created_at) < lastMonth
    }).length
    
    const change = current - lastMonthCount
    const changePercent = lastMonthCount > 0 ? (change / lastMonthCount) * 100 : 0
    
    return {
      change,
      changePercent,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    }
  }

  generatePopulationRecommendations(metrics) {
    const recommendations = []
    
    // Check male to female ratio
    const ratio = metrics.females > 0 ? metrics.males / metrics.females : 0
    if (ratio < 0.1) {
      recommendations.push({
        type: 'breeding',
        priority: 'high',
        title: 'Low Buck to Doe Ratio',
        description: `You have ${metrics.males} bucks for ${metrics.females} does. Consider adding more breeding bucks.`,
        action: 'Add breeding bucks'
      })
    }
    
    // Check age distribution
    if (metrics.young < metrics.adult * 0.3) {
      recommendations.push({
        type: 'breeding',
        priority: 'medium',
        title: 'Low Young Population',
        description: 'Consider increasing breeding activity to maintain population growth.',
        action: 'Plan more breeding cycles'
      })
    }
    
    // Check population growth
    if (metrics.growthRate < 5) {
      recommendations.push({
        type: 'population',
        priority: 'medium',
        title: 'Slow Population Growth',
        description: 'Population growth is below 5% per month. Review breeding strategy.',
        action: 'Optimize breeding schedule'
      })
    }

    return recommendations
  }

  // Health report processing
  processHealthReport(healthRecords, months) {
    const summary = this.calculateHealthSummary(healthRecords)
    const trends = this.generateHealthTrends(healthRecords, months)
    const conditionBreakdown = this.calculateConditionBreakdown(healthRecords)
    const treatmentAnalysis = this.analyzeTreatments(healthRecords)
    
    return {
      summary,
      trends,
      conditionBreakdown,
      treatmentAnalysis,
      recommendations: this.generateHealthRecommendations(summary, healthRecords)
    }
  }

  calculateHealthSummary(healthRecords) {
    const total = healthRecords.length
    const byStatus = {}
    const bySeverity = {}
    let totalCost = 0

    healthRecords.forEach(record => {
      byStatus[record.status] = (byStatus[record.status] || 0) + 1
      if (record.severity) {
        bySeverity[record.severity] = (bySeverity[record.severity] || 0) + 1
      }
      if (record.cost) {
        totalCost += parseFloat(record.cost)
      }
    })

    return {
      totalRecords: total,
      statusDistribution: byStatus,
      severityDistribution: bySeverity,
      totalHealthCost: totalCost,
      averageCostPerRecord: total > 0 ? totalCost / total : 0
    }
  }

  generateHealthTrends(healthRecords, months) {
    const trends = []
    const now = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      
      const monthRecords = healthRecords.filter(r => {
        const recordDate = new Date(r.record_date)
        return recordDate >= startOfMonth && recordDate <= endOfMonth
      })
      
      const monthCost = monthRecords.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0)
      
      trends.push({
        month: targetDate.toISOString().slice(0, 7),
        recordCount: monthRecords.length,
        cost: monthCost,
        healthIssues: monthRecords.filter(r => r.record_type !== 'checkup').length
      })
    }
    
    // Ensure we always have at least current month data for chart display
    if (trends.length === 0 || trends.every(t => t.recordCount === 0 && t.cost === 0)) {
      const currentMonth = new Date()
      const currentMonthRecords = healthRecords.filter(r => {
        const recordDate = new Date(r.record_date)
        const thisMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        return recordDate >= thisMonth
      })
      trends.push({
        month: currentMonth.toISOString().slice(0, 7),
        recordCount: currentMonthRecords.length,
        cost: currentMonthRecords.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0),
        healthIssues: currentMonthRecords.filter(r => r.record_type !== 'checkup').length
      })
    }
    
    return trends
  }

  calculateConditionBreakdown(healthRecords) {
    const conditions = {}
    
    healthRecords.forEach(record => {
      if (record.condition) {
        const condition = record.condition
        if (!conditions[condition]) {
          conditions[condition] = {
            count: 0,
            totalCost: 0,
            severity: {}
          }
        }
        
        conditions[condition].count++
        conditions[condition].totalCost += parseFloat(record.cost) || 0
        
        if (record.severity) {
          conditions[condition].severity[record.severity] = 
            (conditions[condition].severity[record.severity] || 0) + 1
        }
      }
    })
    
    return Object.entries(conditions)
      .map(([condition, data]) => ({
        condition,
        ...data,
        averageCost: data.count > 0 ? data.totalCost / data.count : 0
      }))
      .sort((a, b) => b.count - a.count)
  }

  analyzeTreatments(healthRecords) {
    const treatments = {}
    
    healthRecords.forEach(record => {
      if (record.treatment_type) {
        const treatment = record.treatment_type
        if (!treatments[treatment]) {
          treatments[treatment] = {
            count: 0,
            totalCost: 0,
            successRate: 0,
            conditions: new Set()
          }
        }
        
        treatments[treatment].count++
        treatments[treatment].totalCost += parseFloat(record.cost) || 0
        
        if (record.condition) {
          treatments[treatment].conditions.add(record.condition)
        }
        
        // Calculate success rate based on status
        if (record.status === 'recovered') {
          treatments[treatment].successRate++
        }
      }
    })
    
    return Object.entries(treatments)
      .map(([treatment, data]) => ({
        treatment,
        count: data.count,
        totalCost: data.totalCost,
        averageCost: data.count > 0 ? data.totalCost / data.count : 0,
        successRate: data.count > 0 ? (data.successRate / data.count) * 100 : 0,
        conditionsCount: data.conditions.size
      }))
      .sort((a, b) => b.count - a.count)
  }

  generateHealthRecommendations(summary, healthRecords) {
    const recommendations = []
    
    // High health costs
    if (summary.averageCostPerRecord > 50) {
      recommendations.push({
        type: 'cost',
        priority: 'high',
        title: 'High Health Costs',
        description: `Average cost per health record is $${summary.averageCostPerRecord.toFixed(2)}. Consider preventive care.`,
        action: 'Implement preventive health program'
      })
    }
    
    // Frequent health issues
    const recentIssues = healthRecords.filter(r => {
      const recordDate = new Date(r.record_date)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return recordDate >= thirtyDaysAgo && r.record_type !== 'checkup'
    }).length
    
    if (recentIssues > healthRecords.length * 0.3) {
      recommendations.push({
        type: 'prevention',
        priority: 'high',
        title: 'Frequent Health Issues',
        description: `${recentIssues} health issues in the last 30 days. Review environmental conditions.`,
        action: 'Improve housing and nutrition'
      })
    }

    return recommendations
  }

  // Breeding report processing
  processBreedingReport(breedingPlans, rabbits, months) {
    const summary = this.calculateBreedingSummary(breedingPlans)
    const trends = this.generateBreedingTrends(breedingPlans, months)
    const performanceAnalysis = this.analyzeBreedingPerformance(breedingPlans)
    
    return {
      summary,
      trends,
      performanceAnalysis,
      recommendations: this.generateBreedingRecommendations(summary)
    }
  }

  calculateBreedingSummary(breedingPlans) {
    const total = breedingPlans.length
    const successful = breedingPlans.filter(p => p.status === 'successful').length
          const planned = breedingPlans.filter(p => p.status === 'Planned').length
    const failed = breedingPlans.filter(p => p.status === 'failed').length
    
    const successRate = total > 0 ? (successful / total) * 100 : 0
    
    // Calculate active breeding pairs
    const activeDoes = new Set(breedingPlans.filter(p => p.status !== 'failed').map(p => p.doe_id))
    const activeBucks = new Set(breedingPlans.filter(p => p.status !== 'failed').map(p => p.buck_id))
    
    return {
      totalBreedings: total,
      successful,
      planned,
      failed,
      successRate,
      activeDoes: activeDoes.size,
      activeBucks: activeBucks.size,
      totalPairs: new Set(breedingPlans.map(p => `${p.doe_id}-${p.buck_id}`)).size
    }
  }

  generateBreedingTrends(breedingPlans, months) {
    const trends = []
    const now = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      
      const monthBreedings = breedingPlans.filter(p => {
        const breedingDate = new Date(p.planned_date)
        return breedingDate >= startOfMonth && breedingDate <= endOfMonth
      })
      
      trends.push({
        month: targetDate.toISOString().slice(0, 7),
        totalBreedings: monthBreedings.length,
        successful: monthBreedings.filter(p => p.status === 'successful').length,
        successRate: monthBreedings.length > 0 ? 
          (monthBreedings.filter(p => p.status === 'successful').length / monthBreedings.length) * 100 : 0
      })
    }
    
    // Ensure we always have at least current month data for chart display
    if (trends.length === 0 || trends.every(t => t.totalBreedings === 0)) {
      const currentMonth = new Date()
      const currentMonthBreedings = breedingPlans.filter(p => {
        const breedingDate = new Date(p.planned_date)
        const thisMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        return breedingDate >= thisMonth
      })
      trends.push({
        month: currentMonth.toISOString().slice(0, 7),
        totalBreedings: currentMonthBreedings.length,
        successful: currentMonthBreedings.filter(p => p.status === 'successful').length,
        successRate: currentMonthBreedings.length > 0 ? 
          (currentMonthBreedings.filter(p => p.status === 'successful').length / currentMonthBreedings.length) * 100 : 0
      })
    }
    
    return trends
  }

  analyzeBreedingPerformance(breedingPlans) {
    // Analyze performance by doe
    const doesPerformance = {}
    const bucksPerformance = {}
    
    breedingPlans.forEach(plan => {
      // Doe performance
      if (!doesPerformance[plan.doe_id]) {
        doesPerformance[plan.doe_id] = {
          totalBreedings: 0,
          successful: 0,
          failed: 0
        }
      }
      
      doesPerformance[plan.doe_id].totalBreedings++
      if (plan.status === 'successful') {
        doesPerformance[plan.doe_id].successful++
      } else if (plan.status === 'failed') {
        doesPerformance[plan.doe_id].failed++
      }
      
      // Buck performance
      if (!bucksPerformance[plan.buck_id]) {
        bucksPerformance[plan.buck_id] = {
          totalBreedings: 0,
          successful: 0,
          failed: 0
        }
      }
      
      bucksPerformance[plan.buck_id].totalBreedings++
      if (plan.status === 'successful') {
        bucksPerformance[plan.buck_id].successful++
      } else if (plan.status === 'failed') {
        bucksPerformance[plan.buck_id].failed++
      }
    })
    
    // Calculate success rates and rank performers
    const topDoes = Object.entries(doesPerformance)
      .map(([doeId, data]) => ({
        rabbitId: doeId,
        ...data,
        successRate: data.totalBreedings > 0 ? (data.successful / data.totalBreedings) * 100 : 0
      }))
      .filter(d => d.totalBreedings >= 2) // Only does with 2+ breedings
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5)
    
    const topBucks = Object.entries(bucksPerformance)
      .map(([buckId, data]) => ({
        rabbitId: buckId,
        ...data,
        successRate: data.totalBreedings > 0 ? (data.successful / data.totalBreedings) * 100 : 0
      }))
      .filter(b => b.totalBreedings >= 2) // Only bucks with 2+ breedings
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5)
    
    return {
      topDoes,
      topBucks,
      averageSuccessRate: this.calculateAverageSuccessRate(breedingPlans)
    }
  }

  calculateAverageSuccessRate(breedingPlans) {
    const completed = breedingPlans.filter(p => p.status !== 'planned')
    const successful = completed.filter(p => p.status === 'successful')
    return completed.length > 0 ? (successful.length / completed.length) * 100 : 0
  }

  generateBreedingRecommendations(summary) {
    const recommendations = []
    
    // Low success rate
    if (summary.successRate < 70) {
      recommendations.push({
        type: 'breeding',
        priority: 'high',
        title: 'Low Breeding Success Rate',
        description: `Current success rate is ${summary.successRate.toFixed(1)}%. Review breeding conditions and timing.`,
        action: 'Optimize breeding environment and nutrition'
      })
    }
    
    // Limited breeding pairs
    if (summary.totalPairs < 5) {
      recommendations.push({
        type: 'breeding',
        priority: 'medium',
        title: 'Limited Breeding Pairs',
        description: `Only ${summary.totalPairs} breeding pairs active. Consider expanding breeding program.`,
        action: 'Add more breeding pairs'
      })
    }

    return recommendations
  }

  // Feeding report processing
  processFeedingReport(feedRecords, feedingSchedules, months) {
    const summary = this.calculateFeedingSummary(feedRecords)
    const trends = this.generateFeedingTrends(feedRecords, months)
    const costAnalysis = this.analyzeFeedingCosts(feedRecords)
    const efficiencyMetrics = this.calculateFeedingEfficiency(feedRecords, feedingSchedules)
    
    return {
      summary,
      trends,
      costAnalysis,
      efficiencyMetrics,
      recommendations: this.generateFeedingRecommendations(summary)
    }
  }

  calculateFeedingSummary(feedRecords) {
    const totalConsumption = feedRecords
      .filter(r => r.record_type === 'consumption')
      .reduce((sum, record) => sum + parseFloat(record.amount), 0)
    
    const totalPurchases = feedRecords
      .filter(r => r.record_type === 'stock_update')
      .reduce((sum, record) => sum + parseFloat(record.amount), 0)
    
    const totalCost = feedRecords
      .reduce((sum, record) => sum + (parseFloat(record.total_cost) || 0), 0)
    
    const feedTypes = new Set(feedRecords.map(r => r.feed_type)).size
    
    return {
      totalConsumption,
      totalPurchases,
      totalCost,
      feedTypes,
      averageCostPerKg: totalConsumption > 0 ? totalCost / totalConsumption : 0,
      consumptionRecords: feedRecords.filter(r => r.record_type === 'consumption').length,
      purchaseRecords: feedRecords.filter(r => r.record_type === 'stock_update').length
    }
  }

  generateFeedingTrends(feedRecords, months) {
    const trends = []
    const now = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      
      const monthRecords = feedRecords.filter(r => {
        const recordDate = new Date(r.date)
        return recordDate >= startOfMonth && recordDate <= endOfMonth
      })
      
      const consumption = monthRecords
        .filter(r => r.record_type === 'consumption')
        .reduce((sum, record) => sum + parseFloat(record.amount), 0)
      
      const cost = monthRecords
        .reduce((sum, record) => sum + (parseFloat(record.total_cost) || 0), 0)
      
      trends.push({
        month: targetDate.toISOString().slice(0, 7),
        consumption,
        cost,
        averageCostPerKg: consumption > 0 ? cost / consumption : 0
      })
    }
    
    return trends
  }

  analyzeFeedingCosts(feedRecords) {
    const costByType = {}
    const costByBrand = {}
    
    feedRecords.forEach(record => {
      const cost = parseFloat(record.total_cost) || 0
      const amount = parseFloat(record.amount) || 0
      
      // Cost by feed type
      if (!costByType[record.feed_type]) {
        costByType[record.feed_type] = {
          totalCost: 0,
          totalAmount: 0,
          records: 0
        }
      }
      
      costByType[record.feed_type].totalCost += cost
      costByType[record.feed_type].totalAmount += amount
      costByType[record.feed_type].records++
      
      // Cost by brand
      const brand = record.feed_brand || 'Unknown'
      if (!costByBrand[brand]) {
        costByBrand[brand] = {
          totalCost: 0,
          totalAmount: 0,
          records: 0
        }
      }
      
      costByBrand[brand].totalCost += cost
      costByBrand[brand].totalAmount += amount
      costByBrand[brand].records++
    })
    
    return {
      byType: Object.entries(costByType).map(([type, data]) => ({
        feedType: type,
        ...data,
        averageCostPerKg: data.totalAmount > 0 ? data.totalCost / data.totalAmount : 0
      })),
      byBrand: Object.entries(costByBrand).map(([brand, data]) => ({
        brand,
        ...data,
        averageCostPerKg: data.totalAmount > 0 ? data.totalCost / data.totalAmount : 0
      }))
    }
  }

  calculateFeedingEfficiency(feedRecords, feedingSchedules) {
    // Calculate feed conversion ratio and efficiency metrics
    const dailyConsumption = feedRecords
      .filter(r => r.record_type === 'consumption')
      .reduce((sum, record) => sum + parseFloat(record.amount), 0) / 30 // Approximate daily consumption
    
    const scheduledFeedings = feedingSchedules.length
    const actualFeedings = feedRecords.filter(r => r.record_type === 'consumption').length
    
    const adherenceRate = scheduledFeedings > 0 ? (actualFeedings / (scheduledFeedings * 30)) * 100 : 0
    
    return {
      dailyConsumption,
      scheduledFeedings,
      actualFeedings,
      adherenceRate,
      feedConversionRatio: this.calculateFeedConversionRatio(feedRecords)
    }
  }

  calculateFeedConversionRatio(feedRecords) {
    // Simplified FCR calculation - would need weight gain data for accurate calculation
    const totalFeed = feedRecords
      .filter(r => r.record_type === 'consumption')
      .reduce((sum, record) => sum + parseFloat(record.amount), 0)
    
    // This is a placeholder - actual FCR would require weight gain data
    return totalFeed > 0 ? 3.5 : 0 // Typical rabbit FCR is around 3-4:1
  }

  generateFeedingRecommendations(summary) {
    const recommendations = []
    
    // High feeding costs
    if (summary.averageCostPerKg > 4.0) {
      recommendations.push({
        type: 'cost',
        priority: 'medium',
        title: 'High Feed Costs',
        description: `Average cost per kg is $${summary.averageCostPerKg.toFixed(2)}. Consider bulk purchasing or alternative suppliers.`,
        action: 'Review feed procurement strategy'
      })
    }
    
    // Low feed type diversity
    if (summary.feedTypes < 3) {
      recommendations.push({
        type: 'nutrition',
        priority: 'low',
        title: 'Limited Feed Variety',
        description: `Only ${summary.feedTypes} feed types in use. Consider diversifying for better nutrition.`,
        action: 'Add supplementary feeds'
      })
    }

    return recommendations
  }

  generateFinancialRecommendations(analytics) {
    const recommendations = []
    
    // Low profit margin
    if (analytics.profitability?.profitMargin < 20) {
      recommendations.push({
        type: 'profitability',
        priority: 'high',
        title: 'Low Profit Margin',
        description: 'Consider optimizing costs or increasing revenue streams.',
        action: 'Review pricing and cost structure'
      })
    }
    
    // High health costs
    const healthCostRatio = (analytics.farmCosts?.health?.total || 0) / (analytics.totalExpenses || 1) * 100
    if (healthCostRatio > 25) {
      recommendations.push({
        type: 'cost',
        priority: 'high',
        title: 'High Health Costs',
        description: 'Health expenses are above 25% of total costs.',
        action: 'Implement preventive care program'
      })
    }

    return recommendations
  }
}

// Export singleton instance
export const reportsService = new ReportsService()
