<template>
  <div class="users-overview-page">
    <div class="page-header">
      <div>
        <h1>Breeder Management</h1>
        <p class="subtitle">View all registered users and their rabbit counts</p>
      </div>
      <div class="header-actions">
        <button class="refresh-button" @click="fetchUsersOverview" :disabled="isLoading">
          <i class="pi pi-refresh" :class="{ 'pi-spin': isLoading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <i class="pi pi-exclamation-triangle"></i>
      {{ error }}
    </div>

    <div class="content-card">
      <div v-if="isLoading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Loading users...</span>
      </div>

      <div v-else-if="allUsers.length === 0" class="empty-state">
        <i class="pi pi-users"></i>
        <p>No users found</p>
      </div>

      <div v-else>
        <!-- Filters -->
        <div class="filters-section">
          <div class="filter-row">
            <div class="filter-group">
              <label>Search</label>
              <input 
                type="text" 
                v-model="filters.search" 
                placeholder="Search by name or email..."
                class="filter-input"
              />
            </div>
            <div class="filter-group">
              <label>Role</label>
              <select v-model="filters.role" class="filter-select">
                <option value="">All Roles</option>
                <option v-for="role in availableRoles" :key="role" :value="role">{{ role }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Status</label>
              <select v-model="filters.status" class="filter-select">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Organization</label>
              <select v-model="filters.organization" class="filter-select">
                <option value="">All Organizations</option>
                <option v-for="org in availableOrganizations" :key="org" :value="org">{{ org }}</option>
              </select>
            </div>
            <div class="filter-group">
              <button @click="clearFilters" class="clear-filters-btn">
                <i class="pi pi-times"></i>
                Clear
              </button>
            </div>
          </div>
        </div>

        <!-- Results Summary -->
        <div class="results-summary">
          <span>Showing {{ startIndex + 1 }}-{{ endIndex }} of {{ filteredUsers.length }} users</span>
          <div class="items-per-page">
            <label>Items per page:</label>
            <select v-model="itemsPerPage" class="page-size-select">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th @click="sortBy('fullName')" class="sortable">
                  Name
                  <i class="pi" :class="sortColumn === 'fullName' ? (sortDirection === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort'"></i>
                </th>
                <th @click="sortBy('email')" class="sortable">
                  Email
                  <i class="pi" :class="sortColumn === 'email' ? (sortDirection === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort'"></i>
                </th>
                <th @click="sortBy('role')" class="sortable">
                  Role
                  <i class="pi" :class="sortColumn === 'role' ? (sortDirection === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort'"></i>
                </th>
                <th @click="sortBy('organization')" class="sortable">
                  Organization
                  <i class="pi" :class="sortColumn === 'organization' ? (sortDirection === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort'"></i>
                </th>
                <th @click="sortBy('rabbitCount')" class="sortable">
                  Total Rabbits
                  <i class="pi" :class="sortColumn === 'rabbitCount' ? (sortDirection === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort'"></i>
                </th>
                <th>Verified</th>
                <th @click="sortBy('status')" class="sortable">
                  Status
                  <i class="pi" :class="sortColumn === 'status' ? (sortDirection === 'asc' ? 'pi-sort-up' : 'pi-sort-down') : 'pi-sort'"></i>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedUsers" :key="user.id">
                <td>{{ user.fullName }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="role-badge">{{ user.role }}</span>
                </td>
                <td>{{ user.organization || 'N/A' }}</td>
                <td>
                  <span class="rabbit-count">
                    <i class="mdi mdi-rabbit"></i>
                    {{ user.rabbitCount }}
                  </span>
                </td>
                <td>
                  <span v-if="user.isVerified" class="verified-badge" title="Email verified">
                    <i class="pi pi-check-circle"></i>
                    Verified
                  </span>
                  <span v-else class="pending-badge" title="Waiting for email verification">
                    <i class="pi pi-clock"></i>
                    Pending
                  </span>
                </td>
                <td>
                  <span class="status-badge" :class="user.status === 'active' ? 'active' : 'inactive'">
                    {{ user.status || 'active' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button 
            @click="goToPage(1)" 
            :disabled="currentPage === 1"
            class="page-btn"
          >
            <i class="pi pi-angle-double-left"></i>
          </button>
          <button 
            @click="goToPage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="page-btn"
          >
            <i class="pi pi-angle-left"></i>
          </button>
          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button 
            @click="goToPage(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="page-btn"
          >
            <i class="pi pi-angle-right"></i>
          </button>
          <button 
            @click="goToPage(totalPages)" 
            :disabled="currentPage === totalPages"
            class="page-btn"
          >
            <i class="pi pi-angle-double-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '@/supabase'

export default {
  name: 'UsersOverview',
  setup() {
    const allUsers = ref([])
    const isLoading = ref(false)
    const error = ref('')
    
    // Filters
    const filters = ref({
      search: '',
      role: '',
      status: '',
      organization: ''
    })
    
    // Sorting
    const sortColumn = ref('fullName')
    const sortDirection = ref('asc')
    
    // Pagination
    const currentPage = ref(1)
    const itemsPerPage = ref(10)

    const fetchUsersOverview = async () => {
      try {
        isLoading.value = true
        error.value = ''

        // Fetch all users from profiles table with their roles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            first_name,
            last_name,
            organization,
            status,
            role_id,
            roles (
              name
            )
          `)
          .order('first_name', { ascending: true })

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError)
          throw profilesError
        }

        console.log('Fetched profiles:', profiles?.length || 0)
        if (!profiles || profiles.length === 0) {
          allUsers.value = []
          return
        }
        
        // Fetch all rabbits to count per user
        const { data: allRabbits, error: rabbitsError } = await supabase
          .from('rabbits')
          .select('created_by')
          .eq('is_deleted', false)

        if (rabbitsError) {
          console.error('Error fetching rabbits:', rabbitsError)
          error.value = `Failed to load rabbit counts: ${rabbitsError.message}`
        } else {
          console.log('Fetched rabbits:', allRabbits?.length || 0)
        }

        // Count rabbits per user
        const rabbitCounts = {}
        if (allRabbits && allRabbits.length > 0) {
          allRabbits.forEach(rabbit => {
            if (rabbit.created_by) {
              rabbitCounts[rabbit.created_by] = (rabbitCounts[rabbit.created_by] || 0) + 1
            }
          })
          console.log('Rabbit counts by user:', rabbitCounts)
        } else {
          console.log('No rabbits found or empty array')
        }

        // Fetch emails from auth.users (we'll need to use admin API or a different approach)
        // For now, we'll try to get emails from a view or function if available
        // Otherwise, we'll show the user ID or try to get email from auth
        
        // First, test if current user is recognized as SUPER_ADMIN
        try {
          const { data: roleTest, error: roleTestError } = await supabase
            .rpc('test_current_user_role')
          
          if (roleTestError) {
            console.error('Error testing user role:', roleTestError)
          } else if (roleTest && roleTest.length > 0) {
            const testResult = roleTest[0]
            console.log('Current user role test:', {
              userId: testResult.user_id,
              isSuperAdmin: testResult.is_super_admin,
              roleName: testResult.role_name,
              email: testResult.email
            })
          }
        } catch (e) {
          console.warn('Could not test user role (function may not exist):', e)
        }

        // Try to get emails and verification status from a database function if available
        let userEmails = {}
        let userVerification = {}
        try {
          const { data: usersWithEmails, error: emailError } = await supabase
            .rpc('get_users_with_emails')
          
          if (emailError) {
            console.error('Error calling get_users_with_emails:', emailError)
            console.error('Error details:', JSON.stringify(emailError, null, 2))
          } else if (usersWithEmails) {
            console.log('Fetched emails for', usersWithEmails.length, 'users')
            console.log('Email data:', usersWithEmails)
            usersWithEmails.forEach(user => {
              userEmails[user.id] = user.email
              // Check if email is verified (email_confirmed_at exists) or has last_sign_in_at
              userVerification[user.id] = !!(user.email_confirmed_at || user.last_sign_in_at)
            })
            console.log('Email mapping object:', userEmails)
            console.log('Verification status:', userVerification)
          } else {
            console.log('No emails returned from function (null or empty)')
          }
        } catch (e) {
          console.error('Exception calling get_users_with_emails:', e)
        }

        // Build the overview array
        const overview = profiles.map((profile) => {
          // Use user_id to match emails (user_id references auth.users.id)
          // Also use user_id for rabbit counts if that's how they're stored
          const userId = profile.user_id || profile.id
          const count = rabbitCounts[userId] || rabbitCounts[profile.id] || 0
          const email = userEmails[userId] || userEmails[profile.id] || 'N/A'
          const isVerified = userVerification[userId] || userVerification[profile.id] || false
          console.log(`User ${profile.id} (user_id: ${userId}): ${profile.first_name} ${profile.last_name}, Rabbits: ${count}, Email: ${email}, Verified: ${isVerified}`)
          return {
            id: profile.id,
            userId: userId,
            fullName: `${profile.first_name} ${profile.last_name}`,
            email: email,
            role: profile.roles?.name || 'USER',
            organization: profile.organization || 'N/A',
            rabbitCount: count,
            isVerified: isVerified,
            status: profile.status || 'active'
          }
        })
        
        console.log('Final overview:', overview)
        allUsers.value = overview
        // Reset to first page when data changes
        currentPage.value = 1
      } catch (err) {
        console.error('Error fetching users overview:', err)
        error.value = `Failed to load users: ${err.message || 'Please try again.'}`
      } finally {
        isLoading.value = false
      }
    }

    // Computed: Available roles for filter
    const availableRoles = computed(() => {
      const roles = new Set()
      allUsers.value.forEach(user => {
        if (user.role) roles.add(user.role)
      })
      return Array.from(roles).sort()
    })
    
    // Computed: Available organizations for filter
    const availableOrganizations = computed(() => {
      const orgs = new Set()
      allUsers.value.forEach(user => {
        if (user.organization && user.organization !== 'N/A') {
          orgs.add(user.organization)
        }
      })
      return Array.from(orgs).sort()
    })
    
    // Computed: Filtered users
    const filteredUsers = computed(() => {
      let filtered = [...allUsers.value]
      
      // Search filter
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        filtered = filtered.filter(user => 
          user.fullName.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
        )
      }
      
      // Role filter
      if (filters.value.role) {
        filtered = filtered.filter(user => user.role === filters.value.role)
      }
      
      // Status filter
      if (filters.value.status) {
        filtered = filtered.filter(user => user.status === filters.value.status)
      }
      
      // Organization filter
      if (filters.value.organization) {
        filtered = filtered.filter(user => user.organization === filters.value.organization)
      }
      
      // Sorting
      filtered.sort((a, b) => {
        let aVal = a[sortColumn.value]
        let bVal = b[sortColumn.value]
        
        // Handle null/undefined values
        if (aVal == null) aVal = ''
        if (bVal == null) bVal = ''
        
        // Convert to string for comparison if needed
        if (typeof aVal !== 'string') {
          aVal = String(aVal)
          bVal = String(bVal)
        }
        
        const comparison = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
        return sortDirection.value === 'asc' ? comparison : -comparison
      })
      
      return filtered
    })
    
    // Computed: Pagination
    const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage.value))
    const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
    const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, filteredUsers.value.length))
    const paginatedUsers = computed(() => {
      return filteredUsers.value.slice(startIndex.value, endIndex.value)
    })
    
    // Methods
    const sortBy = (column) => {
      if (sortColumn.value === column) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortColumn.value = column
        sortDirection.value = 'asc'
      }
      currentPage.value = 1 // Reset to first page when sorting
    }
    
    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
        // Scroll to top of table
        const tableContainer = document.querySelector('.table-container')
        if (tableContainer) {
          tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }
    
    const clearFilters = () => {
      filters.value = {
        search: '',
        role: '',
        status: '',
        organization: ''
      }
      currentPage.value = 1
    }
    
    // Watch filters to reset to first page
    watch([() => filters.value.search, () => filters.value.role, () => filters.value.status, () => filters.value.organization], () => {
      currentPage.value = 1
    })
    
    // Watch itemsPerPage to reset to first page
    watch(itemsPerPage, () => {
      currentPage.value = 1
    })

    onMounted(() => {
      fetchUsersOverview()
    })

    return {
      allUsers,
      isLoading,
      error,
      fetchUsersOverview,
      filters,
      availableRoles,
      availableOrganizations,
      filteredUsers,
      paginatedUsers,
      sortColumn,
      sortDirection,
      sortBy,
      currentPage,
      itemsPerPage,
      totalPages,
      startIndex,
      endIndex,
      goToPage,
      clearFilters
    }
  }
}
</script>

<style scoped>
.users-overview-page {
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

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #64748b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-button:hover:not(:disabled) {
  background: #475569;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 1rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #64748b;
  gap: 1rem;
}

.loading-state i,
.empty-state i {
  font-size: 3rem;
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
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  background: #e0e7ff;
  color: #4338ca;
  font-weight: 500;
}

.rabbit-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #059669;
}

.rabbit-count i {
  font-size: 1.25rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.active {
  background: #f0fdf4;
  color: #10b981;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #dc2626;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  background: #f0fdf4;
  color: #10b981;
}

.verified-badge i {
  font-size: 1rem;
}

.pending-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  background: #fef3c7;
  color: #d97706;
}

.pending-badge i {
  font-size: 1rem;
}

.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Filters Section */
.filters-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 150px;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.filter-input,
.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.clear-filters-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

/* Results Summary */
.results-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem 0;
  font-size: 0.875rem;
  color: #64748b;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-size-select {
  padding: 0.375rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

/* Sortable Table Headers */
.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 2rem !important;
}

.sortable:hover {
  background: #f8fafc;
}

.sortable i {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: #94a3b8;
}

.sortable:hover i {
  color: #64748b;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.page-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  padding: 0 1rem;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .results-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}
</style>

