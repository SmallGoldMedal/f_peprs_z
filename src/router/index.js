import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
    {
        path: '/',
        name: 'Guidance',
        component: () => import('@/views/Guidance.vue')
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/admin',
        name: 'Admin',
        component: () => import('@/views/Admin.vue'),
        meta: { requiresAdmin: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    if (to.meta.requiresAdmin && (!userStore.isAuthenticated || !userStore.isAdmin)) {
        next('/')
    } else if (to.meta.requiresAuth && !userStore.isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router