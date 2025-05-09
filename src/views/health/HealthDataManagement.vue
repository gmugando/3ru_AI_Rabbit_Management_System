<template>
  <div class="health-page">
    <div class="page-header">
      <div>
        <h1>Health Data Management</h1>
        <p class="subtitle">Track diseases, treatments, and medications</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button">
          <i class="pi pi-filter"></i>
          Filter
        </button>
        <button class="primary-button">
          <i class="pi pi-plus"></i>
          Add Health Record
        </button>
      </div>
    </div>

    <div class="content-grid">
      <!-- Health Statistics -->
      <div class="content-card">
        <div class="card-header">
          <h2>Health Overview</h2>
          <div class="header-filters">
            <select class="form-control">
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
            </select>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon healthy">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-content">
              <h3>Healthy Rabbits</h3>
              <p class="stat-value">142</p>
              <p class="stat-change positive">91% of total</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon treatment">
              <i class="pi pi-heart"></i>
            </div>
            <div class="stat-content">
              <h3>Under Treatment</h3>
              <p class="stat-value">8</p>
              <p class="stat-change">5% of total</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon observation">
              <i class="pi pi-eye"></i>
            </div>
            <div class="stat-content">
              <h3>Under Observation</h3>
              <p class="stat-value">6</p>
              <p class="stat-change">4% of total</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Treatments -->
      <div class="content-card">
        <div class="card-header">
          <h2>Active Treatments</h2>
          <button class="card-action-btn">View All</button>
        </div>
        <div class="treatments-list">
          <div class="treatment-item">
            <div class="treatment-header">
              <div class="rabbit-info">
                <h4>R-001</h4>
                <span class="breed">New Zealand White</span>
              </div>
              <span class="status treatment">Under Treatment</span>
            </div>
            <div class="treatment-details">
              <div class="condition">
                <label>Condition:</label>
                <span>Respiratory Infection</span>
              </div>
              <div class="medication">
                <label>Medication:</label>
                <span>Antibiotics - Enrofloxacin</span>
              </div>
              <div class="duration">
                <label>Duration:</label>
                <span>5 days remaining</span>
              </div>
            </div>
          </div>

          <div class="treatment-item">
            <div class="treatment-header">
              <div class="rabbit-info">
                <h4>R-015</h4>
                <span class="breed">California White</span>
              </div>
              <span class="status observation">Under Observation</span>
            </div>
            <div class="treatment-details">
              <div class="condition">
                <label>Condition:</label>
                <span>Loss of Appetite</span>
              </div>
              <div class="medication">
                <label>Action:</label>
                <span>Monitoring food intake</span>
              </div>
              <div class="duration">
                <label>Since:</label>
                <span>2 days ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Health Records -->
      <div class="content-card">
        <div class="card-header">
          <h2>Recent Health Records</h2>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rabbit ID</th>
                <th>Condition</th>
                <th>Treatment</th>
                <th>Start Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>R-001</td>
                <td>Respiratory Infection</td>
                <td>Antibiotics</td>
                <td>2024-02-15</td>
                <td><span class="status-badge treatment">Active</span></td>
                <td>
                  <button class="icon-button"><i class="pi pi-eye"></i></button>
                  <button class="icon-button"><i class="pi pi-pencil"></i></button>
                </td>
              </tr>
              <tr>
                <td>R-015</td>
                <td>Loss of Appetite</td>
                <td>Monitoring</td>
                <td>2024-02-17</td>
                <td><span class="status-badge observation">Monitoring</span></td>
                <td>
                  <button class="icon-button"><i class="pi pi-eye"></i></button>
                  <button class="icon-button"><i class="pi pi-pencil"></i></button>
                </td>
              </tr>
              <tr>
                <td>R-008</td>
                <td>Ear Mites</td>
                <td>Ivermectin</td>
                <td>2024-02-10</td>
                <td><span class="status-badge completed">Completed</span></td>
                <td>
                  <button class="icon-button"><i class="pi pi-eye"></i></button>
                  <button class="icon-button"><i class="pi pi-pencil"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HealthDataManagement',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.health-page {
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

.content-grid {
  display: grid;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon.healthy {
  background: #f0fdf4;
  color: #10b981;
}

.stat-icon.treatment {
  background: #fff1f2;
  color: #ef4444;
}

.stat-icon.observation {
  background: #fef3c7;
  color: #f59e0b;
}

.stat-content h3 {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.stat-value {
  margin: 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.stat-change {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.stat-change.positive {
  color: #10b981;
}

.treatments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.treatment-item {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.treatment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rabbit-info h4 {
  margin: 0;
  color: #1e293b;
}

.breed {
  font-size: 0.875rem;
  color: #64748b;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.status.treatment {
  background: #fff1f2;
  color: #ef4444;
}

.status.observation {
  background: #fef3c7;
  color: #f59e0b;
}

.treatment-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.treatment-details label {
  font-size: 0.875rem;
  color: #64748b;
  display: block;
  margin-bottom: 0.25rem;
}

.treatment-details span {
  color: #1e293b;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  font-weight: 600;
  color: #64748b;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.status-badge.treatment {
  background: #fff1f2;
  color: #ef4444;
}

.status-badge.observation {
  background: #fef3c7;
  color: #f59e0b;
}

.status-badge.completed {
  background: #f0fdf4;
  color: #10b981;
}

.icon-button {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-button:hover {
  color: #3b82f6;
}

@media (max-width: 768px) {
  .treatment-details {
    grid-template-columns: 1fr;
  }
}
</style> 