<template>
  <div class="feed-record-form-page">
    <div class="page-header">
      <div>
        <h1>Add Feed Record</h1>
        <p class="subtitle">Record feed consumption and stock updates</p>
      </div>
      <div class="header-actions">
        <router-link to="/feeding" class="secondary-button">
          <i class="pi pi-arrow-left"></i>
          Back to Feeding
        </router-link>
      </div>
    </div>

    <div class="form-container">
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="feed-record-form">
        <div class="form-section">
          <h2>Feed Details</h2>
          
          <div class="form-group">
            <label for="feedType">Feed Type</label>
            <select 
              id="feedType" 
              v-model="form.feedType" 
              required 
              class="form-control"
            >
              <option value="" disabled>Select feed type</option>
              <option value="adult_rabbit_feed">Adult Rabbit Feed</option>
              <option value="growing_rabbit_feed">Growing Rabbit Feed</option>
              <option value="breeding_rabbit_feed">Breeding Rabbit Feed</option>
              <option value="hay">Hay</option>
              <option value="supplements">Supplements</option>
            </select>
          </div>

          <div class="form-group">
            <label for="feedBrand">Feed Brand/Formula</label>
            <input 
              type="text" 
              id="feedBrand" 
              v-model="form.feedBrand" 
              required 
              class="form-control"
              placeholder="Enter feed brand or formula name"
            >
          </div>

          <div class="form-group">
            <label for="recordType">Record Type</label>
            <div class="type-selector">
              <button 
                type="button" 
                :class="['type-button', { active: form.recordType === 'consumption' }]"
                @click="form.recordType = 'consumption'"
              >
                <i class="pi pi-arrow-down"></i>
                Consumption
              </button>
              <button 
                type="button" 
                :class="['type-button', { active: form.recordType === 'stock_update' }]"
                @click="form.recordType = 'stock_update'"
              >
                <i class="pi pi-box"></i>
                Stock Update
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="amount">Amount (kg)</label>
            <div class="input-with-icon">
              <input 
                type="number" 
                id="amount" 
                v-model="form.amount" 
                required 
                class="form-control"
                placeholder="0.00"
                step="0.01"
                min="0"
              >
              <span class="input-icon">kg</span>
            </div>
          </div>

          <div class="form-group">
            <label for="date">Date</label>
            <input 
              type="date" 
              id="date" 
              v-model="form.date" 
              required 
              class="form-control"
            >
          </div>
        </div>

        <div class="form-section">
          <h2>Additional Information</h2>
          
          <div class="form-group">
            <label for="sections">Sections Fed (Optional)</label>
            <input 
              type="text" 
              id="sections" 
              v-model="form.sections" 
              class="form-control"
              placeholder="e.g., Section A, B, C"
            >
          </div>

          <div class="form-group">
            <label for="notes">Notes (Optional)</label>
            <textarea 
              id="notes" 
              v-model="form.notes" 
              class="form-control"
              placeholder="Additional notes about this feed record"
              rows="4"
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <router-link to="/feeding" class="secondary-button">
            Cancel
          </router-link>
          <button type="submit" class="primary-button" :disabled="isSubmitting">
            {{ isSubmitting ? 'Adding Record...' : 'Add Record' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'FeedRecordForm',
  setup() {
    const router = useRouter()
    const isSubmitting = ref(false)
    const errorMessage = ref('')

    const form = reactive({
      feedType: 'adult_rabbit_feed',
      feedBrand: '',
      recordType: 'consumption',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      sections: '',
      notes: ''
    })

    onMounted(() => {
      console.log('Form mounted:', form)
    })

    const handleSubmit = async () => {
      try {
        console.log('Submitting form:', form)
        isSubmitting.value = true
        errorMessage.value = ''

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('You must be logged in to add a feed record')
        }

        // Add feed record to Supabase
        const { data, error } = await supabase
          .from('feed_records')
          .insert([
            {
              feed_type: form.feedType,
              feed_brand: form.feedBrand,
              record_type: form.recordType,
              amount: parseFloat(form.amount),
              date: form.date,
              sections: form.sections || null,
              notes: form.notes || null,
              user_id: user.id
            }
          ])
          .select()

        if (error) throw error

        console.log('Record added successfully:', data)
        // Redirect back to feeding page
        router.push('/feeding')
        
      } catch (error) {
        console.error('Error adding feed record:', error)
        errorMessage.value = error.message
      } finally {
        isSubmitting.value = false
      }
    }

    return {
      form,
      isSubmitting,
      errorMessage,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.feed-record-form-page {
  padding: 1.5rem;
  min-height: 100vh;
  background-color: #f8fafc;
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

.form-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.error-message {
  background: #fef2f2;
  color: #ef4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.feed-record-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section h2 {
  font-size: 1.25rem;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  color: #64748b;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1e293b;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
}

.type-selector {
  display: flex;
  gap: 1rem;
}

.type-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-button:hover {
  background: #f1f5f9;
}

.type-button.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.input-with-icon .form-control {
  padding-right: 3rem;
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
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
  text-decoration: none;
}

.secondary-button:hover {
  background: #f8fafc;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
  }

  .secondary-button {
    width: 100%;
    justify-content: center;
  }

  .type-selector {
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column;
  }

  .primary-button, .secondary-button {
    width: 100%;
    justify-content: center;
  }
}
</style> 