<template>
  <div class="kit-management">
    <div class="page-header">
      <div>
        <h1>Kit Management</h1>
        <p class="subtitle">Track and manage individual kits from birth to weaning</p>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Search kits by ID or color..."
            @input="handleSearch"
          />
          <i class="pi pi-search"></i>
        </div>
        <select v-model="statusFilter" @change="filterKits">
          <option value="">All Status</option>
          <option value="alive">Alive</option>
          <option value="deceased">Deceased</option>
          <option value="sold">Sold</option>
          <option value="kept_for_breeding">Kept for Breeding</option>
        </select>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="pi pi-users"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.total }}</h3>
          <p>Total Kits</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon alive">
          <i class="pi pi-heart"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.alive }}</h3>
          <p>Alive</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon male">
          <i class="pi pi-mars"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.male }}</h3>
          <p>Male</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon female">
          <i class="pi pi-venus"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.female }}</h3>
          <p>Female</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon survival">
          <i class="pi pi-percentage"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.survival_rate }}%</h3>
          <p>Survival Rate</p>
        </div>
      </div>
    </div>

    <!-- Kits Table -->
    <div class="content-card">
      <div class="table-header">
        <h3>Kit Records</h3>
        <div class="table-actions">
          <button class="secondary-button" @click="refreshKits">
            <i class="pi pi-refresh"></i>
            Refresh
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <i class="pi pi-spinner pi-spin"></i>
        Loading kits...
      </div>

      <div v-else-if="filteredKits.length === 0" class="empty-state">
        <i class="pi pi-users"></i>
        <h3>No kits found</h3>
        <p>{{ searchTerm ? 'Try adjusting your search terms' : 'No kits have been recorded yet' }}</p>
      </div>

      <div v-else class="kits-table">
        <table>
          <thead>
            <tr>
              <th>Kit ID</th>
              <th>Parents</th>
              <th>Birth Date</th>
              <th>Gender</th>
              <th>Color</th>
              <th>Status</th>
              <th>Weight</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="kit in filteredKits" :key="kit.id">
              <td>
                <strong>{{ kit.kit_id }}</strong>
              </td>
              <td>
                <div class="parents">
                  <span class="parent">
                    <i class="pi pi-mars"></i>
                    {{ kit.breeding_plans?.buck?.name || 'Unknown' }}
                  </span>
                  <span class="parent">
                    <i class="pi pi-venus"></i>
                    {{ kit.breeding_plans?.doe?.name || 'Unknown' }}
                  </span>
                </div>
              </td>
              <td>{{ formatDate(kit.birth_date) }}</td>
              <td>
                <span :class="['gender-badge', kit.gender]">
                  <i :class="kit.gender === 'male' ? 'pi pi-mars' : 'pi pi-venus'"></i>
                  {{ kit.gender }}
                </span>
              </td>
              <td>{{ kit.color || '-' }}</td>
              <td>
                <span :class="['status-badge', kit.status]">
                  {{ getStatusLabel(kit.status) }}
                </span>
              </td>
              <td>
                <span v-if="kit.weight_at_birth">
                  {{ kit.weight_at_birth }}g
                </span>
                <span v-else>-</span>
              </td>
              <td>
                <div class="actions">
                  <button class="action-button" @click="viewKit(kit)" title="View Details">
                    <i class="pi pi-eye"></i>
                  </button>
                  <button class="action-button" @click="editKit(kit)" title="Edit Kit">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button class="action-button" @click="addHealthRecord(kit)" title="Add Health Record">
                    <i class="pi pi-plus"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Kit Details Modal -->
    <div v-if="selectedKit" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Kit Details: {{ selectedKit.kit_id }}</h2>
          <button class="close-button" @click="closeModal">
            <i class="pi pi-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="kit-info-grid">
            <div class="info-section">
              <h3>Basic Information</h3>
              <div class="info-row">
                <span class="label">Kit ID:</span>
                <span class="value">{{ selectedKit.kit_id }}</span>
              </div>
              <div class="info-row">
                <span class="label">Birth Date:</span>
                <span class="value">{{ formatDate(selectedKit.birth_date) }}</span>
              </div>
              <div class="info-row">
                <span class="label">Gender:</span>
                <span class="value">
                  <span :class="['gender-badge', selectedKit.gender]">
                    <i :class="selectedKit.gender === 'male' ? 'pi pi-mars' : 'pi pi-venus'"></i>
                    {{ selectedKit.gender }}
                  </span>
                </span>
              </div>
              <div class="info-row">
                <span class="label">Color:</span>
                <span class="value">{{ selectedKit.color || 'Not specified' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">
                  <span :class="['status-badge', selectedKit.status]">
                    {{ getStatusLabel(selectedKit.status) }}
                  </span>
                </span>
              </div>
            </div>

            <div class="info-section">
              <h3>Parents</h3>
              <div class="info-row">
                <span class="label">Buck:</span>
                <span class="value">{{ selectedKit.breeding_plans?.buck?.name || 'Unknown' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Doe:</span>
                <span class="value">{{ selectedKit.breeding_plans?.doe?.name || 'Unknown' }}</span>
              </div>
            </div>

            <div class="info-section">
              <h3>Development</h3>
              <div class="info-row">
                <span class="label">Birth Weight:</span>
                <span class="value">{{ selectedKit.weight_at_birth ? `${selectedKit.weight_at_birth}g` : 'Not recorded' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Weaning Date:</span>
                <span class="value">{{ selectedKit.weaning_date ? formatDate(selectedKit.weaning_date) : 'Not weaned' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Weaning Weight:</span>
                <span class="value">{{ selectedKit.weaning_weight ? `${selectedKit.weaning_weight}g` : 'Not recorded' }}</span>
              </div>
            </div>
          </div>

          <!-- Health Records -->
          <div class="health-records-section">
            <h3>Health Records</h3>
            <div v-if="selectedKit.kit_health_records?.length > 0" class="health-records">
              <div v-for="record in selectedKit.kit_health_records" :key="record.id" class="health-record">
                <div class="record-header">
                  <span class="record-date">{{ formatDate(record.check_date) }}</span>
                  <span :class="['health-status', record.health_status]">
                    {{ record.health_status }}
                  </span>
                </div>
                <div class="record-details">
                  <div v-if="record.weight" class="record-item">
                    <span class="label">Weight:</span>
                    <span class="value">{{ record.weight }}g</span>
                  </div>
                  <div v-if="record.issues" class="record-item">
                    <span class="label">Issues:</span>
                    <span class="value">{{ record.issues }}</span>
                  </div>
                  <div v-if="record.treatments" class="record-item">
                    <span class="label">Treatments:</span>
                    <span class="value">{{ record.treatments }}</span>
                  </div>
                  <div v-if="record.notes" class="record-item">
                    <span class="label">Notes:</span>
                    <span class="value">{{ record.notes }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-records">
              <p>No health records found for this kit.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import kitManagementService from '@/services/kitManagement'

const loading = ref(false)
const kits = ref([])
const filteredKits = ref([])
const selectedKit = ref(null)
const searchTerm = ref('')
const statusFilter = ref('')
const statistics = ref({
  total: 0,
  alive: 0,
  deceased: 0,
  sold: 0,
  kept_for_breeding: 0,
  male: 0,
  female: 0,
  survival_rate: 0
})

async function fetchKits() {
  try {
    loading.value = true
    const data = await kitManagementService.getAllKits()
    kits.value = data
    filteredKits.value = data
    await fetchStatistics()
  } catch (error) {
    console.error('Error fetching kits:', error)
  } finally {
    loading.value = false
  }
}

async function fetchStatistics() {
  try {
    const stats = await kitManagementService.getKitStatistics()
    statistics.value = stats
  } catch (error) {
    console.error('Error fetching statistics:', error)
  }
}

function handleSearch() {
  filterKits()
}

function filterKits() {
  let filtered = kits.value

  // Apply status filter
  if (statusFilter.value) {
    filtered = filtered.filter(kit => kit.status === statusFilter.value)
  }

  // Apply search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(kit => 
      kit.kit_id.toLowerCase().includes(term) ||
      (kit.color && kit.color.toLowerCase().includes(term))
    )
  }

  filteredKits.value = filtered
}

function viewKit(kit) {
  selectedKit.value = kit
}

function editKit(kit) {
  // TODO: Implement edit functionality
  console.log('Edit kit:', kit)
}

function addHealthRecord(kit) {
  // TODO: Implement add health record functionality
  console.log('Add health record for kit:', kit)
}

function closeModal() {
  selectedKit.value = null
}

function refreshKits() {
  fetchKits()
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

function getStatusLabel(status) {
  const labels = {
    alive: 'Alive',
    deceased: 'Deceased',
    sold: 'Sold',
    kept_for_breeding: 'Kept for Breeding'
  }
  return labels[status] || status
}

onMounted(() => {
  fetchKits()
})
</script>

<style scoped>
.kit-management {
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
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 0.5rem 2rem 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 250px;
}

.search-box i {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.header-actions select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0f2fe;
  color: #0284c7;
}

.stat-icon.alive {
  background: #dcfce7;
  color: #16a34a;
}

.stat-icon.male {
  background: #dbeafe;
  color: #2563eb;
}

.stat-icon.female {
  background: #fce7f3;
  color: #ec4899;
}

.stat-icon.survival {
  background: #fef3c7;
  color: #d97706;
}

.stat-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.stat-content p {
  margin: 0;
  color: #64748b;
  font-size: 0.875rem;
}

/* Content Card */
.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.table-header h3 {
  margin: 0;
  color: #1e293b;
}

.table-actions {
  display: flex;
  gap: 1rem;
}

/* Table */
.kits-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
}

.parents {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.parent {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.parent i {
  color: #64748b;
}

.gender-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.gender-badge.male {
  background: #dbeafe;
  color: #2563eb;
}

.gender-badge.female {
  background: #fce7f3;
  color: #ec4899;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.alive {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.deceased {
  background: #fee2e2;
  color: #ef4444;
}

.status-badge.sold {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.kept_for_breeding {
  background: #e0e7ff;
  color: #7c3aed;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: #e2e8f0;
  color: #1e293b;
}

/* Loading and Empty States */
.loading, .empty-state {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

.loading i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.empty-state p {
  margin: 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  color: #1e293b;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-body {
  padding: 1.5rem;
}

.kit-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.info-section h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.125rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #64748b;
}

.value {
  color: #1e293b;
}

.health-records-section h3 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.125rem;
}

.health-records {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.health-record {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.record-date {
  font-weight: 500;
  color: #1e293b;
}

.health-status {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.health-status.healthy {
  background: #dcfce7;
  color: #16a34a;
}

.health-status.under_observation {
  background: #fef3c7;
  color: #d97706;
}

.health-status.sick {
  background: #fee2e2;
  color: #ef4444;
}

.health-status.recovered {
  background: #dbeafe;
  color: #2563eb;
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.record-item {
  display: flex;
  gap: 0.5rem;
}

.record-item .label {
  font-weight: 500;
  min-width: 80px;
}

.no-records {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

/* Buttons */
.secondary-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.secondary-button:hover {
  background: #f8fafc;
  color: #1e293b;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
  }

  .search-box input {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .kit-info-grid {
    grid-template-columns: 1fr;
  }

  .table-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}
</style>
