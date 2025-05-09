<template>
  <div class="users-page">
    <div class="page-header">
      <div>
        <h1>User Management</h1>
        <p class="subtitle">Manage system users and their permissions</p>
      </div>
      <div class="header-actions">
        <button class="primary-button">
          <i class="pi pi-plus"></i>
          Add User
        </button>
      </div>
    </div>

    <div class="content-card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Grant Mugando</td>
              <td>grant@example.com</td>
              <td>Farmer</td>
              <td><span class="status-badge active">Active</span></td>
              <td>
                <button class="icon-button"><i class="pi pi-pencil"></i></button>
                <button class="icon-button"><i class="pi pi-trash"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserManagement',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.users-page {
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

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
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

.status-badge.active {
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
</style> 