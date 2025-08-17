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

        <!-- Kit Tracking Section (shown when status is Completed) -->
        <div v-if="form.status === 'Completed'" class="kit-tracking-section">
          <h3>Kit Information</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="actualKindleDate">Actual Kindle Date</label>
              <input
                type="date"
                id="actualKindleDate"
                v-model="form.actual_kindle_date"
              />
            </div>
            
            <div class="form-group">
              <label for="kitsBorn">Kits Born</label>
              <input
                type="number"
                id="kitsBorn"
                v-model="form.kits_born"
                min="0"
                max="20"
                placeholder="0"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="kitsMale">Male Kits</label>
              <input
                type="number"
                id="kitsMale"
                v-model="form.kits_male"
                min="0"
                :max="form.kits_born || 0"
                placeholder="0"
              />
            </div>
            
            <div class="form-group">
              <label for="kitsFemale">Female Kits</label>
              <input
                type="number"
                id="kitsFemale"
                v-model="form.kits_female"
                min="0"
                :max="form.kits_born || 0"
                placeholder="0"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="kitsSurvived">Kits Survived</label>
              <input
                type="number"
                id="kitsSurvived"
                v-model="form.kits_survived"
                min="0"
                :max="form.kits_born || 0"
                placeholder="0"
              />
            </div>
            
            <div class="form-group">
              <label for="averageBirthWeight">Average Birth Weight (g)</label>
              <input
                type="number"
                id="averageBirthWeight"
                v-model="form.average_birth_weight"
                min="0"
                step="0.1"
                placeholder="0.0"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="kitColor">Kit Color</label>
            <input
              type="text"
              id="kitColor"
              v-model="form.kit_color"
              placeholder="e.g., White, Black, Brown, Mixed"
            />
          </div>

          <div class="form-group">
            <label for="kindlingNotes">Kindling Notes</label>
            <textarea
              id="kindlingNotes"
              v-model="form.kindling_notes"
              rows="3"
              placeholder="Any observations about the kindling process..."
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="weaningDate">Weaning Date</label>
              <input
                type="date"
                id="weaningDate"
                v-model="form.weaning_date"
              />
            </div>
            
            <div class="form-group">
              <label for="weaningCount">Weaned Kits</label>
              <input
                type="number"
                id="weaningCount"
                v-model="form.weaning_count"
                min="0"
                :max="form.kits_survived || 0"
                placeholder="0"
              />
            </div>
          </div>
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
import kitManagementService from '@/services/kitManagement'

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
  // Kit tracking fields
  actual_kindle_date: '',
  kits_born: 0,
  kits_male: 0,
  kits_female: 0,
  kits_survived: 0,
  average_birth_weight: null,
  kit_color: '',
  kindling_notes: '',
  weaning_date: '',
  weaning_count: 0,
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
        // Kit tracking fields
        actual_kindle_date: data.actual_kindle_date || '',
        kits_born: data.kits_born || 0,
        kits_male: data.kits_male || 0,
        kits_female: data.kits_female || 0,
        kits_survived: data.kits_survived || 0,
        average_birth_weight: data.average_birth_weight || null,
        kit_color: data.kit_color || '',
        kindling_notes: data.kindling_notes || '',
        weaning_date: data.weaning_date || '',
        weaning_count: data.weaning_count || 0,
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
      // Kit tracking fields (only include if status is Completed)
      ...(form.value.status === 'Completed' && {
        actual_kindle_date: form.value.actual_kindle_date || null,
        kits_born: form.value.kits_born || 0,
        kits_male: form.value.kits_male || 0,
        kits_female: form.value.kits_female || 0,
        kits_survived: form.value.kits_survived || 0,
        average_birth_weight: form.value.average_birth_weight || null,
        kit_color: form.value.kit_color || null,
        kindling_notes: form.value.kindling_notes || null,
        weaning_date: form.value.weaning_date || null,
        weaning_count: form.value.weaning_count || 0,
      })
    }

    if (isEditing.value) {
      const { error } = await supabase
        .from('breeding_plans')
        .update(planData)
        .eq('id', route.params.id)

      if (error) throw error
      
      // If status is Completed and we have kit data, create individual kit records
      if (planData.status === 'Completed' && planData.kits_born > 0) {
        try {
          await kitManagementService.createKitRecords(route.params.id, planData)
          console.log('Created individual kit records')
        } catch (kitError) {
          console.error('Failed to create kit records:', kitError)
          // Don't fail the whole operation if kit creation fails
        }
      }
    } else {
      // For new plans, generate a unique plan_id
      planData.plan_id = generateId('BP')
      
      const { data, error } = await supabase
        .from('breeding_plans')
        .insert([planData])
        .select()

      if (error) throw error
      
      // If status is Completed and we have kit data, create individual kit records
      if (planData.status === 'Completed' && planData.kits_born > 0 && data && data.length > 0) {
        try {
          await kitManagementService.createKitRecords(data[0].id, planData)
          console.log('Created individual kit records')
        } catch (kitError) {
          console.error('Failed to create kit records:', kitError)
          // Don't fail the whole operation if kit creation fails
        }
      }
      
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

.kit-tracking-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.kit-tracking-section h3 {
  margin-bottom: 1.5rem;
  color: #1e293b;
  font-size: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style> 