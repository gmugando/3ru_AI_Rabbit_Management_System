<template>
  <div class="upcoming-events-widget">
    <div class="widget-header">
      <h3>
        <i class="pi pi-calendar"></i>
        Upcoming Events
      </h3>
      <button @click="viewAllEvents" class="view-all-btn">
        <i class="pi pi-external-link"></i>
        View All
      </button>
    </div>
    
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading events...</span>
    </div>
    
    <div v-else-if="error" class="error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchEvents" class="retry-btn">Retry</button>
    </div>
    
    <div v-else-if="events.length === 0" class="empty-state">
      <i class="pi pi-calendar"></i>
      <p>No upcoming events</p>
      <button @click="addEvent" class="add-btn">
        <i class="pi pi-plus"></i>
        Schedule Event
      </button>
    </div>
    
    <div v-else class="events-list">
      <div 
        v-for="event in events" 
        :key="event.id" 
        class="event-item"
        :class="{ 'overdue': isOverdue(event), 'today': isToday(event) }"
        @click="viewEvent(event)"
      >
        <div class="event-icon">
          <i :class="getEventIcon(event.event_type)"></i>
        </div>
        
        <div class="event-details">
          <div class="event-title">{{ event.title }}</div>
          <div class="event-meta">
            <span class="event-date">{{ formatEventDate(event.start_date) }}</span>
            <span v-if="event.start_time" class="event-time">
              {{ formatTime(event.start_time) }}
            </span>
            <span v-if="event.rabbit_name" class="event-rabbit">
              {{ event.rabbit_name }}
            </span>
          </div>
        </div>
        
        <div class="event-status">
          <span class="priority-indicator" :class="event.priority"></span>
          <span v-if="isOverdue(event)" class="overdue-badge">Overdue</span>
          <span v-else-if="isToday(event)" class="today-badge">Today</span>
        </div>
      </div>
    </div>
    
    <div v-if="events.length > 0" class="widget-footer">
      <button @click="viewAllEvents" class="view-all-link">
        View all {{ totalEvents }} events →
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'UpcomingEventsWidget',
  props: {
    limit: {
      type: Number,
      default: 5
    },
    eventTypes: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const router = useRouter()
    const isLoading = ref(false)
    const error = ref('')
    const events = ref([])
    const totalEvents = ref(0)
    
    const fetchEvents = async () => {
      try {
        isLoading.value = true
        error.value = ''
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        
        // Build query
        let query = supabase
          .from('schedule_events_with_rabbit')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .in('status', ['scheduled', 'in_progress'])
          .gte('start_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true })
          .order('start_time', { ascending: true })
        
        // Filter by event types if specified
        if (props.eventTypes.length > 0) {
          query = query.in('event_type', props.eventTypes)
        }
        
        // Get limited results for widget
        const { data, error: eventsError } = await query.limit(props.limit)
        
        // Fallback to basic table if view doesn't exist
        if (eventsError && eventsError.code === '42P01') {
          console.log('Using basic schedule_events table for widget')
          let basicQuery = supabase
            .from('schedule_events')
            .select(`
              *,
              rabbits:rabbit_id (
                name,
                breed
              )
            `)
            .eq('user_id', user.id)
            .eq('is_deleted', false)
            .in('status', ['scheduled', 'in_progress'])
            .gte('start_date', new Date().toISOString().split('T')[0])
            .order('start_date', { ascending: true })
            .order('start_time', { ascending: true })
          
          if (props.eventTypes.length > 0) {
            basicQuery = basicQuery.in('event_type', props.eventTypes)
          }
          
          const basicResult = await basicQuery.limit(props.limit)
          if (basicResult.error) throw basicResult.error
          
          // Transform data to match expected format
          events.value = basicResult.data?.map(event => ({
            ...event,
            rabbit_name: event.rabbits?.name || null,
            breed: event.rabbits?.breed || null
          })) || []
        } else if (eventsError) {
          throw eventsError
        } else {
          events.value = data || []
        }
        
        // Get total count for footer
        const { count } = await supabase
          .from('schedule_events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .in('status', ['scheduled', 'in_progress'])
          .gte('start_date', new Date().toISOString().split('T')[0])
        
        totalEvents.value = count || 0
        
      } catch (err) {
        console.error('Failed to load upcoming events:', err)
        error.value = 'Failed to load events'
      } finally {
        isLoading.value = false
      }
    }
    
    const viewAllEvents = () => {
      router.push('/schedule/events')
    }
    
    const addEvent = () => {
      router.push('/schedule/add')
    }
    
    const viewEvent = () => {
      router.push('/schedule/events') // Could enhance to open specific event
    }
    
    const isToday = (event) => {
      return event.start_date === new Date().toISOString().split('T')[0]
    }
    
    const isOverdue = (event) => {
      return event.start_date < new Date().toISOString().split('T')[0]
    }
    
    const formatEventDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      if (d.toDateString() === today.toDateString()) {
        return 'Today'
      } else if (d.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow'
      } else {
        const diffTime = d.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays <= 7) {
          return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        } else {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
      }
    }
    
    const formatTime = (time) => {
      if (!time) return ''
      const [hours, minutes] = time.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    
    const getEventIcon = (type) => {
      const icons = {
        breeding: 'pi pi-heart',
        feeding: 'pi pi-shopping-cart',
        health: 'pi pi-heart-fill',
        maintenance: 'pi pi-wrench',
        general: 'pi pi-calendar'
      }
      return icons[type] || 'pi pi-calendar'
    }
    
    onMounted(() => {
      fetchEvents()
    })
    
    return {
      isLoading,
      error,
      events,
      totalEvents,
      fetchEvents,
      viewAllEvents,
      addEvent,
      viewEvent,
      isToday,
      isOverdue,
      formatEventDate,
      formatTime,
      getEventIcon
    }
  }
}
</script>

<style scoped>
.upcoming-events-widget {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.widget-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-all-btn {
  background: none;
  border: none;
  color: #007bff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.view-all-btn:hover {
  background: #e7f3ff;
}

.loading-state, .error-state, .empty-state {
  padding: 40px 25px;
  text-align: center;
  color: #666;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state i, .empty-state i {
  font-size: 32px;
  margin-bottom: 10px;
  color: #ccc;
}

.retry-btn, .add-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  margin-right: auto;
}

.events-list {
  max-height: 400px;
  overflow-y: auto;
}

.event-item {
  display: flex;
  align-items: center;
  padding: 15px 25px;
  border-bottom: 1px solid #f1f3f4;
  cursor: pointer;
  transition: all 0.3s ease;
}

.event-item:hover {
  background: #f8f9fa;
}

.event-item:last-child {
  border-bottom: none;
}

.event-item.today {
  background: #e7f3ff;
  border-left: 4px solid #007bff;
}

.event-item.overdue {
  background: #fff5f5;
  border-left: 4px solid #dc3545;
}

.event-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e7f3ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: #007bff;
  font-size: 16px;
}

.event-item.overdue .event-icon {
  background: #fff5f5;
  color: #dc3545;
}

.event-item.today .event-icon {
  background: #007bff;
  color: white;
}

.event-details {
  flex: 1;
}

.event-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  font-size: 14px;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
}

.event-date {
  font-weight: 500;
}

.event-time, .event-rabbit {
  color: #999;
}

.event-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.priority-indicator.low {
  background: #28a745;
}

.priority-indicator.medium {
  background: #ffc107;
}

.priority-indicator.high {
  background: #fd7e14;
}

.priority-indicator.urgent {
  background: #dc3545;
}

.today-badge, .overdue-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.today-badge {
  background: #cce5ff;
  color: #004085;
}

.overdue-badge {
  background: #f5c6cb;
  color: #491217;
}

.widget-footer {
  padding: 15px 25px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  text-align: center;
}

.view-all-link {
  background: none;
  border: none;
  color: #007bff;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}

.view-all-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .widget-header, .events-list .event-item, .widget-footer {
    padding-left: 15px;
    padding-right: 15px;
  }
  
  .event-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .event-icon {
    width: 32px;
    height: 32px;
    margin-right: 12px;
  }
}
</style>
