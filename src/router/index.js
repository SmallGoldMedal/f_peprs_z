import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import axios from 'axios'   // 使用原生 axios 避免拦截器循环

const routes = [
    {
        path: '/',
        name: 'Login',
        component: () => import('@/views/AuthPage.vue')
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/UserPage.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/admin',
        name: 'Admin',
        component: () => import('@/views/AdminPage.vue'),
        meta: { requiresAdmin: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 封装 token 校验函数（使用独立 axios 实例，避免拦截器影响）
async function checkTokenValidity() {
    const token = localStorage.getItem('token')
    if (!token) return false
    try {
        // 创建独立请求实例，不经过全局拦截器（防止循环）
        const response = await axios.get('/auth/check-token', {
            headers: { Authorization: `Bearer ${token}` },
            baseURL: ''  // 使用相对路径，由 vite proxy 代理
        })
        return response.data.code === 200 && response.data.data === true
    } catch (error) {
        // 请求失败（如 401 或网络错误）视为无效
        return false
    }
}

router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()

    // 如果需要认证或管理员权限，先验证 token 有效性
    if (to.meta.requiresAuth || to.meta.requiresAdmin) {
        const isValid = await checkTokenValidity()
        if (!isValid) {
            // token 无效，清除本地存储和 store 状态
            localStorage.removeItem('token')
            localStorage.removeItem('username')
            localStorage.removeItem('userId')
            localStorage.removeItem('role')
            localStorage.removeItem('currentMenu')
            userStore.clearAuth()
            // 跳转到登录页，并携带原目标路径（可选）
            next('/')
            return
        }
    }

    // 原有权限判断
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