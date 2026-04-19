import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/utils/request'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('token') || '')
    const username = ref(localStorage.getItem('username') || '')      // 登录账号
    const nickname = ref(localStorage.getItem('nickname') || '')      // 昵称
    const userId = ref(parseInt(localStorage.getItem('userId') || '0'))
    const role = ref(localStorage.getItem('role') || '')              // 'USER' 或 'ADMIN'
    const currentMenu = ref(localStorage.getItem('currentMenu') || 'home')

    const isAuthenticated = computed(() => !!token.value)
    const isAdmin = computed(() => role.value === 'ADMIN')
    const displayName = computed(() => nickname.value || username.value)

    function saveToLocalStorage() {
        if (token.value) localStorage.setItem('token', token.value)
        else localStorage.removeItem('token')
        if (username.value) localStorage.setItem('username', username.value)
        else localStorage.removeItem('username')
        if (nickname.value) localStorage.setItem('nickname', nickname.value)
        else localStorage.removeItem('nickname')
        localStorage.setItem('userId', userId.value.toString())
        if (role.value) localStorage.setItem('role', role.value)
        else localStorage.removeItem('role')
        if (currentMenu.value) localStorage.setItem('currentMenu', currentMenu.value)
        else localStorage.removeItem('currentMenu')
    }

    function setAuth(data) {
        token.value = data.token
        username.value = data.username || ''
        nickname.value = data.nickname || ''
        userId.value = data.userId || 0
        role.value = data.role || 'USER'
        saveToLocalStorage()
    }

    function clearAuth() {
        token.value = ''
        username.value = ''
        nickname.value = ''
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
        try {
            const res = await axios.get('/user/info')
            if (res.data.code === 200) {
                const data = res.data.data
                nickname.value = data.nickname || data.username || ''
                username.value = data.username
                userId.value = data.id
                role.value = data.role === 1 ? 'ADMIN' : 'USER'
                saveToLocalStorage()
            }
        } catch (error) {
            console.error('获取用户信息失败', error)
        }
    }

    async function login(usernameVal, passwordVal) {
        const res = await axios.post('/auth/login', { username: usernameVal, password: passwordVal })
        if (res.data.code === 200) {
            const token = res.data.data.token
            let userIdFromToken = 0
            let roleFromToken = 'USER'
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))
                userIdFromToken = payload.userId || 0
                roleFromToken = payload.role === 1 ? 'ADMIN' : 'USER'
            } catch (e) {}
            setAuth({
                token,
                username: usernameVal,
                nickname: '',
                userId: userIdFromToken,
                role: roleFromToken
            })
            await fetchUserInfo()
            return true
        }
        throw new Error(res.data.message || '登录失败')
    }

    async function register(usernameVal, passwordVal, nicknameVal = '') {
        const res = await axios.post('/auth/register', { username: usernameVal, password: passwordVal, nickname: nicknameVal })
        if (res.data.code === 200) {
            return await login(usernameVal, passwordVal)
        }
        throw new Error(res.data.message || '注册失败')
    }

    async function logout() {
        clearAuth()
        await router.push('/')
    }

    async function deleteAccount(password) {
        const res = await axios.delete('/user/cancel', { data: { password } })
        if (res.data.code === 200) {
            clearAuth()
            await router.push('/')
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