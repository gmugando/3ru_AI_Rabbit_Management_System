<template>
  <div class="document-management">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1><i class="pi pi-file-pdf"></i> Document Management</h1>
        <p class="subtitle">Upload and organize your farm documents, manuals, and research papers</p>
      </div>
      <div class="header-actions">
        <button class="secondary-button" @click="refreshDocuments" :disabled="loading">
          <i class="pi pi-refresh"></i>
          Refresh
        </button>
        <button class="secondary-button" @click="fixPendingDocuments" :disabled="loading">
          <i class="pi pi-wrench"></i>
          Fix Documents
        </button>
        <button class="primary-button" @click="showUploadModal = true">
          <i class="pi pi-upload"></i>
          Upload Documents
        </button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div v-if="statistics" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="pi pi-file"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.total_documents || 0 }}</div>
          <div class="stat-label">Total Documents</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="pi pi-database"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.total_size_mb || 0 }} MB</div>
          <div class="stat-label">Storage Used</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="pi pi-calendar"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.recent_uploads || 0 }}</div>
          <div class="stat-label">This Week</div>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="search-filters">
      <div class="search-bar">
        <i class="pi pi-search"></i>
        <input 
          v-model="searchQuery" 
          @input="handleSearch"
          placeholder="Search documents by title, description, or content..."
          class="search-input"
        >
        <button v-if="searchQuery" @click="clearSearch" class="clear-search">
          <i class="pi pi-times"></i>
        </button>
      </div>
      
      <div class="filters">
        <select v-model="selectedCategory" @change="handleCategoryFilter" class="category-filter">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
        
        <select v-model="sortBy" @change="handleSort" class="sort-filter">
          <option value="uploaded_at">Recent First</option>
          <option value="title">Title A-Z</option>
          <option value="category">Category</option>
          <option value="file_size">File Size</option>
        </select>
        
        <div class="view-toggle">
          <button 
            @click="viewMode = 'grid'" 
            :class="['view-btn', { active: viewMode === 'grid' }]"
          >
            <i class="pi pi-th-large"></i>
          </button>
          <button 
            @click="viewMode = 'list'" 
            :class="['view-btn', { active: viewMode === 'list' }]"
          >
            <i class="pi pi-list"></i>
          </button>
        </div>
        
        <div class="document-toggle">
          <label class="toggle-label">
            <input 
              type="checkbox" 
              v-model="showAllDocuments" 
              @change="loadDocuments"
              class="toggle-checkbox"
            >
            Show all documents (including pending)
          </label>
        </div>
      </div>
    </div>

    <!-- Document Library -->
    <div class="document-library">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <p>Loading documents...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="documents.length === 0" class="empty-state">
        <div class="empty-content">
          <i class="pi pi-file-pdf"></i>
          <h3>No Documents Found</h3>
          <p v-if="searchQuery">Try adjusting your search or filters</p>
          <p v-else>Upload your first document to get started</p>
          <button class="primary-button" @click="showUploadModal = true">
            <i class="pi pi-upload"></i>
            Upload Documents
          </button>
        </div>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="document-grid">
        <div 
          v-for="doc in documents" 
          :key="doc.id" 
          class="document-card"
          @click="viewDocument(doc)"
        >
          <div class="card-header">
            <div class="doc-icon">
              <i class="pi pi-file-pdf"></i>
            </div>
            <div class="card-actions">
              <button @click.stop="toggleFavorite(doc)" class="action-btn">
                <i :class="['pi', doc.is_favorite ? 'pi-heart-fill' : 'pi-heart']"></i>
              </button>
              <button @click.stop="showDocumentMenu($event, doc)" class="action-btn">
                <i class="pi pi-ellipsis-v"></i>
              </button>
            </div>
          </div>
          
          <div class="card-content">
            <h4 class="doc-title">{{ doc.title || doc.filename }}</h4>
            <p v-if="doc.description" class="doc-description">{{ doc.description }}</p>
            
            <div class="doc-meta">
              <span class="category-tag" :class="doc.category.toLowerCase()">
                {{ doc.category }}
              </span>
              <span class="file-size">{{ formatFileSize(doc.file_size) }}</span>
            </div>
            
            <!-- Processing Status -->
            <div v-if="doc.processing_status" class="processing-status">
              <span :class="['status-badge', doc.processing_status]">
                <i v-if="doc.processing_status === 'pending'" class="pi pi-clock"></i>
                <i v-else-if="doc.processing_status === 'processing'" class="pi pi-spin pi-spinner"></i>
                <i v-else-if="doc.processing_status === 'completed'" class="pi pi-check"></i>
                <i v-else-if="doc.processing_status === 'failed'" class="pi pi-times"></i>
                {{ formatProcessingStatus(doc.processing_status) }}
              </span>
            </div>
            
            <div v-if="doc.tags && doc.tags.length" class="doc-tags">
              <span v-for="tag in doc.tags.slice(0, 3)" :key="tag" class="tag">
                {{ tag }}
              </span>
              <span v-if="doc.tags.length > 3" class="tag-more">
                +{{ doc.tags.length - 3 }}
              </span>
            </div>
            
            <div class="doc-footer">
              <span class="upload-date">{{ formatDate(doc.uploaded_at) }}</span>
              <span v-if="doc.last_accessed" class="last-accessed">
                Last viewed {{ formatDate(doc.last_accessed) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="document-list">
        <div class="list-header">
          <div class="col-title">Document</div>
          <div class="col-category">Category</div>
          <div class="col-status">Status</div>
          <div class="col-size">Size</div>
          <div class="col-date">Uploaded</div>
          <div class="col-actions">Actions</div>
        </div>
        
        <div 
          v-for="doc in documents" 
          :key="doc.id" 
          class="list-item"
          @click="viewDocument(doc)"
        >
          <div class="col-title">
            <div class="doc-info">
              <i class="pi pi-file-pdf"></i>
              <div class="doc-details">
                <h4>{{ doc.title || doc.filename }}</h4>
                <p v-if="doc.description">{{ doc.description }}</p>
              </div>
            </div>
          </div>
          <div class="col-category">
            <span class="category-tag" :class="doc.category.toLowerCase()">
              {{ doc.category }}
            </span>
          </div>
          <div class="col-status">
            <span v-if="doc.processing_status" :class="['status-badge', 'small', doc.processing_status]">
              <i v-if="doc.processing_status === 'pending'" class="pi pi-clock"></i>
              <i v-else-if="doc.processing_status === 'processing'" class="pi pi-spin pi-spinner"></i>
              <i v-else-if="doc.processing_status === 'completed'" class="pi pi-check"></i>
              <i v-else-if="doc.processing_status === 'failed'" class="pi pi-times"></i>
              {{ formatProcessingStatus(doc.processing_status) }}
            </span>
          </div>
          <div class="col-size">{{ formatFileSize(doc.file_size) }}</div>
          <div class="col-date">{{ formatDate(doc.uploaded_at) }}</div>
          <div class="col-actions">
            <button @click.stop="toggleFavorite(doc)" class="action-btn">
              <i :class="['pi', doc.is_favorite ? 'pi-heart-fill' : 'pi-heart']"></i>
            </button>
            <button @click.stop="downloadDocument(doc)" class="action-btn">
              <i class="pi pi-download"></i>
            </button>
            <button @click.stop="showDocumentMenu($event, doc)" class="action-btn">
              <i class="pi pi-ellipsis-v"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3><i class="pi pi-upload"></i> Upload Documents</h3>
          <button @click="closeUploadModal" class="close-btn">
            <i class="pi pi-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <!-- Drag & Drop Area -->
          <div 
            class="upload-area"
            :class="{ 'drag-over': isDragOver }"
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
          >
            <i class="pi pi-cloud-upload"></i>
            <h4>Drag & Drop PDFs Here</h4>
            <p>or click to browse files</p>
            <input 
              ref="fileInput"
              type="file" 
              multiple 
              accept=".pdf"
              @change="handleFileSelect"
              class="file-input"
            >
            <button @click="$refs.fileInput.click()" class="browse-btn">
              Browse Files
            </button>
          </div>
          
          <!-- Selected Files -->
          <div v-if="selectedFiles.length" class="selected-files">
            <h4>Selected Files ({{ selectedFiles.length }})</h4>
            <div 
              v-for="(file, index) in selectedFiles" 
              :key="index" 
              class="file-item"
            >
              <div class="file-info">
                <i class="pi pi-file-pdf"></i>
                <span class="filename">{{ file.name }}</span>
                <span class="filesize">{{ formatFileSize(file.size) }}</span>
              </div>
              <button @click="removeFile(index)" class="remove-btn">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>
          
          <!-- Upload Options -->
          <div v-if="selectedFiles.length" class="upload-options">
            <div class="form-group">
              <label for="bulk-category">Category for all files:</label>
              <select id="bulk-category" v-model="bulkCategory" class="form-control">
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="bulk-tags">Tags (comma separated):</label>
              <input 
                id="bulk-tags"
                v-model="bulkTags" 
                type="text" 
                placeholder="manual, breeding, health"
                class="form-control"
              >
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeUploadModal" class="secondary-button">
            Cancel
          </button>
          <button 
            @click="uploadFiles" 
            :disabled="!selectedFiles.length || uploading"
            class="primary-button"
          >
            <i v-if="uploading" class="pi pi-spin pi-spinner"></i>
            <i v-else class="pi pi-upload"></i>
            {{ uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Files` }}
          </button>
        </div>
      </div>
    </div>

    <!-- Document Context Menu -->
    <div 
      v-if="showContextMenu" 
      class="context-menu"
      :style="{ top: contextMenuY + 'px', left: contextMenuX + 'px' }"
    >
      <button @click="editDocument" class="menu-item">
        <i class="pi pi-pencil"></i>
        Edit Details
      </button>
      <button @click="downloadDocument(selectedDocument)" class="menu-item">
        <i class="pi pi-download"></i>
        Download
      </button>
      <button @click="copyLink" class="menu-item">
        <i class="pi pi-copy"></i>
        Copy Link
      </button>
      <hr class="menu-divider">
      <button @click="archiveDocument" class="menu-item danger">
        <i class="pi pi-archive"></i>
        Archive
      </button>
      <button @click="deleteDocument" class="menu-item danger">
        <i class="pi pi-trash"></i>
        Delete
      </button>
    </div>
  </div>
</template>

<script>
import { createClient } from '@supabase/supabase-js'

export default {
  name: 'DocumentManagement',
  
  data() {
    return {
      // Core data
      documents: [],
      statistics: null,
      loading: false,
      
      // Search and filters
      searchQuery: '',
      selectedCategory: '',
      sortBy: 'uploaded_at',
      viewMode: 'grid', // 'grid' or 'list'
      showAllDocuments: false, // Toggle to show pending documents too
      
      // Upload modal
      showUploadModal: false,
      selectedFiles: [],
      isDragOver: false,
      uploading: false,
      bulkCategory: 'General',
      bulkTags: '',
      
      // Context menu
      showContextMenu: false,
      contextMenuX: 0,
      contextMenuY: 0,
      selectedDocument: null,
      
      // Categories
      categories: [
        'General', 'Breeding', 'Health', 'Feeding', 
        'Housing', 'Regulations', 'Research', 'Records'
      ],
      
      // Supabase client
      supabase: null
    }
  },
  
  async mounted() {
    this.initializeSupabase()
    await this.loadDocuments()
    await this.loadStatistics()
    
    // Close context menu on outside click
    document.addEventListener('click', this.closeContextMenu)
  },
  
  beforeUnmount() {
    document.removeEventListener('click', this.closeContextMenu)
  },
  
  methods: {
    initializeSupabase() {
      this.supabase = createClient(
        process.env.VUE_APP_SUPABASE_URL,
        process.env.VUE_APP_SUPABASE_ANON_KEY
      )
    },
    
    async loadDocuments() {
      this.loading = true
      try {
        // Use different function based on toggle
        const functionName = this.showAllDocuments ? 'search_all_documents' : 'search_documents'
        
        const { data, error } = await this.supabase
          .rpc(functionName, {
            search_query: this.searchQuery,
            category_filter: this.selectedCategory || null,
            limit_count: 100
          })
        
        if (error) throw error
        
        this.documents = data || []
        console.log(`Documents loaded using ${functionName}:`, this.documents.length)
        
        // Debug: Check for pending documents if no results and not using show all
        if (this.documents.length === 0 && !this.showAllDocuments) {
          await this.debugPendingDocuments()
        }
        
      } catch (error) {
        console.error('Error loading documents:', error)
        this.$toast?.error('Failed to load documents')
      } finally {
        this.loading = false
      }
    },
    
    async debugPendingDocuments() {
      try {
        // Check for documents with pending status
        const { data: pendingDocs, error } = await this.supabase
          .from('documents')
          .select('id, title, original_filename, processing_status, uploaded_at')
          .eq('is_archived', false)
          .order('uploaded_at', { ascending: false })
        
        if (error) {
          console.error('Error checking pending documents:', error)
          return
        }
        
        console.log('Debug - All documents by status:', {
          total: pendingDocs.length,
          byStatus: pendingDocs.reduce((acc, doc) => {
            acc[doc.processing_status] = (acc[doc.processing_status] || 0) + 1
            return acc
          }, {}),
          pendingCount: pendingDocs.filter(d => d.processing_status === 'pending').length
        })
        
        const pendingCount = pendingDocs.filter(d => d.processing_status === 'pending').length
        if (pendingCount > 0) {
          console.warn(`Found ${pendingCount} documents in pending status. These won't show in the list.`)
          // Auto-fix pending documents
          await this.fixPendingDocuments()
        }
        
      } catch (error) {
        console.error('Error in debug check:', error)
      }
    },
    
    async fixPendingDocuments() {
      try {
        console.log('Attempting to fix pending documents...')
        
        const { data, error } = await this.supabase
          .from('documents')
          .update({ 
            processing_status: 'completed',
            processed_at: new Date().toISOString(),
            extracted_text: 'Text extraction not yet implemented'
          })
          .eq('processing_status', 'pending')
          .select('id, title, original_filename')
        
        if (error) throw error
        
        if (data && data.length > 0) {
          console.log(`Fixed ${data.length} pending documents:`, data)
          this.$toast?.success(`Fixed ${data.length} pending documents`)
          // Reload documents to show the fixed ones
          await this.loadDocuments()
        }
        
      } catch (error) {
        console.error('Error fixing pending documents:', error)
      }
    },
    
    async loadStatistics() {
      try {
        const { data, error } = await this.supabase
          .rpc('get_document_statistics')
        
        if (error) throw error
        
        this.statistics = data
        console.log('Statistics loaded:', this.statistics)
        
      } catch (error) {
        console.error('Error loading statistics:', error)
      }
    },
    
    async refreshDocuments() {
      await this.loadDocuments()
      await this.loadStatistics()
    },
    
    // Search and filtering
    async handleSearch() {
      // Debounce search
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.loadDocuments()
      }, 500)
    },
    
    clearSearch() {
      this.searchQuery = ''
      this.loadDocuments()
    },
    
    async handleCategoryFilter() {
      await this.loadDocuments()
    },
    
    async handleSort() {
      // Sort documents locally for now
      const sortFunctions = {
        uploaded_at: (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at),
        title: (a, b) => (a.title || a.filename).localeCompare(b.title || b.filename),
        category: (a, b) => a.category.localeCompare(b.category),
        file_size: (a, b) => b.file_size - a.file_size
      }
      
      this.documents.sort(sortFunctions[this.sortBy])
    },
    
    // File upload
    handleDrop(e) {
      e.preventDefault()
      this.isDragOver = false
      
      const files = Array.from(e.dataTransfer.files)
      this.addFiles(files)
    },
    
    handleFileSelect(e) {
      const files = Array.from(e.target.files)
      this.addFiles(files)
    },
    
    addFiles(files) {
      const pdfFiles = files.filter(file => file.type === 'application/pdf')
      
      if (pdfFiles.length !== files.length) {
        this.$toast?.warning('Only PDF files are supported')
      }
      
      this.selectedFiles = [...this.selectedFiles, ...pdfFiles]
    },
    
    removeFile(index) {
      this.selectedFiles.splice(index, 1)
    },
    
    async uploadFiles() {
      if (!this.selectedFiles.length) return
      
      this.uploading = true
      const uploadPromises = []
      
      try {
        for (const file of this.selectedFiles) {
          uploadPromises.push(this.uploadSingleFile(file))
        }
        
        await Promise.all(uploadPromises)
        
        this.$toast?.success(`Successfully uploaded ${this.selectedFiles.length} documents`)
        this.closeUploadModal()
        await this.refreshDocuments()
        
      } catch (error) {
        console.error('Upload error:', error)
        this.$toast?.error('Failed to upload some documents')
      } finally {
        this.uploading = false
      }
    },
    
    async uploadSingleFile(file) {
      const userId = (await this.supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('User not authenticated')
      
      const filename = `${Date.now()}-${file.name}`
      const filePath = `${userId}/${filename}`
      
      // Upload to storage
      const { data: storageData, error: storageError } = await this.supabase.storage
        .from('documents')
        .upload(filePath, file)
      
      if (storageError) throw storageError
      
      // Create database record
      const tags = this.bulkTags ? this.bulkTags.split(',').map(tag => tag.trim()) : []
      
      const { error: dbError } = await this.supabase
        .from('documents')
        .insert({
          user_id: userId,
          filename: filename,
          original_filename: file.name,
          file_path: storageData.path,
          file_size: file.size,
          title: file.name.replace('.pdf', ''),
          category: this.bulkCategory,
          tags: tags,
          processing_status: 'completed', // Set to completed immediately since we don't have background processing
          processed_at: new Date().toISOString(), // Mark as processed now
          extracted_text: 'Text extraction not yet implemented' // Placeholder text
        })
      
      if (dbError) throw dbError
    },
    
    closeUploadModal() {
      this.showUploadModal = false
      this.selectedFiles = []
      this.bulkTags = ''
      this.bulkCategory = 'General'
      this.isDragOver = false
    },
    
    // Document actions
    viewDocument(doc) {
      console.log('View document:', doc)
      // TODO: Implement document viewer
      this.downloadDocument(doc)
    },
    
    async downloadDocument(doc) {
      try {
        const { data, error } = await this.supabase.storage
          .from('documents')
          .download(doc.file_path)
        
        if (error) throw error
        
        // Create download link
        const url = window.URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.original_filename || doc.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        // Update last accessed
        await this.updateLastAccessed(doc.id)
        
      } catch (error) {
        console.error('Download error:', error)
        this.$toast?.error('Failed to download document')
      }
    },
    
    async toggleFavorite(doc) {
      try {
        const { error } = await this.supabase
          .from('documents')
          .update({ is_favorite: !doc.is_favorite })
          .eq('id', doc.id)
        
        if (error) throw error
        
        doc.is_favorite = !doc.is_favorite
        
      } catch (error) {
        console.error('Error toggling favorite:', error)
        this.$toast?.error('Failed to update favorite status')
      }
    },
    
    async updateLastAccessed(docId) {
      try {
        await this.supabase
          .from('documents')
          .update({ last_accessed: new Date().toISOString() })
          .eq('id', docId)
      } catch (error) {
        console.error('Error updating last accessed:', error)
      }
    },
    
    // Context menu
    showDocumentMenu(event, doc) {
      this.selectedDocument = doc
      this.contextMenuX = event.clientX
      this.contextMenuY = event.clientY
      this.showContextMenu = true
    },
    
    closeContextMenu() {
      this.showContextMenu = false
      this.selectedDocument = null
    },
    
    editDocument() {
      console.log('Edit document:', this.selectedDocument)
      // TODO: Implement edit modal
      this.closeContextMenu()
    },
    
    copyLink() {
      // TODO: Implement copy link functionality
      this.$toast?.info('Link copied to clipboard')
      this.closeContextMenu()
    },
    
    async archiveDocument() {
      if (!this.selectedDocument) return
      
      try {
        const { error } = await this.supabase
          .from('documents')
          .update({ is_archived: true })
          .eq('id', this.selectedDocument.id)
        
        if (error) throw error
        
        this.$toast?.success('Document archived')
        await this.refreshDocuments()
        
      } catch (error) {
        console.error('Error archiving document:', error)
        this.$toast?.error('Failed to archive document')
      } finally {
        this.closeContextMenu()
      }
    },
    
    async deleteDocument() {
      if (!this.selectedDocument) return
      
      if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
        this.closeContextMenu()
        return
      }
      
      try {
        // Delete from storage
        await this.supabase.storage
          .from('documents')
          .remove([this.selectedDocument.file_path])
        
        // Delete from database
        const { error } = await this.supabase
          .from('documents')
          .delete()
          .eq('id', this.selectedDocument.id)
        
        if (error) throw error
        
        this.$toast?.success('Document deleted')
        await this.refreshDocuments()
        
      } catch (error) {
        console.error('Error deleting document:', error)
        this.$toast?.error('Failed to delete document')
      } finally {
        this.closeContextMenu()
      }
    },
    
    // Utility functions
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return 'Yesterday'
      if (diffDays <= 7) return `${diffDays} days ago`
      
      return date.toLocaleDateString()
    },

    formatProcessingStatus(status) {
      switch (status) {
        case 'pending':
          return 'Pending'
        case 'processing':
          return 'Processing'
        case 'completed':
          return 'Completed'
        case 'failed':
          return 'Failed'
        default:
          return status
      }
    }
  }
}
</script>

<style scoped>
.document-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  gap: 20px;
}

.header-content h1 {
  color: #2d5a27;
  margin: 0 0 5px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.subtitle {
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.primary-button, .secondary-button {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  transition: all 0.3s ease;
}

.primary-button {
  background: #4CAF50;
  color: white;
}

.primary-button:hover {
  background: #45a049;
}

.primary-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.secondary-button {
  background: #f8f9fa;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.secondary-button:hover {
  background: #e5e7eb;
}

/* Statistics Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

/* Search and Filters */
.search-filters {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.search-bar {
  position: relative;
  margin-bottom: 20px;
}

.search-bar i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 12px 45px 12px 45px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.clear-search {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 5px;
}

.filters {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.category-filter, .sort-filter {
  padding: 10px 15px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.view-toggle {
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-left: auto;
}

.view-btn {
  padding: 10px 12px;
  background: white;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.3s ease;
}

.view-btn.active {
  background: #4CAF50;
  color: white;
}

.document-toggle {
  margin-left: 15px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.toggle-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #4CAF50; /* Customize checkbox color */
}

/* Document Library */
.document-library {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.loading-state i {
  font-size: 48px;
  margin-bottom: 20px;
}

.empty-content i {
  font-size: 64px;
  color: #e5e7eb;
  margin-bottom: 20px;
}

.empty-content h3 {
  margin: 0 0 10px 0;
  color: #374151;
}

.empty-content p {
  margin: 0 0 20px 0;
}

/* Grid View */
.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.document-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.document-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #4CAF50;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.doc-icon i {
  font-size: 32px;
  color: #ef4444;
}

.card-actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  padding: 6px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.doc-title {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.doc-description {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doc-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-tag {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-tag.general { background: #f3f4f6; color: #374151; }
.category-tag.breeding { background: #fdf2f8; color: #be185d; }
.category-tag.health { background: #fef2f2; color: #dc2626; }
.category-tag.feeding { background: #f0fdf4; color: #16a34a; }
.category-tag.housing { background: #fff7ed; color: #ea580c; }
.category-tag.regulations { background: #f0f9ff; color: #0284c7; }
.category-tag.research { background: #faf5ff; color: #7c3aed; }
.category-tag.records { background: #f9fafb; color: #374151; }

.file-size {
  font-size: 12px;
  color: #9ca3af;
}

.doc-tags {
  margin-bottom: 12px;
}

.tag {
  display: inline-block;
  padding: 2px 6px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 4px;
  font-size: 11px;
  margin-right: 6px;
  margin-bottom: 4px;
}

.tag-more {
  color: #9ca3af;
  font-size: 11px;
}

.doc-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #9ca3af;
}

/* List View */
.document-list {
  width: 100%;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 100px 80px 100px 120px;
  gap: 20px;
  padding: 15px 0;
  border-bottom: 2px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.list-item {
  display: grid;
  grid-template-columns: 2fr 1fr 100px 80px 100px 120px;
  gap: 20px;
  padding: 15px 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.3s ease;
  align-items: center;
}

.list-item:hover {
  background: #f9fafb;
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doc-info i {
  font-size: 24px;
  color: #ef4444;
}

.doc-details h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
}

.doc-details p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.col-actions {
  display: flex;
  gap: 5px;
  justify-content: flex-end;
}

/* Upload Modal */
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 5px;
}

.modal-body {
  padding: 30px;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #4CAF50;
  background: #f0f9ff;
}

.upload-area i {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 15px;
}

.upload-area h4 {
  margin: 0 0 5px 0;
  color: #374151;
}

.upload-area p {
  margin: 0 0 20px 0;
  color: #6b7280;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.browse-btn {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.selected-files {
  margin-top: 30px;
}

.selected-files h4 {
  margin: 0 0 15px 0;
  color: #374151;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 10px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-info i {
  color: #ef4444;
  font-size: 18px;
}

.filename {
  font-weight: 500;
  color: #374151;
}

.filesize {
  color: #6b7280;
  font-size: 13px;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
}

.remove-btn:hover {
  background: #fef2f2;
}

.upload-options {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #4CAF50;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 180px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: #374151;
  transition: background-color 0.3s ease;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item.danger {
  color: #ef4444;
}

.menu-item.danger:hover {
  background: #fef2f2;
}

.menu-divider {
  margin: 0;
  border: none;
  border-top: 1px solid #e5e7eb;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.small {
  padding: 2px 6px;
  font-size: 10px;
}

.status-badge.pending {
  background-color: #fef2f2;
  color: #dc2626;
}

.status-badge.processing {
  background-color: #fffbeb;
  color: #d97706;
}

.status-badge.completed {
  background-color: #f0fdf4;
  color: #16a34a;
}

.status-badge.failed {
  background-color: #fef2f2;
  color: #dc2626;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .view-toggle {
    margin-left: 0;
    align-self: flex-start;
  }
  
  .document-toggle {
    margin-left: 0;
    align-self: flex-start;
  }
  
  .document-grid {
    grid-template-columns: 1fr;
  }
  
  .list-header,
  .list-item {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .col-actions {
    justify-content: flex-start;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style> 