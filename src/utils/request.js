import axios from 'axios'
import { ElMessageBox } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'

const request = axios.create({
    baseURL: '',
    timeout: 10000
})

request.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    error => Promise.reject(error)
)

request.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // 清除本地存储
            localStorage.removeItem('token')
            localStorage.removeItem('username')
            localStorage.removeItem('userId')
            localStorage.removeItem('role')
            localStorage.removeItem('currentMenu')

            // 同步清除 Pinia store 中的用户状态
            const userStore = useUserStore()
            userStore.clearAuth()

            // 弹出提示框，用户点击确定后跳转到登录页
            ElMessageBox.alert('登录已过期，请重新登录', '提示', {
                confirmButtonText: '确定',
                callback: () => {
                    router.push('/')
                }
            })
            return Promise.reject(error)
        }
        return Promise.reject(error)
    }
)

export default request