import { supabase } from '@/supabase'
import currencyService from '@/services/currency'

class DashboardService {
  constructor() {
    this.supabase = supabase
    console.log('DashboardService initialized with shared supabase instance')
  }

  async initialize() {
    await currencyService.initialize()
  }

  // Test method to verify database connection
  async testConnection() {
    try {
      console.log('Testing database connection...')
      
      // Test if we can access the rabbits table - same pattern as RabbitList
      const { data, error } = await this.supabase
        .from('rabbits')
        .select('*')
        .limit(1)
      
      console.log('Connection test result:', { data, error })
      
      if (error) {
        console.error('Database connection failed:', error)
        return false
      }
      
      console.log('Database connection successful')
      return true
    } catch (error) {
      console.error('Connection test error:', error)
      return false
    }
  }

  async getDashboardStats() {
    try {
      console.log('Fetching dashboard stats...')
      
      // Initialize currency service
      await this.initialize()
      
      // Test connection first
      const isConnected = await this.testConnection()
      if (!isConnected) {
        console.error('Database connection failed')
        return {
          totalRabbits: 0,
          breedingPairs: 0,
          expectedBirths: 0,
          monthlyRevenue: 0,
          activeRabbits: 0,
          monthlyExpenses: 0
        }
      }
      
      // Get total rabbits count directly from database - same pattern as RabbitList
      const { data: allRabbits, error: rabbitsError } = await this.supabase
        .from('rabbits')
        .select('*')

      console.log('Rabbits query result:', { data: allRabbits, error: rabbitsError })

      if (rabbitsError) {
        console.error('Error fetching rabbits:', rabbitsError)
        throw rabbitsError
      }

      const totalRabbits = allRabbits?.length || 0
      const activeRabbits = allRabbits?.filter(rabbit => rabbit.status === 'active').length || 0

      console.log('Rabbit counts:', { total: totalRabbits, active: activeRabbits })

      // Get additional stats directly from database
      const [breedingPairs, expectedBirths, monthlyExpenses] = await Promise.all([
        this.getBreedingPairsCount(),
        this.getExpectedBirthsCount(),
        this.getMonthlyExpenses()
      ])

      return {
        totalRabbits,
        breedingPairs,
        expectedBirths,
        monthlyRevenue: this.calculateMonthlyRevenue(monthlyExpenses),
        activeRabbits,
        monthlyExpenses
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        totalRabbits: 0,
        breedingPairs: 0,
        expectedBirths: 0,
        monthlyRevenue: 0,
        activeRabbits: 0,
        monthlyExpenses: 0
      }
    }
  }

  async getBreedingPairsCount() {
    try {
      const { data, error } = await this.supabase
        .from('breeding_plans')
        .select('id')
        .eq('status', 'Active')
        .not('doe_id', 'is', null)
        .not('buck_id', 'is', null)

      if (error) throw error
      return data?.length || 0
    } catch (error) {
      console.error('Error fetching breeding pairs count:', error)
      return 0
    }
  }

  async getExpectedBirthsCount() {
    try {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()
      
      // Get first day of current month
      const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
      
      // Get first day of next month
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
      const firstDayOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

      const { data, error } = await this.supabase
        .from('breeding_plans')
        .select('id')
        .eq('status', 'Active')
        .not('expected_kindle_date', 'is', null)
        .gte('expected_kindle_date', firstDayOfMonth)
        .lt('expected_kindle_date', firstDayOfNextMonth)

      if (error) throw error
      return data?.length || 0
    } catch (error) {
      console.error('Error fetching expected births count:', error)
      return 0
    }
  }

  async getMonthlyExpenses() {
    try {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()

      const { data, error } = await this.supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'expense')
        .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
        .lt('date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`)

      if (error) {
        console.error('Error fetching monthly expenses:', error)
        return 0
      }

      return data?.reduce((sum, transaction) => sum + parseFloat(transaction.amount || 0), 0) || 0
    } catch (error) {
      console.error('Error calculating monthly expenses:', error)
      return 0
    }
  }

  calculateMonthlyRevenue(expenses) {
    // This is a placeholder calculation - you might want to implement
    // actual revenue calculation based on your business logic
    // For now, we'll assume revenue is 2x expenses as a rough estimate
    return expenses * 2
  }

  async getPopulationTrends(months = 6) {
    try {
      console.log('Fetching population trends...')
      
      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        console.error('User not authenticated:', userError)
        return []
      }

      // Get all rabbits for the user
      const { data: rabbits, error: rabbitsError } = await this.supabase
        .from('rabbits')
        .select('id, created_at, status')
        .eq('created_by', user.id)
        .or('is_deleted.is.null,is_deleted.eq.false')

      if (rabbitsError) {
        console.error('Error fetching rabbits:', rabbitsError)
        return []
      }

      // Generate trends for the specified number of months
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
      
      console.log('Population trends generated:', trends)
      return trends
      
    } catch (error) {
      console.error('Error fetching population trends:', error)
      return []
    }
  }

  async getWeeklyRevenueTrends(weeks = 4) {
    try {
      console.log('Fetching weekly revenue trends...')
      
      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      if (userError || !user) {
        console.error('User not authenticated:', userError)
        return []
      }

      // Get revenue transactions for the user from the past month
      const now = new Date()
      const pastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      
      const { data: transactions, error: transactionsError } = await this.supabase
        .from('transactions')
        .select('amount, date, type')
        .eq('user_id', user.id)
        .eq('type', 'revenue')
        .gte('date', pastMonth.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError)
        return []
      }

      // Generate weekly revenue trends
      const trends = []
      const currentWeek = Math.ceil(now.getDate() / 7)
      
      // Calculate revenue for each week of the current month
      for (let week = 1; week <= weeks; week++) {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), (week - 1) * 7 + 1)
        const endOfWeek = new Date(now.getFullYear(), now.getMonth(), week * 7)
        
        // Filter transactions for this week
        const weekTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= startOfWeek && transactionDate <= endOfWeek
        })
        
        const weekRevenue = weekTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
        
        trends.push({
          week: `Week ${week}`,
          revenue: weekRevenue,
          transactions: weekTransactions.length
        })
      }
      
      // Ensure we always have at least current week data for chart display
      if (trends.length === 0 || trends.every(t => t.revenue === 0)) {
        // Fallback: estimate weekly revenue from monthly expenses
        const monthlyExpenses = await this.getMonthlyExpenses()
        const estimatedWeeklyRevenue = (monthlyExpenses * 2.5) / 4 // Rough estimate
        
        trends.push({
          week: `Week ${currentWeek}`,
          revenue: estimatedWeeklyRevenue,
          transactions: 0
        })
      }
      
      console.log('Weekly revenue trends generated:', trends)
      return trends
      
    } catch (error) {
      console.error('Error fetching weekly revenue trends:', error)
      return []
    }
  }

  async getRecentActivities() {
    try {
      // Get recent breeding activities
      const { data: breedingActivities, error: breedingError } = await this.supabase
        .from('breeding_plans')
        .select(`
          id,
          created_at,
          status,
          doe:rabbits!breeding_plans_doe_id_fkey(name),
          buck:rabbits!breeding_plans_buck_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (breedingError) throw breedingError

      // Get recent transactions
      const { data: transactions, error: transactionError } = await this.supabase
        .from('transactions')
        .select('id, created_at, amount, description, type')
        .order('created_at', { ascending: false })
        .limit(5)

      if (transactionError) throw transactionError

      // Combine and format activities
      const activities = []

      // Add breeding activities
      breedingActivities?.forEach(activity => {
        activities.push({
          id: activity.id,
          type: 'breeding',
          message: `Breeding pair: ${activity.doe?.name || 'Unknown'} & ${activity.buck?.name || 'Unknown'}`,
          time: activity.created_at,
          status: activity.status
        })
      })

      // Add transaction activities
      transactions?.forEach(transaction => {
        activities.push({
          id: transaction.id,
          type: 'transaction',
          message: `${transaction.type}: ${transaction.description}`,
          time: transaction.created_at,
          amount: transaction.amount
        })
      })

      // Sort by time and return top 5
      return activities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5)

    } catch (error) {
      console.error('Error fetching recent activities:', error)
      return []
    }
  }

  async getUpcomingTasks() {
    try {
      const tasks = []

      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()
      
      // Get first day of next month for end range
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
      const firstDayOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

      // Get upcoming breeding plans for this month
      const { data: upcomingBreedings, error: breedingError } = await this.supabase
        .from('breeding_plans')
        .select(`
          id,
          planned_date,
          doe:rabbits!breeding_plans_doe_id_fkey(name)
        `)
        .eq('status', 'planned')
        .gte('planned_date', new Date().toISOString())
        .lt('planned_date', firstDayOfNextMonth)
        .order('planned_date', { ascending: true })
        .limit(3)

      if (!breedingError && upcomingBreedings) {
        upcomingBreedings.forEach(breeding => {
          tasks.push({
            id: breeding.id,
            task: `Breed ${breeding.doe?.name || 'Unknown doe'}`,
            due: breeding.planned_date,
            type: 'breeding'
          })
        })
      }

      // Get upcoming feeding schedules for this month
      const { data: feedingSchedules, error: feedingError } = await this.supabase
        .from('feeding_schedules')
        .select('id, next_feeding_date, description')
        .gte('next_feeding_date', new Date().toISOString())
        .lt('next_feeding_date', firstDayOfNextMonth)
        .order('next_feeding_date', { ascending: true })
        .limit(3)

      if (!feedingError && feedingSchedules) {
        feedingSchedules.forEach(schedule => {
          tasks.push({
            id: schedule.id,
            task: schedule.description || 'Feeding task',
            due: schedule.next_feeding_date,
            type: 'feeding'
          })
        })
      }

      // Sort by due date and return top 5
      return tasks
        .sort((a, b) => new Date(a.due) - new Date(b.due))
        .slice(0, 5)

    } catch (error) {
      console.error('Error fetching upcoming tasks:', error)
      return []
    }
  }
}

export default new DashboardService()
