<template>
  <div class="breeding-form">
    <div class="page-header">
      <div>
        <h1>{{ isEditing ? 'Edit Breeding Plan' : 'Add New Breeding Plan' }}</h1>
        <p class="subtitle">{{ isEditing ? 'Update breeding plan information' : 'Create a new breeding plan' }}</p>
      </div>
      <div class="header-actions">
        <button type="button" class="secondary-button" @click="$router.back()">
          <i class="pi pi-times"></i>
          Cancel
        </button>
        <button type="submit" class="primary-button" @click="handleSubmit" :disabled="loading">
          <i class="pi pi-save"></i>
          {{ loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Breeding Plan') }}
        </button>
      </div>
    </div>

    <div class="content-card">
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="breeding-form">
        <div class="form-group">
          <label for="buck">Buck (Male)</label>
          <select v-model="form.buck_id" id="buck" required>
            <option value="">Select a buck</option>
            <option v-for="rabbit in maleRabbits" :key="rabbit.id" :value="rabbit.id">
              {{ rabbit.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="doe">Doe (Female)</label>
          <select v-model="form.doe_id" id="doe" required>
            <option value="">Select a doe</option>
            <option v-for="rabbit in femaleRabbits" :key="rabbit.id" :value="rabbit.id">
              {{ rabbit.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="plannedDate">Planned Mating Date</label>
          <input
            type="date"
            id="plannedDate"
            v-model="form.planned_date"
            required
          />
        </div>

        <div class="form-group">
          <label for="expectedKindleDate">Expected Kindle Date</label>
          <input
            type="date"
            id="expectedKindleDate"
            v-model="form.expected_kindle_date"
            required
          />
        </div>

        <div class="form-group">
          <label for="status">Status</label>
          <select v-model="form.status" id="status" required>
            <option value="Planned">Planned</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="4"
            placeholder="Add any notes or observations..."
          ></textarea>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { generateId } from '@/utils/idGenerator'
import { scheduleIntegration } from '@/services/scheduleIntegration'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const maleRabbits = ref([])
const femaleRabbits = ref([])
const errorMessage = ref('')

const isEditing = computed(() => route.params.id !== undefined)

const form = ref({
  buck_id: '',
  doe_id: '',
  planned_date: '',
  expected_kindle_date: '',
  status: 'Planned',
  notes: '',
})

async function fetchRabbits() {
  try {
    errorMessage.value = ''
    const { data: males, error: maleError } = await supabase
      .from('rabbits')
      .select('id, name')
      .eq('gender', 'Male')
      .eq('status', 'Active')

    if (maleError) throw maleError
    maleRabbits.value = males

    const { data: females, error: femaleError } = await supabase
      .from('rabbits')
      .select('id, name')
      .eq('gender', 'Female')
      .eq('status', 'Active')

    if (femaleError) throw femaleError
    femaleRabbits.value = females
  } catch (error) {
    console.error('Error fetching rabbits:', error)
    errorMessage.value = 'Failed to load rabbits. Please try again.'
  }
}

async function fetchBreedingPlan() {
  if (!isEditing.value) return

  try {
    errorMessage.value = ''
    const { data, error } = await supabase
      .from('breeding_plans')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (error) throw error
    if (data) {
      form.value = {
        buck_id: data.buck_id,
        doe_id: data.doe_id,
        planned_date: data.planned_date,
        expected_kindle_date: data.expected_kindle_date,
        status: data.status,
        notes: data.notes || '',
      }
    }
  } catch (error) {
    console.error('Error fetching breeding plan:', error)
    errorMessage.value = 'Failed to load breeding plan. Please try again.'
    router.push('/breeding')
  }
}

async function handleSubmit() {
  try {
    loading.value = true
    errorMessage.value = ''

    // Validate dates
    const plannedDate = new Date(form.value.planned_date)
    const expectedKindleDate = new Date(form.value.expected_kindle_date)
    if (expectedKindleDate <= plannedDate) {
      throw new Error('Expected kindle date must be after planned mating date')
    }

    const planData = {
      buck_id: form.value.buck_id,
      doe_id: form.value.doe_id,
      planned_date: form.value.planned_date,
      expected_kindle_date: form.value.expected_kindle_date,
      status: form.value.status,
      notes: form.value.notes,
    }

    if (isEditing.value) {
      const { error } = await supabase
        .from('breeding_plans')
        .update(planData)
        .eq('id', route.params.id)

      if (error) throw error
    } else {
      // For new plans, generate a unique plan_id
      planData.plan_id = generateId('BP')
      
      const { data, error } = await supabase
        .from('breeding_plans')
        .insert([planData])
        .select()

      if (error) throw error
      
      // Create breeding milestone events for new plans
      if (data && data.length > 0) {
        try {
          const savedPlan = data[0]
          
          // Get rabbit names for event creation
          const buckRabbit = maleRabbits.value.find(r => r.id === savedPlan.buck_id)
          const doeRabbit = femaleRabbits.value.find(r => r.id === savedPlan.doe_id)
          
          const planWithNames = {
            ...savedPlan,
            buck_name: buckRabbit?.name || 'Unknown Buck',
            doe_name: doeRabbit?.name || 'Unknown Doe'
          }
          
          // Get current user
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await scheduleIntegration.createBreedingMilestones(planWithNames, user.id)
            console.log('Created breeding milestone events')
          }
        } catch (scheduleError) {
          console.error('Failed to create breeding schedule events:', scheduleError)
          // Don't fail the whole operation if schedule creation fails
        }
      }
    }

    router.push('/breeding')
  } catch (error) {
    console.error('Error saving breeding plan:', error)
    errorMessage.value = error.message || 'Failed to save breeding plan. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRabbits()
  fetchBreedingPlan()
})
</script>

<style scoped>
.breeding-form {
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

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.error-message {
  background: #fee2e2;
  color: #ef4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
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

.primary-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
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
  color: #1e293b;
}
</style> 