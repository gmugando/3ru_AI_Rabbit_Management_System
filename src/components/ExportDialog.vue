<template>
  <div v-if="show" class="export-dialog-overlay" @click="closeDialog">
    <div class="export-dialog" @click.stop>
      <div class="dialog-header">
        <h3>Export Data</h3>
        <button class="close-btn" @click="closeDialog">
          <i class="pi pi-times"></i>
        </button>
      </div>
      
      <div class="dialog-content">
        <p>Select export format:</p>
        
        <div class="format-options">
          <label class="format-option" :class="{ selected: selectedFormat === 'csv' }">
            <input 
              type="radio" 
              name="format" 
              value="csv" 
              v-model="selectedFormat"
            >
            <div class="format-info">
              <i class="pi pi-file"></i>
              <div>
                <strong>CSV</strong>
                <span>Comma-separated values, compatible with Excel</span>
              </div>
            </div>
          </label>
          
          <label class="format-option" :class="{ selected: selectedFormat === 'excel' }">
            <input 
              type="radio" 
              name="format" 
              value="excel" 
              v-model="selectedFormat"
            >
            <div class="format-info">
              <i class="pi pi-file-excel"></i>
              <div>
                <strong>Excel</strong>
                <span>Native Excel format (.xlsx)</span>
              </div>
            </div>
          </label>
          
          <label class="format-option" :class="{ selected: selectedFormat === 'pdf' }">
            <input 
              type="radio" 
              name="format" 
              value="pdf" 
              v-model="selectedFormat"
            >
            <div class="format-info">
              <i class="pi pi-file-pdf"></i>
              <div>
                <strong>PDF</strong>
                <span>Portable Document Format</span>
              </div>
            </div>
          </label>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button class="btn btn-secondary" @click="closeDialog">Cancel</button>
        <button 
          class="btn btn-primary" 
          @click="confirmExport"
          :disabled="!selectedFormat"
        >
          Export
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'ExportDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    defaultFormat: {
      type: String,
      default: 'csv'
    }
  },
  emits: ['confirm', 'close'],
  setup(props, { emit }) {
    const selectedFormat = ref(props.defaultFormat)

    watch(() => props.show, (newShow) => {
      if (newShow) {
        selectedFormat.value = props.defaultFormat
      }
    })

    const closeDialog = () => {
      emit('close')
    }

    const confirmExport = () => {
      if (selectedFormat.value) {
        emit('confirm', selectedFormat.value)
      }
    }

    return {
      selectedFormat,
      closeDialog,
      confirmExport
    }
  }
}
</script>

<style scoped>
.export-dialog-overlay {
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

.export-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #4a5568;
}

.dialog-content {
  padding: 1.5rem;
}

.dialog-content p {
  margin: 0 0 1rem 0;
  color: #4a5568;
  font-weight: 500;
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.format-option {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.format-option:hover {
  border-color: #4299e1;
  background: #f7fafc;
}

.format-option.selected {
  border-color: #4299e1;
  background: #ebf8ff;
}

.format-option input[type="radio"] {
  margin-right: 1rem;
  transform: scale(1.2);
}

.format-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.format-info i {
  font-size: 1.5rem;
  color: #4299e1;
  width: 24px;
  text-align: center;
}

.format-info div {
  display: flex;
  flex-direction: column;
}

.format-info strong {
  color: #2d3748;
  font-size: 1rem;
}

.format-info span {
  color: #718096;
  font-size: 0.875rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #4299e1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3182ce;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #718096;
  color: white;
}

.btn-secondary:hover {
  background: #4a5568;
}

@media (max-width: 768px) {
  .export-dialog {
    width: 95%;
    margin: 1rem;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
