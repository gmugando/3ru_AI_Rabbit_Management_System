import { supabase } from '@/supabase'

/**
 * Schedule Integration Service
 * Automatically creates and manages schedule events for farm activities
 */
export class ScheduleIntegrationService {
  constructor() {
    this.supabase = supabase
  }

  /**
   * Create a schedule event for health follow-ups
   * @param {Object} healthRecord - The health record data
   * @param {string} userId - The user ID
   */
  async createHealthFollowUpEvent(healthRecord, userId) {
    if (!healthRecord.follow_up_required || !healthRecord.follow_up_date) {
      return null
    }

    try {
      const eventData = {
        title: `Health Follow-up: ${healthRecord.condition || 'Check-up'}`,
        description: `Follow-up appointment for ${healthRecord.condition}${healthRecord.treatment_type ? ` (${healthRecord.treatment_type})` : ''}`,
        event_type: 'health',
        start_date: healthRecord.follow_up_date,
        start_time: '09:00', // Default morning appointment
        rabbit_id: healthRecord.rabbit_id,
        priority: this.getHealthPriority(healthRecord.severity),
        status: 'scheduled',
        related_record_id: healthRecord.id,
        related_record_type: 'health_record',
        completion_notes: `Scheduled follow-up for health record ${healthRecord.id}`,
        user_id: userId
      }

      const { data, error } = await this.supabase
        .from('schedule_events')
        .insert([eventData])
        .select()

      if (error) throw error
      
      console.log('Created health follow-up event:', data[0])
      return data[0]
    } catch (error) {
      console.error('Failed to create health follow-up event:', error)
      throw error
    }
  }

  /**
   * Create schedule events for treatment reminders
   * @param {Object} healthRecord - The health record data
   * @param {string} userId - The user ID
   */
  async createTreatmentReminders(healthRecord, userId) {
    if (!healthRecord.treatment_start_date || !healthRecord.treatment_duration || !healthRecord.frequency) {
      return []
    }

    try {
      const events = []
      const startDate = new Date(healthRecord.treatment_start_date)
      const duration = parseInt(healthRecord.treatment_duration)
      const frequency = healthRecord.frequency

      // Calculate reminder dates based on frequency
      const reminderDates = this.calculateTreatmentDates(startDate, duration, frequency)

      for (const date of reminderDates) {
        const eventData = {
          title: `Treatment Reminder: ${healthRecord.medication || 'Medication'}`,
          description: `Administer ${healthRecord.medication || 'treatment'} (${healthRecord.dosage || 'prescribed dosage'})`,
          event_type: 'health',
          start_date: date.toISOString().split('T')[0],
          start_time: this.getTreatmentTime(frequency),
          rabbit_id: healthRecord.rabbit_id,
          priority: 'high',
          status: 'scheduled',
          related_record_id: healthRecord.id,
          related_record_type: 'health_record',
          completion_notes: `Treatment reminder for ${healthRecord.medication || 'medication'}`,
          user_id: userId
        }

        events.push(eventData)
      }

      if (events.length > 0) {
        const { data, error } = await this.supabase
          .from('schedule_events')
          .insert(events)
          .select()

        if (error) throw error
        
        console.log(`Created ${data.length} treatment reminder events`)
        return data
      }

      return []
    } catch (error) {
      console.error('Failed to create treatment reminders:', error)
      throw error
    }
  }

  /**
   * Create breeding milestone events
   * @param {Object} breedingPlan - The breeding plan data
   * @param {string} userId - The user ID
   */
  async createBreedingMilestones(breedingPlan, userId) {
    try {
      const events = []
      const plannedDate = new Date(breedingPlan.planned_date)
      const expectedKindleDate = new Date(breedingPlan.expected_kindle_date)

      // Breeding day event
      events.push({
        title: `Breeding: ${breedingPlan.buck_name} × ${breedingPlan.doe_name}`,
        description: `Planned breeding between ${breedingPlan.buck_name} (buck) and ${breedingPlan.doe_name} (doe)`,
        event_type: 'breeding',
        start_date: breedingPlan.planned_date,
        start_time: '10:00',
        rabbit_id: breedingPlan.doe_id, // Primary focus on doe
        priority: 'high',
        status: 'scheduled',
        related_record_id: breedingPlan.id,
        related_record_type: 'breeding_plan',
        completion_notes: `Breeding plan ${breedingPlan.plan_id}`,
        user_id: userId
      })

      // Pregnancy check (14 days after breeding)
      const pregnancyCheckDate = new Date(plannedDate)
      pregnancyCheckDate.setDate(pregnancyCheckDate.getDate() + 14)
      
      events.push({
        title: `Pregnancy Check: ${breedingPlan.doe_name}`,
        description: `Check if ${breedingPlan.doe_name} is pregnant from breeding with ${breedingPlan.buck_name}`,
        event_type: 'health',
        start_date: pregnancyCheckDate.toISOString().split('T')[0],
        start_time: '09:00',
        rabbit_id: breedingPlan.doe_id,
        priority: 'medium',
        status: 'scheduled',
        related_record_id: breedingPlan.id,
        related_record_type: 'breeding_plan',
        completion_notes: `Pregnancy check for breeding plan ${breedingPlan.plan_id}`,
        user_id: userId
      })

      // Nest box preparation (3 days before kindle)
      const nestBoxDate = new Date(expectedKindleDate)
      nestBoxDate.setDate(nestBoxDate.getDate() - 3)
      
      events.push({
        title: `Nest Box Setup: ${breedingPlan.doe_name}`,
        description: `Prepare nest box for ${breedingPlan.doe_name} - kindling expected in 3 days`,
        event_type: 'breeding',
        start_date: nestBoxDate.toISOString().split('T')[0],
        start_time: '08:00',
        rabbit_id: breedingPlan.doe_id,
        priority: 'high',
        status: 'scheduled',
        related_record_id: breedingPlan.id,
        related_record_type: 'breeding_plan',
        completion_notes: `Nest box preparation for breeding plan ${breedingPlan.plan_id}`,
        user_id: userId
      })

      // Expected kindling day
      events.push({
        title: `Expected Kindling: ${breedingPlan.doe_name}`,
        description: `${breedingPlan.doe_name} expected to kindle today. Monitor closely.`,
        event_type: 'breeding',
        start_date: breedingPlan.expected_kindle_date,
        start_time: '06:00',
        rabbit_id: breedingPlan.doe_id,
        priority: 'urgent',
        status: 'scheduled',
        related_record_id: breedingPlan.id,
        related_record_type: 'breeding_plan',
        completion_notes: `Expected kindling for breeding plan ${breedingPlan.plan_id}`,
        user_id: userId
      })

      // Kit check (1 day after kindling)
      const kitCheckDate = new Date(expectedKindleDate)
      kitCheckDate.setDate(kitCheckDate.getDate() + 1)
      
      events.push({
        title: `Kit Health Check: ${breedingPlan.doe_name}`,
        description: `Check health of newborn kits and doe after kindling`,
        event_type: 'health',
        start_date: kitCheckDate.toISOString().split('T')[0],
        start_time: '10:00',
        rabbit_id: breedingPlan.doe_id,
        priority: 'high',
        status: 'scheduled',
        related_record_id: breedingPlan.id,
        related_record_type: 'breeding_plan',
        completion_notes: `Kit health check for breeding plan ${breedingPlan.plan_id}`,
        user_id: userId
      })

      const { data, error } = await this.supabase
        .from('schedule_events')
        .insert(events)
        .select()

      if (error) throw error
      
      console.log(`Created ${data.length} breeding milestone events`)
      return data
    } catch (error) {
      console.error('Failed to create breeding milestones:', error)
      throw error
    }
  }

  /**
   * Create feeding schedule reminders
   * @param {Object} feedingSchedule - The feeding schedule data
   * @param {string} userId - The user ID
   */
  async createFeedingReminders(feedingSchedule, userId) {
    try {
      const events = []
      const today = new Date()
      const daysToSchedule = 30 // Schedule for next 30 days

      for (let i = 0; i < daysToSchedule; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' })
        
        // Check if this day is in the feeding schedule
        if (feedingSchedule.days_of_week && feedingSchedule.days_of_week.includes(dayName)) {
          const eventData = {
            title: `Feed Schedule: ${feedingSchedule.feed_type}`,
            description: `Feed ${feedingSchedule.amount}${feedingSchedule.unit} of ${feedingSchedule.feed_type}${feedingSchedule.sections ? ` to sections: ${feedingSchedule.sections}` : ''}`,
            event_type: 'feeding',
            start_date: date.toISOString().split('T')[0],
            start_time: feedingSchedule.feeding_time || '07:00',
            priority: 'medium',
            status: 'scheduled',
            related_record_id: feedingSchedule.id,
            related_record_type: 'feeding_schedule',
            completion_notes: `Feeding schedule ${feedingSchedule.schedule_name || 'reminder'}`,
            user_id: userId
          }

          events.push(eventData)
        }
      }

      if (events.length > 0) {
        const { data, error } = await this.supabase
          .from('schedule_events')
          .insert(events)
          .select()

        if (error) throw error
        
        console.log(`Created ${data.length} feeding reminder events`)
        return data
      }

      return []
    } catch (error) {
      console.error('Failed to create feeding reminders:', error)
      throw error
    }
  }

  /**
   * Update related events when a record is completed
   * @param {string} recordId - The related record ID
   * @param {string} recordType - The type of record
   * @param {string} completedBy - Who completed the task
   */
  async markRelatedEventsCompleted(recordId, recordType, completedBy = 'User') {
    try {
      const { data, error } = await this.supabase
        .from('schedule_events')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: completedBy
        })
        .eq('related_record_id', recordId)
        .eq('related_record_type', recordType)
        .eq('status', 'scheduled')
        .select()

      if (error) throw error
      
      console.log(`Marked ${data.length} related events as completed`)
      return data
    } catch (error) {
      console.error('Failed to mark related events as completed:', error)
      throw error
    }
  }

  /**
   * Helper method to get health priority based on severity
   */
  getHealthPriority(severity) {
    const priorityMap = {
      'mild': 'low',
      'moderate': 'medium',
      'severe': 'high',
      'critical': 'urgent'
    }
    return priorityMap[severity] || 'medium'
  }

  /**
   * Helper method to calculate treatment dates based on frequency
   */
  calculateTreatmentDates(startDate, duration, frequency) {
    const dates = []
    const frequencyMap = {
      'once_daily': 1,
      'twice_daily': 0.5,
      'three_times_daily': 0.33,
      'every_other_day': 2,
      'weekly': 7,
      'as_needed': null, // Don't schedule automatic reminders
      'single_dose': null // Single dose, no recurring reminders
    }

    const intervalDays = frequencyMap[frequency]
    if (!intervalDays) return dates

    let currentDate = new Date(startDate)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + duration)

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      
      if (intervalDays < 1) {
        // Multiple times per day - add multiple entries for same day
        const timesPerDay = Math.round(1 / intervalDays)
        for (let i = 1; i < timesPerDay; i++) {
          dates.push(new Date(currentDate))
        }
        currentDate.setDate(currentDate.getDate() + 1)
      } else {
        currentDate.setDate(currentDate.getDate() + intervalDays)
      }
    }

    return dates
  }

  /**
   * Helper method to get appropriate treatment time based on frequency
   */
  getTreatmentTime(frequency) {
    const timeMap = {
      'once_daily': '09:00',
      'twice_daily': '08:00', // First dose, could add second dose logic
      'three_times_daily': '08:00', // First dose
      'every_other_day': '09:00',
      'weekly': '09:00',
      'as_needed': '09:00',
      'single_dose': '09:00'
    }
    return timeMap[frequency] || '09:00'
  }
}

// Export singleton instance
export const scheduleIntegration = new ScheduleIntegrationService()
