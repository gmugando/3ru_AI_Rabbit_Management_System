import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/supabase'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/landing/LandingPage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/AppLogin.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/AppRegister.vue')
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPassword.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/AppDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/farm-chat',
    name: 'FarmChat',
    component: () => import('@/views/ai/FarmChat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rabbits',
    name: 'Rabbits',
    component: () => import('@/views/rabbits/RabbitList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rabbits/add',
    name: 'AddRabbit',
    component: () => import('@/views/rabbits/RabbitForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rabbits/:id/edit',
    name: 'EditRabbit',
    component: () => import('@/views/rabbits/RabbitForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/breeding',
    name: 'Breeding',
    component: () => import('@/views/breeding/BreedingList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/breeding/add',
    name: 'AddBreeding',
    component: () => import('@/views/breeding/BreedingForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/breeding/:id/edit',
    name: 'EditBreeding',
    component: () => import('@/views/breeding/BreedingForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/feeding',
    name: 'Feeding',
    component: () => import('@/views/feeding/FeedingManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/feeding/schedule',
    name: 'FeedingSchedule',
    component: () => import('@/views/feeding/FeedingScheduleForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/feeding/add-record',
    name: 'AddFeedRecord',
    component: () => import('@/views/feeding/FeedRecordForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/weight-tracking',
    name: 'WeightTracking',
    component: () => import('@/views/weight/WeightTracking.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/health-data',
    name: 'HealthData',
    component: () => import('@/views/health/HealthDataManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/finance',
    name: 'Finance',
    component: () => import('@/views/finance/AppFinance.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/finance/add-transaction',
    name: 'AddTransaction',
    component: () => import('@/views/finance/TransactionForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/finance/transactions',
    name: 'TransactionList',
    component: () => import('@/views/finance/TransactionList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/views/schedule/AppSchedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/reports/AppReports.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/users/UserManagement.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'TENANT_ADMIN'] }
  },
  {
    path: '/tenants',
    name: 'Tenants',
    component: () => import('@/views/tenants/TenantManagement.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN'] }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/AppSettings.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !session) {
    next('/login')
  } else if (to.path === '/login' && session) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router 