<template>
  <div class="app-info">
    <p class="version">Version {{ version }}</p>
    <p class="copyright">© {{ currentYear }} 3RU Rabbit Management System</p>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'AppInfo',
  setup() {
    const version = '1.0.0'
    const currentYear = computed(() => new Date().getFullYear())

    return {
      version,
      currentYear
    }
  }
}
</script>

<style scoped>
.app-info {
  text-align: center;
  padding: 1rem;
  color: #64748b;
  font-size: 0.875rem;
  margin-top: auto;
}

.version {
  margin: 0;
  opacity: 0.8;
}

.copyright {
  margin: 0.25rem 0 0;
  opacity: 0.6;
}
</style> 