<template>
  <div class="pricing-management-page">
    <div class="page-header">
      <div>
        <h1>Pricing Management</h1>
        <p class="subtitle">Manage your pricing plan for the landing page</p>
      </div>
      <div class="header-actions">
        <button 
          v-if="pricingPlans.length === 0" 
          class="btn-primary" 
          @click="openAddModal"
        >
          <i class="pi pi-plus"></i>
          Add Pricing Plan
        </button>
        <button class="refresh-button" @click="fetchPricingPlans" :disabled="isLoading">
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
        <span>Loading pricing plan...</span>
      </div>

      <div v-else-if="pricingPlans.length === 0" class="empty-state">
        <i class="pi pi-tag"></i>
        <p>No pricing plan configured</p>
        <p class="empty-hint">Add your pricing plan to display on the landing page</p>
        <button class="btn-primary" @click="openAddModal">
          <i class="pi pi-plus"></i>
          Add Pricing Plan
        </button>
      </div>

      <div v-else>
        <!-- Table -->
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Rabbits</th>
                <th>Features</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in sortedPricingPlans" :key="plan.id">
                <td>
                  <strong>{{ plan.name }}</strong>
                  <div class="badges">
                    <span v-if="plan.is_popular" class="badge badge-popular">Popular</span>
                    <span v-if="plan.is_custom" class="badge badge-custom">Custom</span>
                  </div>
                </td>
                <td>{{ plan.description }}</td>
                <td>
                  <span v-if="plan.currency">{{ plan.currency }} </span>
                  <strong>{{ plan.price }}</strong>
                  <span v-if="plan.period">{{ plan.period }}</span>
                </td>
                <td>{{ plan.rabbits === 999999 ? '500+' : plan.rabbits }}</td>
                <td>
                  <ul class="features-list">
                    <li v-for="(feature, idx) in plan.features" :key="idx">{{ feature }}</li>
                  </ul>
                </td>
                <td>
                  <span :class="['status-badge', plan.is_active ? 'active' : 'inactive']">
                    {{ plan.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon" @click="openEditModal(plan)" title="Edit">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="btn-icon btn-danger" @click="confirmDelete(plan)" title="Delete">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Edit Plan' : 'Add New Plan' }}</h2>
          <button class="modal-close" @click="closeModal">
            <i class="pi pi-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="savePlan">
            <div class="form-row">
              <div class="form-group">
                <label>Plan Name *</label>
                <input v-model="formData.name" type="text" required class="form-control" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <input v-model="formData.description" type="text" class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Price *</label>
                <input v-model="formData.price" type="text" required class="form-control" placeholder="e.g., 40 or Free" />
              </div>
              <div class="form-group">
                <label>Currency</label>
                <input v-model="formData.currency" type="text" class="form-control" placeholder="e.g., R or $" />
              </div>
              <div class="form-group">
                <label>Period</label>
                <input v-model="formData.period" type="text" class="form-control" placeholder="e.g., /month" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Number of Rabbits *</label>
                <input v-model.number="formData.rabbits" type="number" required class="form-control" placeholder="e.g., 5" />
              </div>
            </div>

            <div class="form-group">
              <label>Features (one per line) *</label>
              <textarea v-model="featuresText" rows="5" required class="form-control" placeholder="Up to 5 rabbits&#10;Basic features included&#10;Community support"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Button Text *</label>
                <input v-model="formData.button_text" type="text" required class="form-control" placeholder="e.g., Get Started" />
              </div>
              <div class="form-group">
                <label>Button Link *</label>
                <input v-model="formData.button_link" type="text" required class="form-control" placeholder="e.g., /register" />
              </div>
              <div class="form-group">
                <label>Button Class</label>
                <select v-model="formData.button_class" class="form-control">
                  <option value="btn-primary">Primary</option>
                  <option value="btn-secondary">Secondary</option>
                </select>
              </div>
            </div>

            <div class="form-row checkboxes">
              <div class="form-check">
                <input v-model="formData.is_popular" type="checkbox" id="isPopular" />
                <label for="isPopular">Mark as Popular</label>
              </div>
              <div class="form-check">
                <input v-model="formData.is_custom" type="checkbox" id="isCustom" />
                <label for="isCustom">Mark as Custom</label>
              </div>
              <div class="form-check">
                <input v-model="formData.is_active" type="checkbox" id="isActive" />
                <label for="isActive">Active</label>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="isSaving">
                <i class="pi pi-spin pi-spinner" v-if="isSaving"></i>
                {{ isSaving ? 'Saving...' : 'Save Plan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="modal-close" @click="closeDeleteModal">
            <i class="pi pi-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <p>Are you sure you want to delete the <strong>{{ planToDelete?.name }}</strong> pricing plan?</p>
          <p class="warning-text">This will remove the pricing information from your landing page until you add a new plan.</p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeDeleteModal">Cancel</button>
          <button type="button" class="btn-danger" @click="deletePlan" :disabled="isDeleting">
            <i class="pi pi-spin pi-spinner" v-if="isDeleting"></i>
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/supabase'

export default {
  name: 'PricingManagement',
  setup() {
    const pricingPlans = ref([])
    const isLoading = ref(false)
    const error = ref(null)
    const showModal = ref(false)
    const showDeleteModal = ref(false)
    const isEditMode = ref(false)
    const isSaving = ref(false)
    const isDeleting = ref(false)
    const planToDelete = ref(null)
    const featuresText = ref('')

    const formData = ref({
      id: null,
      name: '',
      description: '',
      price: '',
      currency: '',
      period: '',
      rabbits: 5,
      features: [],
      is_popular: false,
      is_custom: false,
      is_active: true,
      button_text: 'Get Started',
      button_link: '/register',
      button_class: 'btn-primary',
      display_order: 0
    })

    const sortedPricingPlans = computed(() => {
      return [...pricingPlans.value].sort((a, b) => a.display_order - b.display_order)
    })

    const fetchPricingPlans = async () => {
      isLoading.value = true
      error.value = null

      try {
        const { data, error: fetchError } = await supabase
          .from('pricing_plans')
          .select('*')
          .order('display_order', { ascending: true })

        if (fetchError) throw fetchError

        pricingPlans.value = data || []
      } catch (err) {
        console.error('Error fetching pricing plans:', err)
        error.value = err.message || 'Failed to fetch pricing plans'
      } finally {
        isLoading.value = false
      }
    }

    const openAddModal = () => {
      // Prevent adding if a plan already exists
      if (pricingPlans.value.length > 0) {
        error.value = 'Only one pricing plan is allowed. Please edit or delete the existing plan.'
        return
      }
      
      isEditMode.value = false
      formData.value = {
        id: null,
        name: '',
        description: '',
        price: '',
        currency: '',
        period: '',
        rabbits: 5,
        features: [],
        is_popular: false,
        is_custom: false,
        is_active: true,
        button_text: 'Get Started',
        button_link: '/register',
        button_class: 'btn-primary',
        display_order: 1
      }
      featuresText.value = ''
      showModal.value = true
    }

    const openEditModal = (plan) => {
      isEditMode.value = true
      formData.value = { ...plan }
      featuresText.value = plan.features.join('\n')
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
      formData.value = {
        id: null,
        name: '',
        description: '',
        price: '',
        currency: '',
        period: '',
        rabbits: 5,
        features: [],
        is_popular: false,
        is_custom: false,
        is_active: true,
        button_text: 'Get Started',
        button_link: '/register',
        button_class: 'btn-primary',
        display_order: 0
      }
      featuresText.value = ''
    }

    const savePlan = async () => {
      isSaving.value = true
      error.value = null

      try {
        // Convert features text to array
        const features = featuresText.value
          .split('\n')
          .map(f => f.trim())
          .filter(f => f.length > 0)

        const planData = {
          ...formData.value,
          features
        }

        if (isEditMode.value) {
          // Update existing plan
          const { error: updateError } = await supabase
            .from('pricing_plans')
            .update(planData)
            .eq('id', planData.id)

          if (updateError) throw updateError
        } else {
          // Create new plan
          delete planData.id
          const { error: insertError } = await supabase
            .from('pricing_plans')
            .insert([planData])

          if (insertError) throw insertError
        }

        closeModal()
        await fetchPricingPlans()
      } catch (err) {
        console.error('Error saving pricing plan:', err)
        error.value = err.message || 'Failed to save pricing plan'
      } finally {
        isSaving.value = false
      }
    }

    const confirmDelete = (plan) => {
      planToDelete.value = plan
      showDeleteModal.value = true
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
      planToDelete.value = null
    }

    const deletePlan = async () => {
      if (!planToDelete.value) return

      isDeleting.value = true
      error.value = null

      try {
        const { error: deleteError } = await supabase
          .from('pricing_plans')
          .delete()
          .eq('id', planToDelete.value.id)

        if (deleteError) throw deleteError

        closeDeleteModal()
        await fetchPricingPlans()
      } catch (err) {
        console.error('Error deleting pricing plan:', err)
        error.value = err.message || 'Failed to delete pricing plan'
      } finally {
        isDeleting.value = false
      }
    }

    onMounted(() => {
      fetchPricingPlans()
    })

    return {
      pricingPlans,
      sortedPricingPlans,
      isLoading,
      error,
      showModal,
      showDeleteModal,
      isEditMode,
      isSaving,
      isDeleting,
      formData,
      featuresText,
      planToDelete,
      fetchPricingPlans,
      openAddModal,
      openEditModal,
      closeModal,
      savePlan,
      confirmDelete,
      closeDeleteModal,
      deletePlan
    }
  }
}
</script>

<style scoped>
.pricing-management-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #1e293b;
  margin: 0;
}

.subtitle {
  color: #64748b;
  margin: 0.5rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-button:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.content-card {
  background: white;
  border-radius: 12px;
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
  color: #cbd5e1;
}

.empty-hint {
  color: #94a3b8;
  font-size: 0.875rem;
  margin-top: -0.5rem;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.badges {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-popular {
  background: #dbeafe;
  color: #1e40af;
}

.badge-custom {
  background: #fef3c7;
  color: #92400e;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.875rem;
}

.features-list li {
  padding: 0.25rem 0;
  color: #64748b;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #3b82f6;
}

.btn-icon.btn-danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #ef4444;
}

/* Modal Styles */
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content.delete-modal {
  max-width: 500px;
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
  font-size: 1.5rem;
  color: #1e293b;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: #1e293b;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-row.checkboxes {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #475569;
  font-size: 0.875rem;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

textarea.form-control {
  resize: vertical;
  font-family: inherit;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-check input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.form-check label {
  cursor: pointer;
  font-weight: 500;
  color: #475569;
}

.warning-text {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .pricing-management-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .header-actions button {
    width: 100%;
    justify-content: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-row.checkboxes {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>

