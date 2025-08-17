import { supabase } from '@/supabase'

class UserAwareService {
  constructor() {
    this.supabase = supabase
  }

  // Get current authenticated user
  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    if (error || !user) {
      throw new Error('User not authenticated')
    }
    return user
  }

  // User-aware query builder for rabbits
  async getRabbits(options = {}) {
    const user = await this.getCurrentUser()
    
    let query = this.supabase
      .from('rabbits')
      .select(options.select || '*')
      .eq('created_by', user.id)
      .eq('is_deleted', false)

    // Apply additional filters
    if (options.status) {
      query = query.eq('status', options.status)
    }
    if (options.gender) {
      query = query.eq('gender', options.gender)
    }
    if (options.breed) {
      query = query.eq('breed', options.breed)
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.field, { ascending: options.orderBy.ascending !== false })
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  // User-aware query builder for breeding plans
  async getBreedingPlans(options = {}) {
    const user = await this.getCurrentUser()
    
    let query = this.supabase
      .from('breeding_plans')
      .select(options.select || '*')
      .eq('created_by', user.id)
      .eq('is_deleted', false)

    // Apply additional filters
    if (options.status) {
      query = query.eq('status', options.status)
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.field, { ascending: options.orderBy.ascending !== false })
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  // User-aware query builder for transactions
  async getTransactions(options = {}) {
    const user = await this.getCurrentUser()
    
    let query = this.supabase
      .from('transactions')
      .select(options.select || '*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)

    // Apply additional filters
    if (options.type) {
      query = query.eq('type', options.type)
    }
    if (options.category) {
      query = query.eq('category', options.category)
    }
    if (options.dateFrom) {
      query = query.gte('date', options.dateFrom)
    }
    if (options.dateTo) {
      query = query.lte('date', options.dateTo)
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.field, { ascending: options.orderBy.ascending !== false })
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  // User-aware query builder for health records
  async getHealthRecords(options = {}) {
    const user = await this.getCurrentUser()
    
    let query = this.supabase
      .from('health_records')
      .select(options.select || '*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)

    // Apply additional filters
    if (options.status) {
      query = query.eq('status', options.status)
    }
    if (options.recordType) {
      query = query.eq('record_type', options.recordType)
    }
    if (options.dateFrom) {
      query = query.gte('record_date', options.dateFrom)
    }
    if (options.dateTo) {
      query = query.lte('record_date', options.dateTo)
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.field, { ascending: options.orderBy.ascending !== false })
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  // User-aware query builder for weight records
  async getWeightRecords(options = {}) {
    const user = await this.getCurrentUser()
    
    let query = this.supabase
      .from('weight_records')
      .select(options.select || '*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)

    // Apply additional filters
    if (options.rabbitId) {
      query = query.eq('rabbit_id', options.rabbitId)
    }
    if (options.dateFrom) {
      query = query.gte('measurement_date', options.dateFrom)
    }
    if (options.dateTo) {
      query = query.lte('measurement_date', options.dateTo)
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.field, { ascending: options.orderBy.ascending !== false })
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  // User-aware query builder for schedule events
  async getScheduleEvents(options = {}) {
    const user = await this.getCurrentUser()
    
    let query = this.supabase
      .from('schedule_events')
      .select(options.select || '*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)

    // Apply additional filters
    if (options.status) {
      query = query.eq('status', options.status)
    }
    if (options.eventType) {
      query = query.eq('event_type', options.eventType)
    }
    if (options.dateFrom) {
      query = query.gte('start_date', options.dateFrom)
    }
    if (options.dateTo) {
      query = query.lte('start_date', options.dateTo)
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.field, { ascending: options.orderBy.ascending !== false })
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  // User-aware query builder for kit records
  async getKitRecords(options = {}) {
    const user = await this.getCurrentUser()
    
    let query = this.supabase
      .from('kit_records')
      .select(options.select || '*')
      .eq('created_by', user.id)
      .eq('is_deleted', false)

    // Apply additional filters
    if (options.status) {
      query = query.eq('status', options.status)
    }
    if (options.gender) {
      query = query.eq('gender', options.gender)
    }
    if (options.breedingPlanId) {
      query = query.eq('breeding_plan_id', options.breedingPlanId)
    }
    if (options.orderBy) {
      query = query.order(options.orderBy.field, { ascending: options.orderBy.ascending !== false })
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  // Count records for a user
  async countRecords(table, options = {}) {
    const user = await this.getCurrentUser()
    
    let query = this.supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .eq('is_deleted', false)

    // Apply additional filters
    if (options.status) {
      query = query.eq('status', options.status)
    }
    if (options.userIdField && options.userIdField !== 'created_by') {
      // For tables that use different user ID field names
      query = this.supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq(options.userIdField, user.id)
        .eq('is_deleted', false)
    }

    const { count, error } = await query
    if (error) throw error
    return count || 0
  }

  // Generic user-aware insert
  async insertRecord(table, recordData, userIdField = 'created_by') {
    const user = await this.getCurrentUser()
    
    const dataToInsert = {
      ...recordData,
      [userIdField]: user.id
    }

    const { data, error } = await this.supabase
      .from(table)
      .insert([dataToInsert])
      .select()

    if (error) throw error
    return data[0]
  }

  // Generic user-aware update
  async updateRecord(table, recordId, updateData, userIdField = 'created_by') {
    const user = await this.getCurrentUser()
    
    const { data, error } = await this.supabase
      .from(table)
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .eq(userIdField, user.id)
      .select()

    if (error) throw error
    return data[0]
  }

  // Generic user-aware delete (soft delete)
  async deleteRecord(table, recordId, userIdField = 'created_by') {
    const user = await this.getCurrentUser()
    
    const { error } = await this.supabase
      .from(table)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', recordId)
      .eq(userIdField, user.id)

    if (error) throw error
    return { success: true }
  }
}

export default new UserAwareService()
