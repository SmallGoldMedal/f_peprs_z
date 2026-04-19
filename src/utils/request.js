import axios from 'axios'

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
            localStorage.removeItem('token')
            localStorage.removeItem('accountname')
            localStorage.removeItem('isGuest')
            localStorage.removeItem('userId')
            window.location.href = '/'
        }
        return Promise.reject(error)
    }
)

export default request