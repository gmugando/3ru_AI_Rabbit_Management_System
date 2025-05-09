<template>
  <div class="transaction-form-page">
    <div class="page-header">
      <div>
        <h1>Add Transaction</h1>
        <p class="subtitle">Record a new financial transaction</p>
      </div>
      <div class="header-actions">
        <router-link to="/finance" class="secondary-button">
          <i class="pi pi-arrow-left"></i>
          Back to Finance
        </router-link>
      </div>
    </div>

    <div class="form-container">
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="transaction-form">
        <div class="form-section">
          <h2>Transaction Details</h2>
          
          <div class="form-group">
            <label for="transactionType">Transaction Type</label>
            <div class="type-selector">
              <button 
                type="button" 
                :class="['type-button', { active: form.type === 'revenue' }]"
                @click="form.type = 'revenue'"
              >
                <i class="pi pi-arrow-up"></i>
                Revenue
              </button>
              <button 
                type="button" 
                :class="['type-button', { active: form.type === 'expense' }]"
                @click="form.type = 'expense'"
              >
                <i class="pi pi-arrow-down"></i>
                Expense
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="amount">Amount</label>
            <div class="input-with-icon">
              <span class="input-icon">$</span>
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
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <input 
              type="text" 
              id="description" 
              v-model="form.description" 
              required 
              class="form-control"
              placeholder="Enter transaction description"
            >
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

          <div class="form-group">
            <label for="category">Category</label>
            <select 
              id="category" 
              v-model="form.category" 
              required 
              class="form-control"
            >
              <option value="" disabled>Select a category</option>
              <option v-if="form.type === 'revenue'" value="rabbit_sale">Rabbit Sale</option>
              <option v-if="form.type === 'revenue'" value="market_sales">Market Sales</option>
              <option v-if="form.type === 'revenue'" value="other_revenue">Other Revenue</option>
              <option v-if="form.type === 'expense'" value="feed_supplies">Feed & Supplies</option>
              <option v-if="form.type === 'expense'" value="equipment">Equipment</option>
              <option v-if="form.type === 'expense'" value="veterinary">Veterinary</option>
              <option v-if="form.type === 'expense'" value="other_expense">Other Expense</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h2>Additional Information</h2>
          
          <div class="form-group">
            <label for="reference">Reference Number (Optional)</label>
            <input 
              type="text" 
              id="reference" 
              v-model="form.reference" 
              class="form-control"
              placeholder="Invoice number, receipt number, etc."
            >
          </div>

          <div class="form-group">
            <label for="notes">Notes (Optional)</label>
            <textarea 
              id="notes" 
              v-model="form.notes" 
              class="form-control"
              placeholder="Additional notes about this transaction"
              rows="4"
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <router-link to="/finance" class="secondary-button">
            Cancel
          </router-link>
          <button type="submit" class="primary-button" :disabled="isSubmitting">
            {{ isSubmitting ? 'Adding Transaction...' : 'Add Transaction' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'

export default {
  name: 'TransactionForm',
  setup() {
    const router = useRouter()
    const isSubmitting = ref(false)
    const errorMessage = ref('')

    const form = reactive({
      type: 'revenue',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      reference: '',
      notes: ''
    })

    const handleSubmit = async () => {
      try {
        isSubmitting.value = true
        errorMessage.value = ''

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('You must be logged in to add a transaction')
        }

        // Add transaction to Supabase
        const { error } = await supabase
          .from('transactions')
          .insert([
            {
              type: form.type,
              amount: parseFloat(form.amount),
              description: form.description,
              date: form.date,
              category: form.category,
              reference: form.reference || null,
              notes: form.notes || null,
              user_id: user.id,
              created_at: new Date().toISOString()
            }
          ])

        if (error) throw error

        // Redirect back to finance page
        router.push('/finance')
        
      } catch (error) {
        console.error('Error adding transaction:', error)
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
.transaction-form-page {
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

.transaction-form {
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
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.input-with-icon .form-control {
  padding-left: 2rem;
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