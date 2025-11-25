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
    component: () => import('@/views/feeding/FeedingScheduleList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/feeding/schedule/add',
    name: 'AddFeedingSchedule',
    component: () => import('@/views/feeding/FeedingScheduleForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/feeding/schedule/:id/edit',
    name: 'EditFeedingSchedule',
    component: () => import('@/views/feeding/FeedingScheduleForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/feeding/dashboard',
    name: 'FeedingScheduleDashboard',
    component: () => import('@/views/feeding/FeedingScheduleDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/feeding/add-record',
    name: 'AddFeedRecord',
    component: () => import('@/views/feeding/FeedRecordForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/feeding/records',
    name: 'FeedRecordList',
    component: () => import('@/views/feeding/FeedRecordList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/feeding/record/:id/edit',
    name: 'EditFeedRecord',
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
    path: '/weight-tracking/add',
    name: 'AddWeightRecord',
    component: () => import('@/views/weight/WeightRecordForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/weight-tracking/records',
    name: 'WeightRecordsList',
    component: () => import('@/views/weight/WeightRecordsList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/health-data',
    name: 'HealthData',
    component: () => import('@/views/health/HealthDataManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/health-data/add',
    name: 'AddHealthRecord',
    component: () => import('@/views/health/HealthRecordForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/health-data/records',
    name: 'HealthRecordsList',
    component: () => import('@/views/health/HealthRecordsList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/health-data/edit/:id',
    name: 'EditHealthRecord',
    component: () => import('@/views/health/HealthRecordForm.vue'),
    meta: { requiresAuth: true },
    props: true
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
    path: '/finance/reports',
    name: 'FinancialReports',
    component: () => import('@/views/finance/FinancialReports.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('@/views/schedule/AppSchedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule/add',
    name: 'AddScheduleEvent',
    component: () => import('@/views/schedule/ScheduleEventForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule/edit/:id',
    name: 'EditScheduleEvent',
    component: () => import('@/views/schedule/ScheduleEventForm.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/schedule/events',
    name: 'ScheduleEventsList',
    component: () => import('@/views/schedule/ScheduleEventsList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/reports/AppReports.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reports/schedules',
    name: 'ReportSchedules',
    component: () => import('@/views/reports/ReportSchedules.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reports/schedules/add',
    name: 'AddReportSchedule',
    component: () => import('@/views/reports/ReportScheduleForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reports/schedules/:id/edit',
    name: 'EditReportSchedule',
    component: () => import('@/views/reports/ReportScheduleForm.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/users/UserManagement.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN', 'TENANT_ADMIN'] }
  },
  {
    path: '/users-overview',
    name: 'UsersOverview',
    component: () => import('@/views/users/UsersOverview.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN'] }
  },
  {
    path: '/pricing-management',
    name: 'PricingManagement',
    component: () => import('@/views/pricing/PricingManagement.vue'),
    meta: { requiresAuth: true, roles: ['SUPER_ADMIN'] }
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
  },
  {
    path: '/preferences',
    name: 'Preferences',
    component: () => import('@/views/settings/AppPreferences.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('@/views/documents/DocumentManagement.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Import store to restore user on page refresh
import store from '@/store'

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // If there's a session but no user in store, restore the user
  if (session && !store.state.user) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get user profile and role from profiles table
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            organization,
            role_id,
            roles (
              name
            )
          `)
          .eq('user_id', user.id)
          .limit(1)

        if (!profileError && profiles && profiles.length > 0) {
          const profile = profiles[0]
          // Restore user to store
          store.commit('setUser', {
            id: user.id,
            email: user.email,
            name: `${profile.first_name} ${profile.last_name}`,
            role: profile.roles?.name || 'USER',
            organization: profile.organization
          })
        }
      }
    } catch (error) {
      console.error('Error restoring user session:', error)
    }
  }

  if (requiresAuth && !session) {
    next('/login')
  } else if (to.path === '/login' && session) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router 