<template>
  <div class="feeding-page">
    <div class="page-header">
      <div>
        <h1>Feeding Management</h1>
        <p class="subtitle">Track and manage feeding schedules and consumption</p>
      </div>
      <div class="header-actions">
        <router-link to="/feeding/schedule" class="secondary-button">
          <i class="pi pi-calendar"></i>
          Schedule
        </router-link>
        <router-link to="/feeding/add-record" class="primary-button">
          <i class="pi pi-plus"></i>
          Add Feed Record
        </router-link>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="mdi mdi-food-variant"></i>
        </div>
        <div class="stat-content">
          <h3>Daily Consumption</h3>
          <p class="stat-value">12.5 kg</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="pi pi-box"></i>
        </div>
        <div class="stat-content">
          <h3>Stock Level</h3>
          <p class="stat-value">85 kg</p>
          <p class="stat-note">7 days remaining</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="pi pi-dollar"></i>
        </div>
        <div class="stat-content">
          <h3>Monthly Cost</h3>
          <p class="stat-value">$450</p>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="content-card">
        <div class="card-header">
          <h2>Feeding Schedule</h2>
          <button class="card-action-btn">
            <i class="pi pi-calendar"></i>
            This Week
          </button>
        </div>
        <div class="schedule-list">
          <div class="schedule-item">
            <div class="time-slot">
              <span class="time">08:00 AM</span>
              <span class="date">Daily</span>
            </div>
            <div class="schedule-details">
              <h4>Morning Feed</h4>
              <p>Adult rabbits - Section A & B</p>
            </div>
            <div class="schedule-status completed">
              <i class="pi pi-check-circle"></i>
              <span>Completed</span>
            </div>
          </div>

          <div class="schedule-item">
            <div class="time-slot">
              <span class="time">02:00 PM</span>
              <span class="date">Daily</span>
            </div>
            <div class="schedule-details">
              <h4>Afternoon Feed</h4>
              <p>Growing rabbits - Section C</p>
            </div>
            <div class="schedule-status pending">
              <i class="pi pi-clock"></i>
              <span>Pending</span>
            </div>
          </div>
        </div>
      </div>

      <div class="content-card">
        <div class="card-header">
          <h2>Feed Stock</h2>
          <button class="card-action-btn">View All</button>
        </div>
        <div class="stock-list">
          <div class="stock-item">
            <div class="stock-info">
              <h4>Adult Rabbit Feed</h4>
              <p>Premium Pellets</p>
            </div>
            <div class="stock-level">
              <div class="progress-bar">
                <div class="progress" style="width: 65%"></div>
              </div>
              <span>65% remaining</span>
            </div>
          </div>

          <div class="stock-item">
            <div class="stock-info">
              <h4>Growing Rabbit Feed</h4>
              <p>Growth Formula</p>
            </div>
            <div class="stock-level">
              <div class="progress-bar">
                <div class="progress" style="width: 35%"></div>
              </div>
              <span class="warning">35% remaining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FeedingManagement',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.feeding-page {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-content h3 {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.stat-value {
  margin: 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.stat-note {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.card-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.time-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.time {
  font-weight: 600;
  color: #1e293b;
}

.date {
  font-size: 0.875rem;
  color: #64748b;
}

.schedule-details {
  flex: 1;
}

.schedule-details h4 {
  margin: 0;
  color: #1e293b;
}

.schedule-details p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.schedule-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.schedule-status.completed {
  color: #10b981;
}

.schedule-status.pending {
  color: #f59e0b;
}

.stock-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stock-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stock-info h4 {
  margin: 0;
  color: #1e293b;
}

.stock-info p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.stock-level {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #3b82f6;
  border-radius: 4px;
}

.stock-level span {
  font-size: 0.875rem;
  color: #64748b;
}

.stock-level span.warning {
  color: #f59e0b;
}

@media (max-width: 768px) {
  .stats-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .schedule-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .time-slot {
    min-width: auto;
  }
}
</style> 