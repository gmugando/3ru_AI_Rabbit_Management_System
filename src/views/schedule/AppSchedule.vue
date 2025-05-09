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
        <button class="primary-button">
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
              <button class="nav-button">
                <i class="pi pi-chevron-left"></i>
              </button>
              <span class="current-month">March 2024</span>
              <button class="nav-button">
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
                <input type="checkbox" checked />
                <span class="filter-color breeding"></span>
                Breeding Events
              </label>
              <label class="filter-item">
                <input type="checkbox" checked />
                <span class="filter-color feeding"></span>
                Feeding Schedule
              </label>
              <label class="filter-item">
                <input type="checkbox" checked />
                <span class="filter-color health"></span>
                Health Checks
              </label>
              <label class="filter-item">
                <input type="checkbox" checked />
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
              <button class="view-option active">Day</button>
              <button class="view-option">Week</button>
              <button class="view-option">Month</button>
            </div>
            <button class="secondary-button">
              <i class="pi pi-calendar"></i>
              Today
            </button>
          </div>

          <!-- Day View -->
          <div class="schedule-timeline">
            <div class="timeline-header">
              <div class="date-cell current">
                <span class="day">Mon</span>
                <span class="date">15</span>
              </div>
              <div class="date-cell">
                <span class="day">Tue</span>
                <span class="date">16</span>
              </div>
              <div class="date-cell">
                <span class="day">Wed</span>
                <span class="date">17</span>
              </div>
            </div>

            <div class="timeline-events">
              <div class="event-item breeding">
                <div class="event-time">09:00 AM</div>
                <div class="event-content">
                  <h4>Breeding Check</h4>
                  <p>Pair R-001 & R-002</p>
                </div>
              </div>

              <div class="event-item feeding">
                <div class="event-time">10:30 AM</div>
                <div class="event-content">
                  <h4>Morning Feed</h4>
                  <p>Section A & B</p>
                </div>
              </div>

              <div class="event-item health">
                <div class="event-time">02:00 PM</div>
                <div class="event-content">
                  <h4>Health Inspection</h4>
                  <p>New births check</p>
                </div>
              </div>

              <div class="event-item maintenance">
                <div class="event-time">04:00 PM</div>
                <div class="event-content">
                  <h4>Cage Cleaning</h4>
                  <p>Section C</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Events -->
        <div class="content-card">
          <div class="card-header">
            <h3>Upcoming Events</h3>
            <button class="card-action-btn">View All</button>
          </div>
          <div class="upcoming-events">
            <div class="event-item">
              <div class="event-marker breeding"></div>
              <div class="event-details">
                <div class="event-info">
                  <h4>Expected Birth</h4>
                  <p>Doe R-005</p>
                </div>
                <span class="event-date">Tomorrow, 9:00 AM</span>
              </div>
            </div>

            <div class="event-item">
              <div class="event-marker health"></div>
              <div class="event-details">
                <div class="event-info">
                  <h4>Vaccination</h4>
                  <p>Young rabbits - Section B</p>
                </div>
                <span class="event-date">Wed, 2:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppSchedule',
  setup() {
    return {}
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