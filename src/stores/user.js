import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/utils/request'

export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('token') || '')
    const username = ref(localStorage.getItem('username') || '')
    const nickname = ref(localStorage.getItem('nickname') || '')
    const isGuest = ref(localStorage.getItem('isGuest') === 'true')
    const userId = ref(parseInt(localStorage.getItem('userId') || '0'))
    const role = ref(localStorage.getItem('role') || '')
    const currentMenu = ref(localStorage.getItem('currentMenu') || 'home')

    const isAuthenticated = computed(() => !!token.value)
    const isAdmin = computed(() => role.value === 'ADMIN')
    const displayName = computed(() => {
        if (isGuest.value) return '游客'
        if (nickname.value) return nickname.value
        return username.value
    })

    function saveToLocalStorage() {
        if (token.value) localStorage.setItem('token', token.value)
        else localStorage.removeItem('token')
        if (username.value) localStorage.setItem('username', username.value)
        else localStorage.removeItem('username')
        if (nickname.value) localStorage.setItem('nickname', nickname.value)
        else localStorage.removeItem('nickname')
        localStorage.setItem('isGuest', isGuest.value ? 'true' : 'false')
        localStorage.setItem('userId', userId.value.toString())
        if (role.value) localStorage.setItem('role', role.value)
        else localStorage.removeItem('role')
        if (currentMenu.value) localStorage.setItem('currentMenu', currentMenu.value)
        else localStorage.removeItem('currentMenu')
    }

    function setAuth(data) {
        token.value = data.token
        username.value = data.username
        nickname.value = data.nickname || ''
        isGuest.value = data.guest || false
        role.value = data.role || ''
        if (data.userId) {
            userId.value = data.userId
        } else {
            try {
                const payload = JSON.parse(atob(token.value.split('.')[1]))
                userId.value = payload.userId || 0
                if (payload.role) role.value = payload.role
            } catch (e) {
                userId.value = 0
            }
        }
        saveToLocalStorage()
    }

    function clearAuth() {
        token.value = ''
        username.value = ''
        nickname.value = ''
        isGuest.value = false
        userId.value = 0
        role.value = ''
        currentMenu.value = 'home'
        saveToLocalStorage()
    }

    function setCurrentMenu(menu) {
        currentMenu.value = menu
        saveToLocalStorage()
    }

    async function fetchUserInfo() {
        if (isGuest.value) return
        try {
            const res = await axios.get('/user/info')
            if (res.data.code === 200) {
                const data = res.data.data
                nickname.value = data.nickname || data.username || ''
                saveToLocalStorage()
            }
        } catch (error) {
            console.error('获取用户信息失败', error)
        }
    }

    // 登录：使用 username 字段
    async function login(usernameVal, passwordVal) {
        const res = await axios.post('/auth/login', { username: usernameVal, password: passwordVal })
        if (res.data.code === 200) {
            const token = res.data.data.token
            setAuth({ token, username: usernameVal, guest: false })
            await fetchUserInfo()
            return true
        }
        throw new Error(res.data.message || '登录失败')
    }

    // 注册：使用 username, password
    async function register(usernameVal, passwordVal) {
        const res = await axios.post('/auth/register', { username: usernameVal, password: passwordVal })
        if (res.data.code === 200) {
            // 注册成功后自动登录
            return await login(usernameVal, passwordVal)
        }
        throw new Error(res.data.message || '注册失败')
    }

    async function logout() {
        // 后端无登出接口，直接清除本地数据
        clearAuth()
    }

    // 注销账号：使用 DELETE /user/cancel，需要提供密码
    async function deleteAccount(password) {
        if (isGuest.value) throw new Error('游客账号不能注销')
        const res = await axios.delete('/user/cancel', { data: { password } })
        if (res.data.code === 200) {
            clearAuth()
            return true
        }
        throw new Error(res.data.message || '注销失败')
    }

    function updateNickname(newNickname) {
        nickname.value = newNickname || ''
        saveToLocalStorage()
    }

    return {
        token,
        username,
        nickname,
        isGuest,
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
        logout,
        deleteAccount,
        fetchUserInfo,
        updateNickname
    }
})