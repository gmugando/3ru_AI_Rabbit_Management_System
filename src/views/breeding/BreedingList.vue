<template>
  <div class="breeding-list-page">
    <div class="page-header">
      <div>
        <h1>Breeding Plans</h1>
        <p class="subtitle">Manage your rabbit breeding plans</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="toggleView">
          <i :class="isGridView ? 'pi pi-list' : 'pi pi-th-large'"></i>
          {{ isGridView ? 'Card View' : 'Grid View' }}
        </button>
        <router-link to="/breeding/add" class="primary-button">
          <i class="pi pi-plus"></i>
          New Breeding Plan
        </router-link>
      </div>
    </div>

    <div class="content-card">
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        Loading breeding plans...
      </div>

      <div v-else-if="!breedingPlans.length" class="empty-state">
        <div class="empty-state-content">
          <i class="pi pi-heart-fill"></i>
          <h2>No breeding plans yet</h2>
          <p>Start by creating your first breeding plan</p>
          <router-link to="/breeding/add" class="primary-button">
            <i class="pi pi-plus"></i>
            New Breeding Plan
          </router-link>
        </div>
      </div>

      <div v-else>
        <!-- Grid View -->
        <div v-if="isGridView" class="table-view">
          <table class="data-table">
            <thead>
              <tr>
                <th>Plan ID</th>
                <th>Buck</th>
                <th>Doe</th>
                <th>Planned Date</th>
                <th>Expected Kindle</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in paginatedPlans" :key="plan.id">
                <td>{{ plan.plan_id }}</td>
                <td>{{ plan.buck.name }}</td>
                <td>{{ plan.doe.name }}</td>
                <td>{{ formatDate(plan.planned_date) }}</td>
                <td>{{ formatDate(plan.expected_kindle_date) }}</td>
                <td>
                  <span :class="['status-badge', plan.status.toLowerCase()]">
                    {{ plan.status }}
                  </span>
                </td>
                <td class="action-cell">
                  <router-link :to="`/breeding/${plan.id}/edit`" class="icon-button">
                    <i class="pi pi-pencil"></i>
                  </router-link>
                  <button 
                    class="icon-button" 
                    @click="confirmDelete(plan)"
                    :disabled="isDeleting === plan.id"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Controls -->
          <div class="pagination">
            <div class="pagination-info">
              Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, breedingPlans.length) }} of {{ breedingPlans.length }} entries
            </div>
            <div class="pagination-controls">
              <button 
                class="pagination-button" 
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <i class="pi pi-chevron-left"></i>
                Previous
              </button>
              <div class="pagination-pages">
                <button 
                  v-for="page in totalPages" 
                  :key="page"
                  :class="['page-button', { active: currentPage === page }]"
                  @click="currentPage = page"
                >
                  {{ page }}
                </button>
              </div>
              <button 
                class="pagination-button" 
                :disabled="currentPage === totalPages"
                @click="currentPage++"
              >
                Next
                <i class="pi pi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Card View -->
        <div v-else class="content-grid">
          <div v-for="plan in breedingPlans" :key="plan.id" class="breeding-plan-card">
            <div class="plan-header">
              <h3>{{ plan.plan_id }}</h3>
              <div class="status-badge" :class="plan.status.toLowerCase()">
                {{ plan.status }}
              </div>
            </div>

            <div class="plan-details">
              <div class="detail-group">
                <label>Buck:</label>
                <span>{{ plan.buck.name }} ({{ plan.buck.breed }})</span>
              </div>
              <div class="detail-group">
                <label>Doe:</label>
                <span>{{ plan.doe.name }} ({{ plan.doe.breed }})</span>
              </div>
              <div class="detail-group">
                <label>Planned Date:</label>
                <span>{{ formatDate(plan.planned_date) }}</span>
              </div>
              <div class="detail-group">
                <label>Expected Kindle:</label>
                <span>{{ formatDate(plan.expected_kindle_date) }}</span>
              </div>
              <template v-if="plan.status !== 'Planned'">
                <div class="detail-group" v-if="plan.actual_mating_date">
                  <label>Actual Mating:</label>
                  <span>{{ formatDate(plan.actual_mating_date) }}</span>
                </div>
                <div class="detail-group" v-if="plan.actual_kindle_date">
                  <label>Actual Kindle:</label>
                  <span>{{ formatDate(plan.actual_kindle_date) }}</span>
                </div>
                <div class="detail-group" v-if="plan.kits_born !== null">
                  <label>Kits Born:</label>
                  <span>{{ plan.kits_born }}</span>
                </div>
                <div class="detail-group" v-if="plan.kits_survived !== null">
                  <label>Kits Survived:</label>
                  <span>{{ plan.kits_survived }}</span>
                </div>
              </template>
            </div>

            <div class="plan-notes" v-if="plan.notes">
              <label>Notes:</label>
              <p>{{ plan.notes }}</p>
            </div>

            <div class="plan-actions">
              <router-link :to="`/breeding/${plan.id}/edit`" class="secondary-button">
                <i class="pi pi-pencil"></i>
                Edit
              </router-link>
              <button 
                class="danger-button" 
                @click="confirmDelete(plan)"
                :disabled="isDeleting === plan.id"
              >
                <i class="pi pi-trash"></i>
                {{ isDeleting === plan.id ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'

export default {
  name: 'BreedingList',
  setup() {
    const breedingPlans = ref([])
    const isLoading = ref(true)
    const isDeleting = ref(null)
    const errorMessage = ref('')
    const isGridView = ref(false)
    const currentPage = ref(1)
    const itemsPerPage = ref(10)

    const totalPages = computed(() => Math.ceil(breedingPlans.value.length / itemsPerPage.value))
    const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
    const endIndex = computed(() => startIndex.value + itemsPerPage.value)
    
    const paginatedPlans = computed(() => {
      return breedingPlans.value.slice(startIndex.value, endIndex.value)
    })

    const toggleView = () => {
      isGridView.value = !isGridView.value
      currentPage.value = 1 // Reset to first page when switching views
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const fetchBreedingPlans = async () => {
      try {
        errorMessage.value = ''
        const { data, error } = await supabase
          .from('breeding_plans')
          .select(`
            *,
            buck:rabbits!breeding_plans_buck_id_fkey(id, name, breed),
            doe:rabbits!breeding_plans_doe_id_fkey(id, name, breed)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        breedingPlans.value = data
      } catch (error) {
        console.error('Error fetching breeding plans:', error)
        errorMessage.value = 'Failed to load breeding plans. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    const confirmDelete = async (plan) => {
      if (!confirm(`Are you sure you want to delete breeding plan ${plan.plan_id}?`)) {
        return
      }

      try {
        errorMessage.value = ''
        isDeleting.value = plan.id
        const { error } = await supabase
          .from('breeding_plans')
          .delete()
          .eq('id', plan.id)

        if (error) throw error

        breedingPlans.value = breedingPlans.value.filter(p => p.id !== plan.id)
      } catch (error) {
        console.error('Error deleting breeding plan:', error)
        errorMessage.value = 'Failed to delete breeding plan. Please try again.'
      } finally {
        isDeleting.value = null
      }
    }

    onMounted(fetchBreedingPlans)

    return {
      breedingPlans,
      isLoading,
      isDeleting,
      errorMessage,
      isGridView,
      toggleView,
      formatDate,
      confirmDelete,
      // Pagination
      currentPage,
      totalPages,
      paginatedPlans,
      startIndex,
      endIndex
    }
  }
}
</script>

<style scoped>
.breeding-list-page {
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

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #64748b;
}

.loading-state i {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.empty-state-content {
  text-align: center;
}

.empty-state-content i {
  font-size: 3rem;
  color: #94a3b8;
  margin-bottom: 1rem;
}

.empty-state-content h2 {
  margin: 0;
  color: #1e293b;
}

.empty-state-content p {
  color: #64748b;
  margin: 0.5rem 0 1.5rem;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.breeding-plan-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.breeding-plan-card:hover {
  transform: translateY(-2px);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.plan-header h3 {
  margin: 0;
  color: #1e293b;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.planned {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.active {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.completed {
  background: #f1f5f9;
  color: #475569;
}

.status-badge.failed {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.cancelled {
  background: #fef3c7;
  color: #d97706;
}

.plan-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.detail-group {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
}

.detail-group label {
  font-size: 0.875rem;
  color: #64748b;
}

.detail-group span {
  color: #1e293b;
  font-weight: 500;
}

.plan-notes {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.plan-notes label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  display: block;
}

.plan-notes p {
  margin: 0;
  color: #1e293b;
  white-space: pre-line;
}

.plan-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.primary-button,
.secondary-button,
.danger-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.primary-button {
  background: #3b82f6;
  color: white;
  border: none;
}

.primary-button:hover {
  background: #2563eb;
}

.secondary-button {
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.secondary-button:hover {
  background: #f8fafc;
}

.danger-button {
  background: white;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.danger-button:hover {
  background: #fee2e2;
}

.danger-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  background: #fee2e2;
  color: #ef4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.table-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-controls {
  margin-bottom: 1rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  background: #f8fafc;
  padding: 1rem;
  font-weight: 600;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
}

.action-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-top: 1px solid #e2e8f0;
}

.pagination-info {
  color: #64748b;
  font-size: 0.875rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pagination-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-button:hover:not(:disabled) {
  background: #f8fafc;
  color: #3b82f6;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 0.25rem;
}

.page-button {
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 2.5rem;
}

.page-button:hover:not(.active) {
  background: #f8fafc;
  color: #3b82f6;
}

.page-button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

@media (max-width: 1024px) {
  .data-table {
    min-width: 800px;
  }
}

@media (max-width: 768px) {
  .pagination {
    flex-direction: column;
    gap: 1rem;
  }

  .pagination-info {
    text-align: center;
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}
</style> 