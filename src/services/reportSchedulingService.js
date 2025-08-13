import { supabase } from '@/supabase'
import { reportsService } from './reportsService'

/**
 * Report Scheduling Service
 * Handles automated report generation and delivery
 */
class ReportSchedulingService {
  constructor() {
    this.supabase = supabase
  }

  /**
   * Create a new report schedule
   * @param {Object} scheduleData - The schedule configuration
   * @param {string} userId - The user ID
   */
  async createSchedule(scheduleData, userId) {
    try {
      // Calculate next generation date
      const nextGenerationAt = await this.calculateNextGenerationDate(
        scheduleData.frequency,
        scheduleData.frequency_config,
        scheduleData.time_of_day,
        scheduleData.timezone
      )

      const schedule = {
        ...scheduleData,
        user_id: userId,
        next_generation_at: nextGenerationAt
      }

      const { data, error } = await this.supabase
        .from('report_schedules')
        .insert([schedule])
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Failed to create report schedule:', error)
      throw error
    }
  }

  /**
   * Get all schedules for a user
   * @param {string} userId - The user ID
   */
  async getSchedules(userId) {
    try {
      const { data, error } = await this.supabase
        .from('report_schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Failed to fetch report schedules:', error)
      throw error
    }
  }

  /**
   * Get a specific schedule by ID
   * @param {string} scheduleId - The schedule ID
   * @param {string} userId - The user ID
   */
  async getSchedule(scheduleId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('report_schedules')
        .select('*')
        .eq('id', scheduleId)
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Failed to fetch report schedule:', error)
      throw error
    }
  }

  /**
   * Update a report schedule
   * @param {string} scheduleId - The schedule ID
   * @param {Object} updateData - The update data
   * @param {string} userId - The user ID
   */
  async updateSchedule(scheduleId, updateData, userId) {
    try {
      // Recalculate next generation date if frequency changed
      if (updateData.frequency || updateData.frequency_config || updateData.time_of_day || updateData.timezone) {
        const nextGenerationAt = await this.calculateNextGenerationDate(
          updateData.frequency,
          updateData.frequency_config,
          updateData.time_of_day,
          updateData.timezone
        )
        updateData.next_generation_at = nextGenerationAt
      }

      const { data, error } = await this.supabase
        .from('report_schedules')
        .update(updateData)
        .eq('id', scheduleId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Failed to update report schedule:', error)
      throw error
    }
  }

  /**
   * Delete a report schedule (soft delete)
   * @param {string} scheduleId - The schedule ID
   * @param {string} userId - The user ID
   */
  async deleteSchedule(scheduleId, userId) {
    try {
      const { error } = await this.supabase
        .from('report_schedules')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', scheduleId)
        .eq('user_id', userId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Failed to delete report schedule:', error)
      throw error
    }
  }

  /**
   * Toggle schedule active status
   * @param {string} scheduleId - The schedule ID
   * @param {boolean} isActive - The active status
   * @param {string} userId - The user ID
   */
  async toggleScheduleStatus(scheduleId, isActive, userId) {
    try {
      const updateData = { is_active: isActive }
      
      // If activating, recalculate next generation date
      if (isActive) {
        const schedule = await this.getSchedule(scheduleId, userId)
        const nextGenerationAt = await this.calculateNextGenerationDate(
          schedule.frequency,
          schedule.frequency_config,
          schedule.time_of_day,
          schedule.timezone
        )
        updateData.next_generation_at = nextGenerationAt
      }

      const { data, error } = await this.supabase
        .from('report_schedules')
        .update(updateData)
        .eq('id', scheduleId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Failed to toggle schedule status:', error)
      throw error
    }
  }

  /**
   * Get report execution history
   * @param {string} scheduleId - The schedule ID (optional)
   * @param {string} userId - The user ID
   * @param {number} limit - Number of records to return
   */
  async getExecutionHistory(scheduleId = null, userId, limit = 50) {
    try {
      let query = this.supabase
        .from('report_executions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Failed to fetch execution history:', error)
      throw error
    }
  }

  /**
   * Manually trigger a report generation
   * @param {string} scheduleId - The schedule ID
   * @param {string} userId - The user ID
   */
  async triggerManualGeneration(scheduleId, userId) {
    try {
      const schedule = await this.getSchedule(scheduleId, userId)
      if (!schedule) {
        throw new Error('Schedule not found')
      }

      // Generate the report
      const reportData = await this.generateReport(schedule)
      
      // Create execution record
      const executionId = await this.createExecutionRecord(schedule, reportData, userId)
      
      // Update schedule
      await this.updateScheduleAfterExecution(scheduleId, executionId)

      return { success: true, executionId, reportData }
    } catch (error) {
      console.error('Failed to trigger manual generation:', error)
      throw error
    }
  }

  /**
   * Calculate next generation date
   * @param {string} frequency - The frequency
   * @param {Object} frequencyConfig - The frequency configuration
   * @param {string} timeOfDay - The time of day
   * @param {string} timezone - The timezone
   */
  async calculateNextGenerationDate(frequency, frequencyConfig, timeOfDay, timezone) {
    try {
      const { data, error } = await this.supabase
        .rpc('calculate_next_report_generation', {
          frequency_param: frequency,
          frequency_config_param: frequencyConfig,
          time_of_day_param: timeOfDay,
          timezone_param: timezone
        })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Failed to calculate next generation date:', error)
      throw error
    }
  }

  /**
   * Generate a report based on schedule configuration
   * @param {Object} schedule - The schedule configuration
   */
  async generateReport(schedule) {
    try {
      let reportData

      switch (schedule.report_type) {
        case 'population':
          reportData = await reportsService.generatePopulationReport(schedule.user_id, schedule.report_period)
          break
        case 'health':
          reportData = await reportsService.generateHealthReport(schedule.user_id, schedule.report_period)
          break
        case 'financial':
          reportData = await reportsService.generateFinancialReport(schedule.user_id, schedule.report_period)
          break
        case 'breeding':
          reportData = await reportsService.generateBreedingReport(schedule.user_id, schedule.report_period)
          break
        case 'feeding':
          reportData = await reportsService.generateFeedingReport(schedule.user_id, schedule.report_period)
          break
        case 'comprehensive':{
          // Generate all reports and combine
          const [population, health, financial, breeding, feeding] = await Promise.all([
            reportsService.generatePopulationReport(schedule.user_id, schedule.report_period),
            reportsService.generateHealthReport(schedule.user_id, schedule.report_period),
            reportsService.generateFinancialReport(schedule.user_id, schedule.report_period),
            reportsService.generateBreedingReport(schedule.user_id, schedule.report_period),
            reportsService.generateFeedingReport(schedule.user_id, schedule.report_period)
          ])
          reportData = {
            type: 'comprehensive',
            generated_at: new Date().toISOString(),
            reports: {
              population,
              health,
              financial,
              breeding,
              feeding
            }
          }
          break
        }
        default:
          throw new Error(`Unknown report type: ${schedule.report_type}`)
      }

      // Apply custom filters if specified
      if (schedule.custom_filters) {
        reportData = this.applyCustomFilters(reportData, schedule.custom_filters)
      }

      return reportData
    } catch (error) {
      console.error('Failed to generate report:', error)
      throw error
    }
  }

  /**
   * Create an execution record
   * @param {Object} schedule - The schedule configuration
   * @param {Object} reportData - The generated report data
   * @param {string} userId - The user ID
   */
  async createExecutionRecord(schedule, reportData, userId) {
    try {
      const executionRecord = {
        schedule_id: schedule.id,
        report_type: schedule.report_type,
        generation_started_at: new Date().toISOString(),
        report_data: reportData,
        delivery_method: schedule.delivery_method,
        email_recipients: schedule.email_recipients,
        user_id: userId
      }

      const { data, error } = await this.supabase
        .from('report_executions')
        .insert([executionRecord])
        .select()
        .single()

      if (error) throw error

      return data.id
    } catch (error) {
      console.error('Failed to create execution record:', error)
      throw error
    }
  }

  /**
   * Update schedule after execution
   * @param {string} scheduleId - The schedule ID
   * @param {string} executionId - The execution ID
   */
  async updateScheduleAfterExecution(scheduleId, executionId) {
    try {
      const { error } = await this.supabase
        .rpc('update_report_schedule_after_execution', {
          schedule_id_param: scheduleId,
          execution_id_param: executionId
        })

      if (error) throw error

      return true
    } catch (error) {
      console.error('Failed to update schedule after execution:', error)
      throw error
    }
  }

  /**
   * Get schedules due for generation
   */
  async getDueSchedules() {
    try {
      const { data, error } = await this.supabase
        .rpc('get_due_report_schedules')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Failed to get due schedules:', error)
      throw error
    }
  }

  /**
   * Process all due schedules (for automated execution)
   */
  async processDueSchedules() {
    try {
      const dueSchedules = await this.getDueSchedules()
      const results = []

      for (const schedule of dueSchedules) {
        try {
          // Generate the report
          const reportData = await this.generateReport(schedule)
          
          // Create execution record
          const executionId = await this.createExecutionRecord(schedule, reportData, schedule.user_id)
          
          // Update schedule
          await this.updateScheduleAfterExecution(schedule.id, executionId)

          // Handle delivery
          if (schedule.delivery_method === 'email' || schedule.delivery_method === 'both') {
            await this.sendEmailDelivery(schedule, reportData, executionId)
          }

          results.push({
            scheduleId: schedule.id,
            success: true,
            executionId
          })
        } catch (error) {
          console.error(`Failed to process schedule ${schedule.id}:`, error)
          results.push({
            scheduleId: schedule.id,
            success: false,
            error: error.message
          })
        }
      }

      return results
    } catch (error) {
      console.error('Failed to process due schedules:', error)
      throw error
    }
  }

  /**
   * Send email delivery (placeholder for future implementation)
   * @param {Object} schedule - The schedule configuration
   * @param {Object} reportData - The report data
   * @param {string} executionId - The execution ID
   */
  async sendEmailDelivery(schedule, reportData, executionId) {
    try {
      // This is a placeholder for email delivery
      // In a real implementation, you would:
      // 1. Generate PDF/Excel file from reportData
      // 2. Send email with attachment
      // 3. Update execution record with delivery status
      
      console.log(`Email delivery would be sent for schedule ${schedule.id} to ${schedule.email_recipients}`)
      
      // Update execution record
      await this.supabase
        .from('report_executions')
        .update({
          delivery_status: 'sent',
          email_sent_at: new Date().toISOString()
        })
        .eq('id', executionId)

      return true
    } catch (error) {
      console.error('Failed to send email delivery:', error)
      
      // Update execution record with error
      await this.supabase
        .from('report_executions')
        .update({
          delivery_status: 'failed',
          delivery_error: error.message
        })
        .eq('id', executionId)

      throw error
    }
  }

  /**
   * Apply custom filters to report data
   * @param {Object} reportData - The report data
   * @param {Object} filters - The custom filters
   */
  applyCustomFilters(reportData) {
    // This is a placeholder for custom filter application
    // In a real implementation, you would apply various filters
    // based on the filter configuration
    
    return reportData
  }

  /**
   * Get schedule statistics
   * @param {string} userId - The user ID
   */
  async getScheduleStats(userId) {
    try {
      const schedules = await this.getSchedules(userId)
      const executions = await this.getExecutionHistory(null, userId, 1000)

      const stats = {
        totalSchedules: schedules.length,
        activeSchedules: schedules.filter(s => s.is_active).length,
        totalExecutions: executions.length,
        successfulExecutions: executions.filter(e => e.delivery_status === 'sent').length,
        failedExecutions: executions.filter(e => e.delivery_status === 'failed').length,
        pendingExecutions: executions.filter(e => e.delivery_status === 'pending').length,
        nextScheduled: schedules
          .filter(s => s.is_active && s.next_generation_at)
          .sort((a, b) => new Date(a.next_generation_at) - new Date(b.next_generation_at))
          .slice(0, 5)
      }

      return stats
    } catch (error) {
      console.error('Failed to get schedule stats:', error)
      throw error
    }
  }
}

export const reportSchedulingService = new ReportSchedulingService()
