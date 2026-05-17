import axios from 'axios'
import { ElMessageBox } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'

// 防止重复跳转和弹窗的标志
let isRedirecting = false;

// 解析 JWT 负载，获取过期时间（秒）
function parseJwtExp(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        return payload.exp ? payload.exp * 1000 : null; // 转换为毫秒
    } catch (e) {
        return null;
    }
}

// 检查 token 是否过期
function isTokenExpired(token) {
    if (!token) return true;
    const expMs = parseJwtExp(token);
    if (expMs === null) return true;
    return Date.now() >= expMs;
}

// 统一处理登录过期：清除状态、弹窗、跳转
function handleTokenExpired() {
    if (isRedirecting) return;
    isRedirecting = true;

    // 保存当前页面状态（用于登录后跳回）
    const currentPath = router.currentRoute.value.fullPath;
    sessionStorage.setItem('redirectPath', currentPath);
    sessionStorage.setItem('redirectQuery', JSON.stringify(router.currentRoute.value.query));

    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('currentMenu');

    // 清除 Pinia store
    const userStore = useUserStore();
    userStore.clearAuth();

    ElMessageBox.alert('登录已过期，请重新登录', '提示', {
        confirmButtonText: '确定',
        callback: () => {
            isRedirecting = false;
            router.push('/');
        }
    });
}

const request = axios.create({
    baseURL: '',
    timeout: 10000
});

// 请求拦截器：在发送请求前检查 token 是否过期
request.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            if (isTokenExpired(token)) {
                // token 已过期，阻止请求发送，并处理过期逻辑
                handleTokenExpired();
                return Promise.reject(new Error('登录已过期'));
            }
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// 响应拦截器（兜底）：处理后端返回的 401（例如 token 被后端判定无效）
request.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401 && !isRedirecting) {
            handleTokenExpired();
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);

export default request