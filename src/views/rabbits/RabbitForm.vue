<template>
  <div class="rabbit-form-page">
    <div class="page-header">
      <div>
        <h1>{{ isEditing ? 'Edit Rabbit' : 'Add New Rabbit' }}</h1>
        <p class="subtitle">{{ isEditing ? 'Update rabbit information' : 'Register a new rabbit in the system' }}</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="$router.back()">
          <i class="pi pi-times"></i>
          Cancel
        </button>
        <button class="primary-button" @click="handleSubmit" :disabled="isLoading">
          <i class="pi pi-save"></i>
          {{ isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Rabbit') }}
        </button>
      </div>
    </div>

    <div class="content-card">
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="rabbit-form">
        <div class="form-grid">
          <!-- Basic Information -->
          <div class="form-section">
            <h2>Basic Information</h2>
            <div class="form-group">
              <label for="rabbitId">Rabbit ID</label>
              <input 
                type="text" 
                id="rabbitId" 
                v-model="form.rabbitId" 
                class="form-control"
                :placeholder="isEditing ? '' : 'Auto-generated'"
                :disabled="isEditing"
              >
            </div>

            <div class="form-group">
              <label for="name">Name</label>
              <input 
                type="text" 
                id="name" 
                v-model="form.name" 
                class="form-control"
                placeholder="Enter rabbit's name"
                required
              >
            </div>

            <div class="form-group">
              <label for="breed">Breed</label>
              <select id="breed" v-model="form.breed" class="form-control" required>
                <option value="">Select breed</option>
                <option value="New Zealand White">New Zealand White</option>
                <option value="California White">California White</option>
                <option value="Rex">Rex</option>
                <option value="Dutch">Dutch</option>
                <option value="Flemish Giant">Flemish Giant</option>
              </select>
            </div>

            <div class="form-group">
              <label for="gender">Gender</label>
              <select id="gender" v-model="form.gender" class="form-control" required>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div class="form-group">
              <label for="dateOfBirth">Date of Birth</label>
              <input 
                type="date" 
                id="dateOfBirth" 
                v-model="form.dateOfBirth" 
                class="form-control"
                required
              >
            </div>

            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" v-model="form.status" class="form-control" required>
                <option value="">Select status</option>
                <option value="Active">Active</option>
                <option value="Breeding">Breeding</option>
                <option value="Growing">Growing</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>

          <!-- Physical Characteristics -->
          <div class="form-section">
            <h2>Physical Characteristics</h2>
            <div class="image-upload-section">
              <label class="image-upload-label">Rabbit Photo</label>
              <div class="image-upload-container">
                <div 
                  class="image-preview"
                  :class="{ 'has-image': imagePreview }"
                  @click="triggerImageUpload"
                >
                  <img 
                    v-if="imagePreview" 
                    :src="imagePreview" 
                    alt="Rabbit preview"
                    class="preview-image"
                  >
                  <div v-else class="upload-placeholder">
                    <i class="pi pi-camera"></i>
                    <span>Click to upload photo</span>
                  </div>
                </div>
                <input 
                  type="file"
                  ref="imageInput"
                  accept="image/*"
                  class="hidden-input"
                  @change="handleImageUpload"
                >
                <button 
                  v-if="imagePreview"
                  type="button"
                  class="remove-image-btn"
                  @click.stop="removeImage"
                >
                  <i class="pi pi-trash"></i>
                  Remove photo
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="weight">Weight (kg)</label>
              <input 
                type="number" 
                id="weight" 
                v-model="form.weight" 
                class="form-control"
                step="0.1"
                min="0"
                required
              >
            </div>

            <div class="form-group">
              <label for="color">Color</label>
              <input 
                type="text" 
                id="color" 
                v-model="form.color" 
                class="form-control"
                placeholder="Enter color"
                required
              >
            </div>

            <div class="form-group">
              <label for="distinguishingMarks">Distinguishing Marks</label>
              <textarea 
                id="distinguishingMarks" 
                v-model="form.distinguishingMarks" 
                class="form-control"
                rows="3"
                placeholder="Any special markings or characteristics"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Additional Information -->
        <div class="form-section">
          <h2>Additional Information</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="cage">Cage Number</label>
              <input 
                type="text" 
                id="cage" 
                v-model="form.cage" 
                class="form-control"
                placeholder="Enter cage number"
                required
              >
            </div>

            <div class="form-group">
              <label for="diet">Special Diet Requirements</label>
              <input 
                type="text" 
                id="diet" 
                v-model="form.diet" 
                class="form-control"
                placeholder="Enter special diet if any"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea 
              id="notes" 
              v-model="form.notes" 
              class="form-control"
              rows="4"
              placeholder="Any additional notes or observations"
            ></textarea>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
//import { useStore } from 'vuex'
import { supabase } from '@/supabase'

export default {
  name: 'RabbitForm',
  setup() {
    const route = useRoute()
    const router = useRouter()
    //const store = useStore()
    const isEditing = ref(false)
    const imageInput = ref(null)
    const imagePreview = ref(null)
    const isLoading = ref(false)
    const errorMessage = ref('')

    const form = ref({
      rabbitId: '',
      name: '',
      breed: '',
      gender: '',
      dateOfBirth: '',
      status: '',
      weight: '',
      color: '',
      distinguishingMarks: '',
      cage: '',
      diet: '',
      notes: '',
      image: null
    })

    const generateRabbitId = async () => {
      // Get the count of existing rabbits to generate the next ID
      const { count } = await supabase
        .from('rabbits')
        .select('*', { count: 'exact' })
      
      const nextNumber = (count || 0) + 1
      return `R-${String(nextNumber).padStart(3, '0')}`
    }

    const uploadImage = async (file) => {
      if (!file) return null

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `rabbit-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('rabbits')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('rabbits')
        .getPublicUrl(filePath)

      return data.publicUrl
    }

    const handleSubmit = async () => {
      try {
        isLoading.value = true
        errorMessage.value = ''

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('User not authenticated')
        }

        // Upload image if exists
        let imageUrl = null
        if (form.value.image) {
          imageUrl = await uploadImage(form.value.image)
        }

        // Generate rabbit ID for new rabbits
        const rabbitId = isEditing.value ? form.value.rabbitId : await generateRabbitId()

        // Prepare rabbit data
        const rabbitData = {
          rabbit_id: rabbitId,
          name: form.value.name,
          breed: form.value.breed,
          gender: form.value.gender,
          date_of_birth: form.value.dateOfBirth,
          status: form.value.status,
          weight: parseFloat(form.value.weight),
          color: form.value.color,
          distinguishing_marks: form.value.distinguishingMarks,
          cage_number: form.value.cage,
          diet: form.value.diet,
          notes: form.value.notes,
          image_url: imageUrl,
          created_by: user.id
        }

        console.log(rabbitData) ;

        if (isEditing.value) {
          // Update existing rabbit
          const { error: updateError } = await supabase
            .from('rabbits')
            .update(rabbitData)
            .eq('id', route.params.id)

          if (updateError) throw updateError
        } else {
          // Insert new rabbit
          const { error: insertError } = await supabase
            .from('rabbits')
            .insert([rabbitData])

          if (insertError) throw insertError
        }

        // Redirect to rabbits list
        router.push('/rabbits')
      } catch (error) {
        console.error('Error:', error)
        errorMessage.value = error.message
      } finally {
        isLoading.value = false
      }
    }

    const triggerImageUpload = () => {
      imageInput.value.click()
    }

    const handleImageUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        form.value.image = file
        const reader = new FileReader()
        reader.onload = (e) => {
          imagePreview.value = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    const removeImage = () => {
      form.value.image = null
      imagePreview.value = null
      imageInput.value.value = ''
    }

    onMounted(async () => {
      // Check if we're editing an existing rabbit
      if (route.params.id) {
        isEditing.value = true
        
        // Fetch rabbit data
        const { data: rabbit, error } = await supabase
          .from('rabbits')
          .select('*')
          .eq('id', route.params.id)
          .single()

        if (error) {
          console.error('Error fetching rabbit:', error)
          return
        }

        // Populate form with rabbit data
        form.value = {
          rabbitId: rabbit.rabbit_id,
          name: rabbit.name,
          breed: rabbit.breed,
          gender: rabbit.gender,
          dateOfBirth: rabbit.date_of_birth,
          status: rabbit.status,
          weight: rabbit.weight.toString(),
          color: rabbit.color,
          distinguishingMarks: rabbit.distinguishing_marks,
          cage: rabbit.cage_number,
          diet: rabbit.diet,
          notes: rabbit.notes,
          image: null
        }

        if (rabbit.image_url) {
          imagePreview.value = rabbit.image_url
        }
      }
    })

    return {
      isEditing,
      form,
      handleSubmit,
      imageInput,
      imagePreview,
      triggerImageUpload,
      handleImageUpload,
      removeImage,
      isLoading,
      errorMessage
    }
  }
}
</script>

<style scoped>
.rabbit-form-page {
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

.content-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.rabbit-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
  margin: 0;
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
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-control:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

.image-upload-section {
  margin-bottom: 1.5rem;
}

.image-upload-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  display: block;
}

.image-upload-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.image-preview {
  width: 100%;
  height: 200px;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.image-preview:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.image-preview.has-image {
  border-style: solid;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
}

.upload-placeholder i {
  font-size: 2rem;
}

.hidden-input {
  display: none;
}

.remove-image-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.remove-image-btn:hover {
  background: #fecaca;
}

.error-message {
  background: #fee2e2;
  color: #ef4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.primary-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style> 