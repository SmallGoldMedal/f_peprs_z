import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/utils/request'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('token') || '')
    const username = ref(localStorage.getItem('username') || '')
    const userId = ref(parseInt(localStorage.getItem('userId') || '0'))
    const role = ref(localStorage.getItem('role') || '')   // 'USER' 或 'ADMIN'
    const currentMenu = ref(localStorage.getItem('currentMenu') || 'home')

    const isAuthenticated = computed(() => !!token.value)
    const isAdmin = computed(() => role.value === 'ADMIN')
    const displayName = computed(() => username.value)

    function saveToLocalStorage() {
        if (token.value) localStorage.setItem('token', token.value)
        else localStorage.removeItem('token')
        if (username.value) localStorage.setItem('username', username.value)
        else localStorage.removeItem('username')
        localStorage.setItem('userId', userId.value.toString())
        if (role.value) localStorage.setItem('role', role.value)
        else localStorage.removeItem('role')
        if (currentMenu.value) localStorage.setItem('currentMenu', currentMenu.value)
        else localStorage.removeItem('currentMenu')
    }

    function setAuth(data) {
        token.value = data.token
        username.value = data.username || ''
        userId.value = data.userId || 0
        role.value = data.role || 'USER'
        saveToLocalStorage()
    }

    function clearAuth() {
        token.value = ''
        username.value = ''
        userId.value = 0
        role.value = ''
        currentMenu.value = 'home'
        saveToLocalStorage()
    }

    function setCurrentMenu(menu) {
        currentMenu.value = menu
        saveToLocalStorage()
    }

    async function login(usernameVal, passwordVal) {
        const res = await axios.post('/auth/login', { username: usernameVal, password: passwordVal })
        if (res.data.code === 200) {
            const data = res.data.data
            setAuth({
                token: data.token,
                username: data.username,
                userId: data.userId,
                role: data.role
            })
            // 登录成功后恢复页面状态
            const redirectPath = sessionStorage.getItem('redirectPath')
            const redirectQuery = sessionStorage.getItem('redirectQuery')
            if (redirectPath) {
                sessionStorage.removeItem('redirectPath')
                sessionStorage.removeItem('redirectQuery')
                // 如果有保存的查询参数，合并到跳转路径中
                if (redirectQuery && redirectQuery !== 'null') {
                    const queryObj = JSON.parse(redirectQuery)
                    return { redirect: redirectPath, query: queryObj }
                }
                return { redirect: redirectPath }
            }
            return { redirect: '/home' }
        }
        throw new Error(res.data.message || '登录失败')
    }

    async function register(usernameVal, passwordVal) {
        const res = await axios.post('/auth/register', { username: usernameVal, password: passwordVal })
        if (res.data.code === 200) {
            // 注册成功后自动登录
            return await login(usernameVal, passwordVal)
        }
        throw new Error(res.data.message || '注册失败')
    }

    async function logout() {
        clearAuth()
        await router.push('/')
    }

    return {
        token,
        username,
        userId,
        role,
        currentMenu,
        isAuthenticated,
        isAdmin,
        displayName,
        setAuth,
        clearAuth,
        setCurrentMenu,
        login,
        register,
        logout
    }
})