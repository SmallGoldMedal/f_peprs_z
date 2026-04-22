// 文件位置：src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'

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

// 获取用户角色（从 localStorage）
const getUserRole = () => {
    const role = localStorage.getItem('role')
    return role === 'ADMIN' ? 'ADMIN' : 'USER'
}

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')

    // 需要登录的页面
    if (to.meta.requiresAuth) {
        if (!token) {
            next('/')
        } else {
            next()
        }
    }
    // 需要管理员权限的页面
    else if (to.meta.requiresAdmin) {
        if (!token) {
            next('/')
        } else if (getUserRole() === 'ADMIN') {
            next()
        } else {
            next('/home')
        }
    }
    else {
        // 登录页：如果已登录则跳转首页
        if (token && to.path === '/') {
            next('/home')
        } else {
            next()
        }
    }
})

export default router