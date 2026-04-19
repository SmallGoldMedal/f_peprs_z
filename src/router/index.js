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
        meta: { requiresAuth: true }
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
    if (to.meta.requiresAdmin) {
        if (!userStore.isAuthenticated || !userStore.isAdmin) {
            next('/')
        } else {
            next()
        }
    } else if (to.meta.requiresAuth) {
        if (!userStore.isAuthenticated) {
            next('/')
        } else {
            next()
        }
    } else {
        next()
    }
})

export default router