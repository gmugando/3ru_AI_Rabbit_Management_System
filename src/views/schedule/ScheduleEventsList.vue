<template>
  <div class="events-list-page">
    <div class="page-header">
      <div>
        <h1>All Schedule Events</h1>
        <p class="subtitle">View and manage all scheduled farm activities</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="$router.go(-1)">
          <i class="pi pi-arrow-left"></i>
          Back
        </button>
        <button class="primary-button" @click="addEvent">
          <i class="pi pi-plus"></i>
          Add Event
        </button>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="content-card filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label for="search">Search Events</label>
          <div class="search-input">
            <i class="pi pi-search"></i>
            <input
              id="search"
              v-model="filters.search"
              type="text"
              placeholder="Search by title, description, or rabbit name..."
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label for="event-type">Event Type</label>
          <select id="event-type" v-model="filters.eventType" class="filter-select">
            <option value="">All Types</option>
            <option value="breeding">Breeding</option>
            <option value="feeding">Feeding</option>
            <option value="health">Health</option>
            <option value="maintenance">Maintenance</option>
            <option value="general">General</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="status">Status</label>
          <select id="status" v-model="filters.status" class="filter-select">
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="priority">Priority</label>
          <select id="priority" v-model="filters.priority" class="filter-select">
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="date-range">Date Range</label>
          <select id="date-range" v-model="filters.dateRange" class="filter-select">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Events Table -->
    <div class="content-card">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading events...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button @click="fetchEvents" class="retry-btn">Try Again</button>
      </div>

      <div v-else-if="filteredEvents.length === 0" class="empty-state">
        <i class="pi pi-calendar"></i>
        <p>No events found</p>
        <p class="empty-subtitle">
          {{ hasFilters ? 'Try adjusting your filters' : 'Create your first scheduled event' }}
        </p>
        <button v-if="!hasFilters" @click="addEvent" class="primary-button">
          <i class="pi pi-plus"></i>
          Add Event
        </button>
      </div>

      <div v-else class="table-container">
        <table class="events-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Type</th>
              <th>Date & Time</th>
              <th>Rabbit</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in paginatedEvents" :key="event.id" class="event-row">
              <td class="event-info">
                <div class="event-title">{{ event.title }}</div>
                <div v-if="event.description" class="event-description">
                  {{ event.description }}
                </div>
                <div v-if="event.location" class="event-location">
                  <i class="pi pi-map-marker"></i>
                  {{ event.location }}
                </div>
              </td>
              
              <td>
                <span class="event-type-badge" :class="event.event_type">
                  <i :class="getEventIcon(event.event_type)"></i>
                  {{ formatEventType(event.event_type) }}
                </span>
              </td>
              
              <td class="date-info">
                <div class="event-date">{{ formatEventDate(event.start_date) }}</div>
                <div v-if="event.start_time" class="event-time">
                  {{ formatTime(event.start_time) }}
                  <span v-if="event.end_time">- {{ formatTime(event.end_time) }}</span>
                </div>
                <div v-if="event.is_recurring" class="recurring-indicator">
                  <i class="pi pi-refresh"></i>
                  {{ formatRecurrence(event) }}
                </div>
              </td>
              
              <td>
                <div v-if="event.rabbit_name" class="rabbit-info">
                  <div class="rabbit-name">{{ event.rabbit_name }}</div>
                  <div class="rabbit-breed">{{ event.breed }}</div>
                </div>
                <span v-else class="no-rabbit">No rabbit assigned</span>
              </td>
              
              <td>
                <span class="priority-badge" :class="event.priority">
                  <span class="priority-indicator" :class="event.priority"></span>
                  {{ formatPriority(event.priority) }}
                </span>
              </td>
              
              <td>
                <span class="status-badge" :class="event.status">
                  {{ formatStatus(event.status) }}
                </span>
              </td>
              
              <td class="actions-cell">
                <div class="action-buttons">
                  <button
                    @click="viewEvent(event)"
                    class="action-btn view"
                    title="View Details"
                  >
                    <i class="pi pi-eye"></i>
                  </button>
                  <button
                    @click="editEvent(event)"
                    class="action-btn edit"
                    title="Edit Event"
                  >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button
                    @click="deleteEvent(event)"
                    class="action-btn delete"
                    title="Delete Event"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="currentPage = 1"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          First
        </button>
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }} ({{ filteredEvents.length }} events)
        </span>
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next
        </button>
        <button
          @click="currentPage = totalPages"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Last
        </button>
      </div>
    </div>

    <!-- View Event Modal -->
    <div v-if="selectedEvent" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Event Details</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="detail-section">
            <h4>Basic Information</h4>
            <div class="detail-row">
              <span class="detail-label">Title:</span>
              <span class="detail-value">{{ selectedEvent.title }}</span>
            </div>
            <div v-if="selectedEvent.description" class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">{{ selectedEvent.description }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-value">
                <span class="event-type-badge" :class="selectedEvent.event_type">
                  <i :class="getEventIcon(selectedEvent.event_type)"></i>
                  {{ formatEventType(selectedEvent.event_type) }}
                </span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Priority:</span>
              <span class="detail-value">
                <span class="priority-badge" :class="selectedEvent.priority">
                  {{ formatPriority(selectedEvent.priority) }}
                </span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">
                <span class="status-badge" :class="selectedEvent.status">
                  {{ formatStatus(selectedEvent.status) }}
                </span>
              </span>
            </div>
          </div>

          <div class="detail-section">
            <h4>Schedule</h4>
            <div class="detail-row">
              <span class="detail-label">Start Date:</span>
              <span class="detail-value">{{ formatDetailDate(selectedEvent.start_date) }}</span>
            </div>
            <div v-if="selectedEvent.start_time" class="detail-row">
              <span class="detail-label">Start Time:</span>
              <span class="detail-value">{{ formatTime(selectedEvent.start_time) }}</span>
            </div>
            <div v-if="selectedEvent.end_date" class="detail-row">
              <span class="detail-label">End Date:</span>
              <span class="detail-value">{{ formatDetailDate(selectedEvent.end_date) }}</span>
            </div>
            <div v-if="selectedEvent.end_time" class="detail-row">
              <span class="detail-label">End Time:</span>
              <span class="detail-value">{{ formatTime(selectedEvent.end_time) }}</span>
            </div>
            <div v-if="selectedEvent.is_recurring" class="detail-row">
              <span class="detail-label">Recurrence:</span>
              <span class="detail-value">{{ formatRecurrence(selectedEvent) }}</span>
            </div>
          </div>

          <div v-if="selectedEvent.rabbit_name || selectedEvent.location" class="detail-section">
            <h4>Assignment</h4>
            <div v-if="selectedEvent.rabbit_name" class="detail-row">
              <span class="detail-label">Rabbit:</span>
              <span class="detail-value">
                {{ selectedEvent.rabbit_name }} ({{ selectedEvent.breed }})
              </span>
            </div>
            <div v-if="selectedEvent.location" class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">{{ selectedEvent.location }}</span>
            </div>
            <div v-if="selectedEvent.assigned_to" class="detail-row">
              <span class="detail-label">Assigned To:</span>
              <span class="detail-value">{{ selectedEvent.assigned_to }}</span>
            </div>
          </div>

          <div v-if="selectedEvent.completion_notes" class="detail-section">
            <h4>Notes</h4>
            <div class="detail-row">
              <span class="detail-value notes">{{ selectedEvent.completion_notes }}</span>
            </div>
          </div>

          <div v-if="selectedEvent.completed_at" class="detail-section">
            <h4>Completion</h4>
            <div class="detail-row">
              <span class="detail-label">Completed At:</span>
              <span class="detail-value">{{ formatDetailDate(selectedEvent.completed_at) }}</span>
            </div>
            <div v-if="selectedEvent.completed_by" class="detail-row">
              <span class="detail-label">Completed By:</span>
              <span class="detail-value">{{ selectedEvent.completed_by }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="editFromModal" class="btn btn-primary">
            <i class="pi pi-pencil"></i>
            Edit Event
          </button>
          <button @click="closeModal" class="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="eventToDelete" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <h3>Delete Event</h3>
          <button @click="cancelDelete" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="delete-confirmation">
            <i class="pi pi-exclamation-triangle warning-icon"></i>
            <p>Are you sure you want to delete this event?</p>
            <div class="event-preview">
              <strong>{{ eventToDelete.title }}</strong>
              <span>{{ formatEventDate(eventToDelete.start_date) }}</span>
            </div>
            <p class="delete-warning">This action cannot be undone.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="cancelDelete" class="btn btn-secondary">
            Cancel
          </button>
          <button
            @click="confirmDelete"
            :disabled="isDeleting"
            class="btn btn-danger"
          >
            <span v-if="isDeleting">Deleting...</span>
            <span v-else>
              <i class="pi pi-trash"></i>
              Delete Event
            </span>
          </button>
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
  name: 'ScheduleEventsList',
  setup() {
    const router = useRouter()
    
    // State
    const isLoading = ref(false)
    const isDeleting = ref(false)
    const error = ref('')
    const events = ref([])
    const selectedEvent = ref(null)
    const eventToDelete = ref(null)
    const currentPage = ref(1)
    const itemsPerPage = 20
    
    // Filters
    const filters = reactive({
      search: '',
      eventType: '',
      status: '',
      priority: '',
      dateRange: ''
    })
    
    // Computed
    const filteredEvents = computed(() => {
      let filtered = events.value
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        filtered = filtered.filter(event =>
          event.title.toLowerCase().includes(searchTerm) ||
          (event.description && event.description.toLowerCase().includes(searchTerm)) ||
          (event.rabbit_name && event.rabbit_name.toLowerCase().includes(searchTerm))
        )
      }
      
      // Event type filter
      if (filters.eventType) {
        filtered = filtered.filter(event => event.event_type === filters.eventType)
      }
      
      // Status filter
      if (filters.status) {
        filtered = filtered.filter(event => event.status === filters.status)
      }
      
      // Priority filter
      if (filters.priority) {
        filtered = filtered.filter(event => event.priority === filters.priority)
      }
      
      // Date range filter
      if (filters.dateRange) {
        const today = new Date()
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.start_date)
          
          switch (filters.dateRange) {
            case 'today':
              return eventDate.toDateString() === new Date().toDateString()
            case 'week':
              return eventDate >= startOfWeek
            case 'month':
              return eventDate >= startOfMonth
            case 'upcoming':
              return eventDate >= new Date()
            case 'overdue':
              return eventDate < new Date() && event.status !== 'completed'
            default:
              return true
          }
        })
      }
      
      return filtered.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    })
    
    const paginatedEvents = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredEvents.value.slice(start, end)
    })
    
    const totalPages = computed(() => {
      return Math.ceil(filteredEvents.value.length / itemsPerPage)
    })
    
    const hasFilters = computed(() => {
      return filters.search || filters.eventType || filters.status || 
             filters.priority || filters.dateRange
    })
    
    // Methods
    const fetchEvents = async () => {
      try {
        isLoading.value = true
        error.value = ''
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }
        
        // Try to fetch from the view first, fall back to basic table
        let query = supabase
          .from('schedule_events_with_rabbit')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .order('start_date', { ascending: true })
        
        let { data, error: eventsError } = await query
        
        // If view doesn't exist, fall back to basic table
        if (eventsError && eventsError.code === '42P01') {
          console.log('Using basic schedule_events table')
          const basicQuery = supabase
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
            .order('start_date', { ascending: true })
          
          const basicResult = await basicQuery
          if (basicResult.error) throw basicResult.error
          
          // Transform data to match expected format
          data = basicResult.data?.map(event => ({
            ...event,
            rabbit_name: event.rabbits?.name || null,
            breed: event.rabbits?.breed || null
          })) || []
        } else if (eventsError) {
          throw eventsError
        }
        
        events.value = data || []
        
      } catch (err) {
        console.error('Failed to load events:', err)
        error.value = 'Failed to load events. Please try again.'
      } finally {
        isLoading.value = false
      }
    }
    
    const addEvent = () => {
      router.push('/schedule/add')
    }
    
    const viewEvent = (event) => {
      selectedEvent.value = event
    }
    
    const editEvent = (event) => {
      router.push({
        name: 'EditScheduleEvent',
        params: { id: event.id },
        query: { returnTo: '/schedule/events' }
      })
    }
    
    const editFromModal = () => {
      if (selectedEvent.value) {
        editEvent(selectedEvent.value)
      }
    }
    
    const deleteEvent = (event) => {
      eventToDelete.value = event
    }
    
    const confirmDelete = async () => {
      if (!eventToDelete.value) return
      
      try {
        isDeleting.value = true
        
        const { error: deleteError } = await supabase
          .from('schedule_events')
          .update({ is_deleted: true, deleted_at: new Date().toISOString() })
          .eq('id', eventToDelete.value.id)
        
        if (deleteError) throw deleteError
        
        // Remove from local array
        events.value = events.value.filter(e => e.id !== eventToDelete.value.id)
        
        eventToDelete.value = null
        
      } catch (err) {
        console.error('Failed to delete event:', err)
        error.value = 'Failed to delete event. Please try again.'
      } finally {
        isDeleting.value = false
      }
    }
    
    const cancelDelete = () => {
      eventToDelete.value = null
    }
    
    const closeModal = () => {
      selectedEvent.value = null
    }
    
    // Helper functions
    const formatEventType = (type) => {
      const types = {
        breeding: 'Breeding',
        feeding: 'Feeding',
        health: 'Health',
        maintenance: 'Maintenance',
        general: 'General'
      }
      return types[type] || type
    }
    
    const formatPriority = (priority) => {
      const priorities = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent'
      }
      return priorities[priority] || priority
    }
    
    const formatStatus = (status) => {
      const statuses = {
        scheduled: 'Scheduled',
        in_progress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
        overdue: 'Overdue'
      }
      return statuses[status] || status
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
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        })
      }
    }
    
    const formatDetailDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
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
    
    const formatRecurrence = (event) => {
      if (!event.recurrence_type) return ''
      
      let recurrence = `Every ${event.recurrence_interval || 1} ${event.recurrence_type}`
      if (event.recurrence_type === 'weekly' && event.recurrence_days?.length) {
        recurrence += ` (${event.recurrence_days.join(', ')})`
      }
      return recurrence
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
    
    // Lifecycle
    onMounted(() => {
      fetchEvents()
    })
    
    return {
      // State
      isLoading,
      isDeleting,
      error,
      events,
      selectedEvent,
      eventToDelete,
      currentPage,
      filters,
      
      // Computed
      filteredEvents,
      paginatedEvents,
      totalPages,
      hasFilters,
      
      // Methods
      fetchEvents,
      addEvent,
      viewEvent,
      editEvent,
      editFromModal,
      deleteEvent,
      confirmDelete,
      cancelDelete,
      closeModal,
      formatEventType,
      formatPriority,
      formatStatus,
      formatEventDate,
      formatDetailDate,
      formatTime,
      formatRecurrence,
      getEventIcon
    }
  }
}
</script>

<style scoped>
.events-list-page {
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

.primary-button:hover {
  background: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,123,255,0.3);
}

.secondary-button {
  background: #6c757d;
  color: white;
}

.secondary-button:hover {
  background: #545b62;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108,117,125,0.3);
}

.content-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 25px;
}

.filters-section {
  padding: 20px;
}

.filters-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 20px;
  align-items: end;
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

.search-input {
  position: relative;
}

.search-input i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.search-input input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.search-input input:focus {
  outline: none;
  border-color: #007bff;
}

.filter-select {
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  background: #fff;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
}

.table-container {
  padding: 20px;
  overflow-x: auto;
}

.events-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.events-table th {
  background: #f8f9fa;
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
}

.events-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: top;
}

.event-row:hover {
  background: #f8f9fa;
}

.event-info {
  min-width: 200px;
}

.event-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.event-description {
  color: #666;
  font-size: 13px;
  margin-bottom: 4px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-location {
  color: #666;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.event-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.event-type-badge.breeding {
  background: #ffe4e1;
  color: #d73527;
}

.event-type-badge.feeding {
  background: #fff3cd;
  color: #856404;
}

.event-type-badge.health {
  background: #d4edda;
  color: #155724;
}

.event-type-badge.maintenance {
  background: #e2e3e5;
  color: #495057;
}

.event-type-badge.general {
  background: #d1ecf1;
  color: #0c5460;
}

.date-info {
  min-width: 120px;
}

.event-date {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.event-time {
  color: #666;
  font-size: 13px;
  margin-bottom: 4px;
}

.recurring-indicator {
  color: #007bff;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.rabbit-info {
  min-width: 120px;
}

.rabbit-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.rabbit-breed {
  color: #666;
  font-size: 13px;
}

.no-rabbit {
  color: #999;
  font-style: italic;
}

.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.priority-badge.low {
  background: #d4edda;
  color: #155724;
}

.priority-indicator.low {
  background: #28a745;
}

.priority-badge.medium {
  background: #fff3cd;
  color: #856404;
}

.priority-indicator.medium {
  background: #ffc107;
}

.priority-badge.high {
  background: #f8d7da;
  color: #721c24;
}

.priority-indicator.high {
  background: #dc3545;
}

.priority-badge.urgent {
  background: #f5c6cb;
  color: #491217;
}

.priority-indicator.urgent {
  background: #dc3545;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.scheduled {
  background: #cce5ff;
  color: #004085;
}

.status-badge.in_progress {
  background: #fff3cd;
  color: #856404;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.overdue {
  background: #f5c6cb;
  color: #491217;
}

.actions-cell {
  width: 120px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 14px;
}

.action-btn.view {
  background: #e7f3ff;
  color: #007bff;
}

.action-btn.view:hover {
  background: #007bff;
  color: white;
}

.action-btn.edit {
  background: #fff3cd;
  color: #856404;
}

.action-btn.edit:hover {
  background: #ffc107;
  color: #212529;
}

.action-btn.delete {
  background: #f8d7da;
  color: #721c24;
}

.action-btn.delete:hover {
  background: #dc3545;
  color: white;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state i, .empty-state i {
  font-size: 48px;
  margin-bottom: 15px;
  color: #ccc;
}

.retry-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.empty-subtitle {
  margin: 10px 0 20px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid #e9ecef;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  background: #fff;
  color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.page-btn:disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.modal-body {
  padding: 25px;
}

.detail-section {
  margin-bottom: 25px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 600;
  color: #2c3e50;
  min-width: 120px;
  margin-right: 15px;
}

.detail-value {
  flex: 1;
  color: #666;
}

.detail-value.notes {
  white-space: pre-wrap;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 20px 25px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.delete-modal {
  max-width: 500px;
}

.delete-confirmation {
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  color: #ffc107;
  margin-bottom: 20px;
}

.event-preview {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
  border-left: 4px solid #007bff;
}

.event-preview strong {
  display: block;
  margin-bottom: 5px;
  color: #2c3e50;
}

.delete-warning {
  color: #dc3545;
  font-size: 14px;
  margin: 15px 0 0;
}

@media (max-width: 1200px) {
  .filters-row {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 15px;
  }
}

@media (max-width: 768px) {
  .events-list-page {
    padding: 15px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .filters-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .table-container {
    padding: 15px;
  }
  
  .events-table {
    font-size: 13px;
  }
  
  .events-table th,
  .events-table td {
    padding: 10px 8px;
  }
  
  .event-description {
    max-width: 150px;
  }
  
  .modal-content {
    margin: 10px;
    max-height: 85vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 15px 20px;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 5px;
  }
  
  .detail-label {
    min-width: auto;
    margin-right: 0;
  }
}
</style>
