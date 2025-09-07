<template>
  <div id="app">
    <template v-if="$route.path !== '/login' && $route.path !== '/register' && $route.path !== '/forgot-password' && $route.path !== '/'">
      <div class="layout-wrapper">
        <nav class="sidebar" :class="{ active: isSidebarOpen }">
          <div class="sidebar-header">
            <img src="@/assets/logo.png" alt="RMS Logo" class="logo">
            <button class="sidebar-close" @click="toggleSidebar">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="sidebar-menu">
            <div class="menu-section">
              <span class="menu-section-text">MAIN</span>
              <router-link to="/dashboard" class="menu-item" @click="closeSidebarOnMobile">
                <i class="pi pi-home"></i>
                <span>Dashboard</span>
              </router-link>
            </div>

            <div class="menu-section">
              <span class="menu-section-text">MANAGEMENT</span>
              <router-link to="/rabbits" class="menu-item" @click="closeSidebarOnMobile">
                <i class="mdi mdi-rabbit"></i>
                <span>Rabbits</span>
              </router-link>
              <router-link to="/breeding" class="menu-item" @click="closeSidebarOnMobile">
                <i class="pi pi-users"></i>
                <span>Breeding</span>
              </router-link>
              <router-link to="/feeding" class="menu-item" @click="closeSidebarOnMobile">
                <i class="mdi mdi-food-variant"></i>
                <span>Feeding</span>
              </router-link>
              <router-link to="/weight-tracking" class="menu-item" @click="closeSidebarOnMobile">
                <i class="pi pi-chart-line"></i>
                <span>Weight Tracking</span>
              </router-link>
            </div>

            <div class="menu-section">
              <span class="menu-section-text">HEALTH MANAGEMENT</span>
              <router-link to="/health-data" class="menu-item" @click="closeSidebarOnMobile">
                <i class="pi pi-shield"></i>
                <span>Health Data Management</span>
              </router-link>
            </div>

            <div class="menu-section">
              <span class="menu-section-text">AI Chat</span>
              <router-link to="/farm-chat" class="menu-item" @click="closeSidebarOnMobile">
                <i class="pi pi-comments"></i>
                <span>Talk To Your Farm</span>
              </router-link>
            </div>
            
            <div class="menu-section">
              <span class="menu-section-text">Documents</span>
              <router-link to="/documents" class="menu-item" @click="closeSidebarOnMobile">
                <i class="pi pi-file-pdf"></i>
                <span>Document Library</span>
              </router-link>
            </div>


            <div class="menu-section">
              <span class="menu-section-text">BUSINESS</span>
              <router-link to="/finance" class="menu-item" @click="closeSidebarOnMobile">
                <i class="pi pi-dollar"></i>
                <span>Finance</span>
              </router-link>
              <router-link to="/schedule" class="menu-item" @click="closeSidebarOnMobile">
                <i class="pi pi-calendar"></i>
                <span>Schedule</span>
              </router-link>
              <router-link to="/reports" class="menu-item" @click="closeSidebarOnMobile">
                <i class="pi pi-chart-bar"></i>
                <span>Reports</span>
              </router-link>
            </div>

            <div class="menu-section">
              <span class="menu-section-text">ADMINISTRATION</span>
              <template v-if="userRole === 'SUPER_ADMIN'">
                <router-link to="/tenants" class="menu-item" @click="closeSidebarOnMobile">
                  <i class="pi pi-building"></i>
                  <span>Tenants</span>
                </router-link>
              </template>
              <template v-if="userRole === 'TENANT_ADMIN' || userRole === 'SUPER_ADMIN'">
                <router-link to="/users" class="menu-item" @click="closeSidebarOnMobile">
                  <i class="pi pi-users"></i>
                  <span>Users</span>
                </router-link>
              </template>
              <router-link to="/settings" class="menu-item" @click="closeSidebarOnMobile">
                <i class="pi pi-cog"></i>
                <span>Settings</span>
              </router-link>
            </div>
          </div>
          
          <!-- Proudly South African Logo at bottom of sidebar -->
          <div class="proudly-sa-sidebar">
            <img src="@/assets/proudly-south-african-logo.png" alt="Proudly South African" class="proudly-sa-logo-sidebar">
          </div>
          
          <AppInfo class="sidebar-info" />
        </nav>
        <div class="main-content">
          <header class="topbar">
            <div class="topbar-left">
              <button class="menu-toggle" @click="toggleSidebar">
                <i class="pi pi-bars"></i>
              </button>
            </div>
            <div class="topbar-right">
              <div class="user-profile">
                <span>{{ userName }}</span>
                <button class="p-button-text" @click="logout">
                  <i class="pi pi-power-off"></i>
                </button>
              </div>
            </div>
          </header>
          <main class="content">
            <router-view></router-view>
          </main>
        </div>
        <!-- Overlay for mobile -->
        <div v-if="isSidebarOpen" class="sidebar-overlay active" @click="toggleSidebar"></div>
      </div>
    </template>
    <template v-else>
      <router-view></router-view>
    </template>
  </div>
</template>

<script>
import { ref, computed, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import AppInfo from '@/components/AppInfo.vue'

export default {
  name: 'App',
  components: {
    AppInfo
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const isSidebarOpen = ref(false)
    const isMobile = ref(false)

    const userRole = computed(() => store.state.user?.role)
    const userName = computed(() => store.state.user?.name)

    // Check if mobile on mount and resize
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }

    // Initialize mobile check
    checkMobile()

    // Add resize listener
    window.addEventListener('resize', checkMobile)

    // Cleanup on unmount
    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
    })

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value
    }

    const closeSidebarOnMobile = () => {
      // Only close sidebar on mobile devices
      if (isMobile.value) {
        isSidebarOpen.value = false
      }
    }

    const logout = async () => {
      try {
        // Sign out from Supabase
        await supabase.auth.signOut()
        
        // Clear application state
        store.commit('setUser', null)
        store.commit('setTenant', null)
        
        // Redirect to login page
        router.push('/login')
      } catch (error) {
        console.error('Error during logout:', error)
      }
    }

    return {
      userRole,
      userName,
      logout,
      isSidebarOpen,
      toggleSidebar,
      closeSidebarOnMobile
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.layout-wrapper {
  display: flex;
  min-height: 100vh;
  position: relative;
  background: #f5f5f5;
}

.sidebar {
  width: 280px;
  background: #1e293b;
  color: #ffffff;
  padding: 1rem;
  overflow-y: auto;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 1000;
  transition: transform 0.3s ease;
}

.sidebar-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
  margin-bottom: 2rem;
  position: relative;
}


.logo {
  width: 180px;
  height: 80px;
  flex-shrink: 0;
  background: white;
  border-radius: 8px;
  padding: 0.5rem;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-section {
  margin-bottom: 1.5rem;
}

.menu-section-text {
  display: block;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #cbd5e1;
  text-decoration: none;
  border-radius: 8px;
  gap: 0.75rem;
  transition: all 0.3s ease;
  margin-bottom: 0.25rem;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.menu-item.router-link-active {
  background: #3b82f6;
  color: #ffffff;
}

.menu-item i {
  font-size: 1.25rem;
  width: 1.5rem;
  text-align: center;
}

.menu-item span {
  white-space: nowrap;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 280px;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
  background: #f5f5f5;
}

.topbar {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  position: sticky;
  top: 0;
  z-index: 999;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.content {
  flex: 1;
  padding: 2rem;
  background: #f5f5f5;
}

.menu-toggle {
  display: none;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 1.25rem;
  transition: color 0.3s ease;
}

.menu-toggle:hover {
  color: #1e293b;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.sidebar-overlay.active {
  display: block;
}

.sidebar-close {
  display: none;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.25rem;
  transition: color 0.3s ease;
}

.sidebar-close:hover {
  color: #ffffff;
}

@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }

  .sidebar {
    transform: translateX(-100%);
    width: 280px;
  }

  .sidebar.active {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }

  .sidebar-overlay {
    display: none;
  }

  .sidebar-close {
    display: block;
  }

  .logo {
    width: 120px;
    height: 55px;
  }

  .proudly-sa-logo-sidebar {
    height: 35px;
  }
}

@media (min-width: 769px) {
  .sidebar {
    transform: none;
  }

  .main-content {
    margin-left: 280px;
  }

  .sidebar-overlay {
    display: none !important;
  }
}

/* Proudly South African Logo in Sidebar */
.proudly-sa-sidebar {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  margin-top: auto;
}

.proudly-sa-logo-sidebar {
  height: 50px;
  width: auto;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  transition: transform 0.3s ease;
}

.proudly-sa-logo-sidebar:hover {
  transform: scale(1.05);
}

.sidebar-info {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-info :deep(.app-info) {
  color: rgba(255, 255, 255, 0.6);
}

.sidebar-info :deep(.version) {
  font-size: 0.75rem;
}

.sidebar-info :deep(.copyright) {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>
