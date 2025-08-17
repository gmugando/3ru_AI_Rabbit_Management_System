<template>
  <div class="rabbits-page">
    <div class="page-header">
      <div>
        <h1>Rabbit Management</h1>
        <p class="subtitle">Manage your rabbit inventory</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="toggleDisplayType">
          <i :class="displayType === 'grid' ? 'pi pi-list' : 'pi pi-th-large'"></i>
          {{ displayType === 'grid' ? 'List View' : 'Grid View' }}
        </button>
        <button class="secondary-button">
          <i class="pi pi-filter"></i>
          Filter
        </button>
        <button class="primary-button" @click="$router.push('/rabbits/add')">
          <i class="pi pi-plus"></i>
          Add Rabbit
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      Loading rabbits...
    </div>

    <div v-else-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-else-if="rabbits.length === 0" class="empty-state">
      <i class="mdi mdi-rabbit"></i>
      <p>No rabbits found</p>
      <button class="primary-button" @click="$router.push('/rabbits/add')">
        Add Your First Rabbit
      </button>
    </div>

    <div v-else :class="displayType === 'grid' ? 'table-view' : 'content-grid'">
      <!-- Grid View -->
      <template v-if="displayType === 'grid'">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Breed</th>
              <th>Gender</th>
              <th>Weight</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rabbit in paginatedRabbits" :key="rabbit.id">
              <td>{{ rabbit.rabbit_id }}</td>
              <td>{{ rabbit.name }}</td>
              <td>{{ rabbit.breed }}</td>
              <td>{{ rabbit.gender }}</td>
              <td>{{ rabbit.weight }} kg</td>
              <td>
                <span :class="['status-badge', rabbit.status.toLowerCase()]">
                  {{ rabbit.status }}
                </span>
              </td>
              <td class="action-cell">
                <button class="icon-button" @click="$router.push(`/rabbits/${rabbit.id}/edit`)">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="icon-button" @click="viewDetails(rabbit)">
                  <i class="pi pi-eye"></i>
                </button>
                <button class="icon-button" @click="deleteRabbit(rabbit)">
                  <i class="pi pi-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="pagination">
          <div class="pagination-info">
            Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, rabbits.length) }} of {{ rabbits.length }} entries
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
      </template>

      <!-- Card View -->
      <div v-else v-for="rabbit in rabbits" :key="rabbit.id" class="rabbit-card">
        <div class="rabbit-header">
          <h3>{{ rabbit.rabbit_id }}</h3>
          <span :class="['status-badge', rabbit.status.toLowerCase()]">{{ rabbit.status }}</span>
        </div>
        <div class="rabbit-info">
          <div class="info-item">
            <span class="label">Name</span>
            <span class="value">{{ rabbit.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">Breed</span>
            <span class="value">{{ rabbit.breed }}</span>
          </div>
          <div class="info-item">
            <span class="label">Gender</span>
            <span class="value">{{ rabbit.gender }}</span>
          </div>
          <div class="info-item">
            <span class="label">Weight</span>
            <span class="value">{{ rabbit.weight }} kg</span>
          </div>
        </div>
        <div class="rabbit-actions">
          <button class="icon-button" @click="$router.push(`/rabbits/${rabbit.id}/edit`)">
            <i class="pi pi-pencil"></i>
          </button>
          <button class="icon-button" @click="viewDetails(rabbit)">
            <i class="pi pi-eye"></i>
          </button>
          <button class="icon-button" @click="deleteRabbit(rabbit)">
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'

export default {
  name: 'RabbitList',
  setup() {
    const rabbits = ref([])
    const isLoading = ref(true)
    const errorMessage = ref('')
    const displayType = ref('card')
    const currentPage = ref(1)
    const itemsPerPage = ref(10)

    const totalPages = computed(() => Math.ceil(rabbits.value.length / itemsPerPage.value))
    const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
    const endIndex = computed(() => startIndex.value + itemsPerPage.value)
    
    const paginatedRabbits = computed(() => {
      return rabbits.value.slice(startIndex.value, endIndex.value)
    })

    const toggleDisplayType = () => {
      displayType.value = displayType.value === 'card' ? 'grid' : 'card'
      currentPage.value = 1 // Reset to first page when switching views
    }

    const fetchRabbits = async () => {
      try {
        isLoading.value = true
        errorMessage.value = ''

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          throw new Error('User not authenticated')
        }

        const { data, error } = await supabase
          .from('rabbits')
          .select('*')
          .eq('created_by', user.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })

        if (error) throw error

        rabbits.value = data
      } catch (error) {
        console.error('Error fetching rabbits:', error)
        errorMessage.value = error.message
      } finally {
        isLoading.value = false
      }
    }

    const deleteRabbit = async (rabbit) => {
      if (!confirm(`Are you sure you want to delete ${rabbit.name}?`)) return

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          throw new Error('User not authenticated')
        }

        // Soft delete - update is_deleted flag instead of hard delete
        const { error } = await supabase
          .from('rabbits')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: user.id
          })
          .eq('id', rabbit.id)
          .eq('created_by', user.id)

        if (error) throw error

        // Remove rabbit from local state
        rabbits.value = rabbits.value.filter(r => r.id !== rabbit.id)
      } catch (error) {
        console.error('Error deleting rabbit:', error)
        alert('Failed to delete rabbit: ' + error.message)
      }
    }

    const viewDetails = (rabbit) => {
      // TODO: Implement rabbit details view
      console.log('View details for:', rabbit)
    }

    onMounted(() => {
      fetchRabbits()
    })

    return {
      rabbits,
      isLoading,
      errorMessage,
      displayType,
      toggleDisplayType,
      deleteRabbit,
      viewDetails,
      // Pagination
      currentPage,
      totalPages,
      paginatedRabbits,
      startIndex,
      endIndex
    }
  }
}
</script>

<style scoped>
.rabbits-page {
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.rabbit-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.3s ease;
}

.rabbit-card:hover {
  transform: translateY(-2px);
}

.rabbit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rabbit-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
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

.status-badge.breeding {
  background: #eff6ff;
  color: #3b82f6;
}

.status-badge.growing {
  background: #fef3c7;
  color: #f59e0b;
}

.status-badge.retired {
  background: #f1f5f9;
  color: #64748b;
}

.rabbit-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item .label {
  font-size: 0.875rem;
  color: #64748b;
}

.info-item .value {
  font-weight: 500;
  color: #1e293b;
}

.rabbit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
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
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: #64748b;
  font-size: 1.125rem;
}

.loading-state i {
  font-size: 1.5rem;
  color: #3b82f6;
}

.error-message {
  background: #fee2e2;
  color: #ef4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  font-size: 3rem;
  color: #94a3b8;
}

.empty-state p {
  color: #64748b;
  font-size: 1.125rem;
  margin: 0;
}

.table-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.action-cell .icon-button {
  padding: 0.5rem;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .data-table {
    min-width: 800px;
  }
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
</style> 