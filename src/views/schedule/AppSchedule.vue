<template>
  <div class="schedule-page">
    <div class="page-header">
      <div>
        <h1>Schedule Management</h1>
        <p class="subtitle">Plan and track farm activities</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button">
          <i class="pi pi-filter"></i>
          Filter
        </button>
        <button class="primary-button" @click="addEvent">
          <i class="pi pi-plus"></i>
          Add Event
        </button>
      </div>
    </div>

    <div class="schedule-grid">
      <!-- Calendar Navigation -->
      <div class="calendar-nav">
        <div class="content-card">
          <div class="calendar-header">
            <h3>Calendar</h3>
            <div class="calendar-actions">
              <button class="nav-button" @click="navigateMonth(-1)">
                <i class="pi pi-chevron-left"></i>
              </button>
              <span class="current-month">{{ currentMonth }}</span>
              <button class="nav-button" @click="navigateMonth(1)">
                <i class="pi pi-chevron-right"></i>
              </button>
            </div>
          </div>
          <div class="mini-calendar">
            <!-- Mini calendar grid would go here -->
          </div>
          <div class="calendar-filters">
            <h4>Event Types</h4>
            <div class="filter-list">
              <label class="filter-item">
                <input type="checkbox" v-model="eventFilters.breeding" />
                <span class="filter-color breeding"></span>
                Breeding Events
              </label>
              <label class="filter-item">
                <input type="checkbox" v-model="eventFilters.feeding" />
                <span class="filter-color feeding"></span>
                Feeding Schedule
              </label>
              <label class="filter-item">
                <input type="checkbox" v-model="eventFilters.health" />
                <span class="filter-color health"></span>
                Health Checks
              </label>
              <label class="filter-item">
                <input type="checkbox" v-model="eventFilters.maintenance" />
                <span class="filter-color maintenance"></span>
                Maintenance
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule Content -->
      <div class="schedule-content">
        <div class="content-card">
          <div class="schedule-header">
            <div class="view-options">
              <button class="view-option" :class="{ active: currentView === 'Day' }" @click="changeView('Day')">Day</button>
              <button class="view-option" :class="{ active: currentView === 'Week' }" @click="changeView('Week')">Week</button>
              <button class="view-option" :class="{ active: currentView === 'Month' }" @click="changeView('Month')">Month</button>
            </div>
            <button class="secondary-button" @click="goToToday">
              <i class="pi pi-calendar"></i>
              Today
            </button>
          </div>

          <!-- Day View -->
          <div class="schedule-timeline">
            <div class="timeline-header">
              <div class="date-cell current">
                <span class="day">{{ todayDateInfo.day }}</span>
                <span class="date">{{ todayDateInfo.date }}</span>
              </div>
            </div>

            <div v-if="isLoading" class="loading-state">
              <i class="pi pi-spinner pi-spin"></i>
              <span>Loading today's events...</span>
            </div>
            
            <div v-else-if="error" class="error-state">
              <i class="pi pi-exclamation-triangle"></i>
              <span>{{ error }}</span>
              <button @click="fetchTodayEvents" class="retry-btn">
                <i class="pi pi-refresh"></i>
                Retry
              </button>
            </div>
            
            <div v-else-if="filteredTodayEvents.length > 0" class="timeline-events">
              <div v-for="event in filteredTodayEvents" :key="event.id" class="event-item" :class="event.event_type">
                <div class="event-time">
                  {{ event.start_time ? formatTime(event.start_time) : 'All Day' }}
                </div>
                <div class="event-content">
                  <h4>{{ event.title }}</h4>
                  <p v-if="event.description">{{ event.description }}</p>
                  <p v-else-if="event.rabbit_name">{{ event.rabbit_name }} ({{ event.rabbit_tag }})</p>
                  <p v-else-if="event.location">{{ event.location }}</p>
                </div>
                <div class="event-status" v-if="event.priority === 'high' || event.priority === 'urgent'">
                  <span class="priority-badge" :class="event.priority">{{ event.priority }}</span>
                </div>
              </div>
            </div>
            
            <div v-else class="empty-state">
              <i class="pi pi-calendar"></i>
              <p>No events scheduled for today</p>
              <button class="primary-button small" @click="addEvent">
                <i class="pi pi-plus"></i>
                Add Event
              </button>
            </div>
          </div>
        </div>

        <!-- Upcoming Events -->
        <div class="content-card">
          <div class="card-header">
            <h3>Upcoming Events</h3>
            <button class="card-action-btn" @click="viewAllEvents">View All</button>
          </div>
          
          <div v-if="isLoadingUpcoming" class="loading-state">
            <i class="pi pi-spinner pi-spin"></i>
            <span>Loading upcoming events...</span>
          </div>
          
          <div v-else-if="upcomingError" class="error-state">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ upcomingError }}</span>
            <button @click="fetchUpcomingEvents" class="retry-btn">
              <i class="pi pi-refresh"></i>
              Retry
            </button>
          </div>
          
          <div v-else-if="upcomingEvents.length > 0" class="upcoming-events">
            <div v-for="event in upcomingEvents" :key="event.id" class="event-item">
              <div class="event-marker" :class="event.event_type"></div>
              <div class="event-details">
                <div class="event-info">
                  <h4>{{ event.title }}</h4>
                  <p v-if="event.rabbit_name">{{ event.rabbit_name }} ({{ event.rabbit_tag }})</p>
                  <p v-else-if="event.description">{{ event.description }}</p>
                </div>
                <span class="event-date">{{ formatEventDate(event.start_date, event.start_time) }}</span>
                <span v-if="event.priority === 'high' || event.priority === 'urgent'" class="priority-indicator" :class="event.priority">
                  {{ event.priority }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <i class="pi pi-calendar-plus"></i>
            <p>No upcoming events</p>
            <button class="primary-button small" @click="addEvent">
              <i class="pi pi-plus"></i>
              Schedule Event
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'AppSchedule',
  setup() {
    const router = useRouter()
    
    // Data state
    const isLoading = ref(false)
    const isLoadingUpcoming = ref(false)
    const error = ref('')
    const upcomingError = ref('')
    
    // Calendar state
    const currentDate = ref(new Date())
    const currentView = ref('Day')
    const selectedDate = ref(new Date())
    
    // Events data
    const todayEvents = ref([])
    const upcomingEvents = ref([])
    const eventFilters = reactive({
      breeding: true,
      feeding: true,
      health: true,
      maintenance: true
    })
    
    // Computed properties
    const currentMonth = computed(() => {
      return currentDate.value.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    })
    
    const filteredTodayEvents = computed(() => {
      return todayEvents.value.filter(event => eventFilters[event.event_type])
    })
    
    const todayDateInfo = computed(() => {
      const today = new Date()
      return {
        day: today.toLocaleDateString('en-US', { weekday: 'short' }),
        date: today.getDate()
      }
    })
    
    // Methods
    const addEvent = () => {
      router.push('/schedule/add')
    }
    
    const viewAllEvents = () => {
      router.push('/schedule/events')
    }
    
    const changeView = (view) => {
      currentView.value = view
      if (view === 'Day') {
        fetchTodayEvents()
      }
    }
    
    const navigateMonth = (direction) => {
      const newDate = new Date(currentDate.value)
      newDate.setMonth(newDate.getMonth() + direction)
      currentDate.value = newDate
    }
    
    const goToToday = () => {
      currentDate.value = new Date()
      selectedDate.value = new Date()
      fetchTodayEvents()
    }
    
    // Fetch today's events
    const fetchTodayEvents = async () => {
      try {
        isLoading.value = true
        error.value = ''
        
        const today = new Date().toISOString().split('T')[0]
        
        const { data, error: fetchError } = await supabase
          .from('schedule_events_with_rabbit')
          .select('*')
          .eq('start_date', today)
          .order('start_time', { ascending: true })
        
        if (fetchError) throw fetchError
        
        todayEvents.value = data || []
        console.log('Fetched today events:', data?.length || 0)
        
      } catch (err) {
        console.error('Error fetching today events:', err)
        error.value = 'Failed to load today\'s events'
        // Fallback to mock data for now
        todayEvents.value = []
      } finally {
        isLoading.value = false
      }
    }
    
    // Fetch upcoming events
    const fetchUpcomingEvents = async () => {
      try {
        isLoadingUpcoming.value = true
        upcomingError.value = ''
        
        const { data, error: fetchError } = await supabase
          .rpc('get_upcoming_events', { 
            days_ahead: 7, 
            limit_count: 5 
          })
        
        if (fetchError) throw fetchError
        
        upcomingEvents.value = data || []
        console.log('Fetched upcoming events:', data?.length || 0)
        
      } catch (err) {
        console.error('Error fetching upcoming events:', err)
        upcomingError.value = 'Failed to load upcoming events'
        // Fallback to mock data for now
        upcomingEvents.value = []
      } finally {
        isLoadingUpcoming.value = false
      }
    }
    
    // Format time for display
    const formatTime = (timeString) => {
      if (!timeString) return ''
      const time = new Date(`2000-01-01T${timeString}`)
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
    
    // Format event date for upcoming events
    const formatEventDate = (dateString, timeString) => {
      const date = new Date(dateString)
      const today = new Date()
      const tomorrow = new Date()
      tomorrow.setDate(today.getDate() + 1)
      
      let dateStr
      if (date.toDateString() === today.toDateString()) {
        dateStr = 'Today'
      } else if (date.toDateString() === tomorrow.toDateString()) {
        dateStr = 'Tomorrow'
      } else {
        dateStr = date.toLocaleDateString('en-US', { weekday: 'short' })
      }
      
      if (timeString) {
        dateStr += `, ${formatTime(timeString)}`
      }
      
      return dateStr
    }
    
    // Get event type icon
    const getEventIcon = (eventType) => {
      const icons = {
        breeding: 'pi-heart',
        feeding: 'pi-apple',
        health: 'pi-plus-circle',
        maintenance: 'pi-wrench'
      }
      return icons[eventType] || 'pi-calendar'
    }
    
    onMounted(() => {
      fetchTodayEvents()
      fetchUpcomingEvents()
    })
    
    return {
      isLoading,
      isLoadingUpcoming,
      error,
      upcomingError,
      currentDate,
      currentView,
      selectedDate,
      todayEvents,
      upcomingEvents,
      eventFilters,
      currentMonth,
      filteredTodayEvents,
      todayDateInfo,
      addEvent,
      viewAllEvents,
      changeView,
      navigateMonth,
      goToToday,
      fetchTodayEvents,
      fetchUpcomingEvents,
      formatTime,
      formatEventDate,
      getEventIcon
    }
  }
}
</script>

<style scoped>
.schedule-page {
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

.schedule-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
}

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.calendar-header h3 {
  margin: 0;
  color: #1e293b;
}

.calendar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-button {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-button:hover {
  color: #3b82f6;
}

.current-month {
  font-weight: 500;
  color: #1e293b;
}

.calendar-filters {
  margin-top: 1.5rem;
}

.calendar-filters h4 {
  margin: 0 0 1rem 0;
  color: #1e293b;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.filter-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.filter-color.breeding { background: #3b82f6; }
.filter-color.feeding { background: #10b981; }
.filter-color.health { background: #f59e0b; }
.filter-color.maintenance { background: #8b5cf6; }

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.view-options {
  display: flex;
  gap: 0.5rem;
}

.view-option {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-option:hover {
  background: #f8fafc;
}

.view-option.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
}

.timeline-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.date-cell:hover {
  background: #f8fafc;
}

.date-cell.current {
  background: #eff6ff;
  color: #3b82f6;
}

.date-cell .day {
  font-size: 0.875rem;
  color: #64748b;
}

.date-cell .date {
  font-size: 1.25rem;
  font-weight: 500;
}

.timeline-events {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f8fafc;
}

.event-item.breeding { border-left: 4px solid #3b82f6; }
.event-item.feeding { border-left: 4px solid #10b981; }
.event-item.health { border-left: 4px solid #f59e0b; }
.event-item.maintenance { border-left: 4px solid #8b5cf6; }

.event-time {
  min-width: 80px;
  color: #64748b;
}

.event-content h4 {
  margin: 0;
  color: #1e293b;
}

.event-content p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  color: #1e293b;
}

.card-action-btn {
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-action-btn:hover {
  background: #f1f5f9;
}

.upcoming-events {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upcoming-events .event-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: none;
}

.event-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.event-marker.breeding { background: #3b82f6; }
.event-marker.health { background: #f59e0b; }

.event-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-info h4 {
  margin: 0;
  color: #1e293b;
}

.event-info p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.event-date {
  font-size: 0.875rem;
  color: #64748b;
}

/* Loading and Error States */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: #64748b;
  text-align: center;
}

.error-state {
  color: #dc2626;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #b91c1c;
}

.empty-state p {
  margin: 0.5rem 0 1rem 0;
}

.primary-button.small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Priority indicators */
.priority-badge, .priority-indicator {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge.high, .priority-indicator.high {
  background: #fef3c7;
  color: #d97706;
}

.priority-badge.urgent, .priority-indicator.urgent {
  background: #fef2f2;
  color: #dc2626;
}

.event-status {
  margin-left: auto;
}

.priority-indicator {
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

/* Event marker colors for more types */
.event-marker.general { background: #6b7280; }

.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .schedule-grid {
    grid-template-columns: 1fr;
  }

  .calendar-nav {
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 768px) {
  .event-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .event-date {
    align-self: flex-start;
  }
}
</style> 