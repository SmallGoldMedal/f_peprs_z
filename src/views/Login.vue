<template>
  <div class="login-page">
    <!-- 天空背景 -->
    <div class="sky"></div>
    <!-- 太阳 -->
    <div class="sun"></div>
    <!-- 云朵动画 -->
    <div class="clouds">
      <div class="cloud cloud1"></div>
      <div class="cloud cloud2"></div>
      <div class="cloud cloud3"></div>
      <div class="cloud cloud4"></div>
    </div>

    <!-- 登录/注册卡片 -->
    <div class="login-container">
      <div class="login-card" :class="{ 'register-mode': isRegisterMode }">
        <h2>{{ isRegisterMode ? '注册新账号' : '健身运动方案系统' }}</h2>

        <!-- 登录表单 -->
        <div v-if="!isRegisterMode" class="form-container">
          <el-input
              placeholder="用户名"
              v-model="loginForm.username"
              class="input-field"
              clearable
          ></el-input>
          <el-input
              placeholder="密码"
              type="password"
              v-model="loginForm.password"
              class="input-field"
              show-password
          ></el-input>
          <el-button type="primary" class="action-btn" @click="handleLogin" :loading="loginLoading">
            登录
          </el-button>
          <div class="extra-links">
            <a href="#" @click.prevent="switchToRegister">注册账号</a>
          </div>
        </div>

        <!-- 注册表单 -->
        <div v-else class="form-container register-form">
          <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" @submit.prevent>
            <el-form-item prop="username">
              <el-input
                  placeholder="账号（3-20个字符）"
                  v-model="registerForm.username"
                  class="input-field"
                  clearable
                  @blur="checkUsernameDebounced"
              ></el-input>
              <div v-if="usernameExists" class="error-tip">账号已存在，请更换</div>
              <div v-else-if="checkingUsername" class="checking-tip">检测中...</div>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                  placeholder="密码（6-20个字符）"
                  type="password"
                  v-model="registerForm.password"
                  class="input-field"
                  show-password
              ></el-input>
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                  placeholder="确认密码"
                  type="password"
                  v-model="registerForm.confirmPassword"
                  class="input-field"
                  show-password
              ></el-input>
            </el-form-item>
          </el-form>
          <el-button type="primary" class="action-btn" @click="handleRegister" :loading="registerLoading" :disabled="usernameExists || checkingUsername">
            注册
          </el-button>
          <div class="extra-links">
            <a href="#" @click.prevent="switchToLogin">返回登录</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

// 模式切换
const isRegisterMode = ref(false)

// 登录表单
const loginForm = reactive({ username: '', password: '' })
const loginLoading = ref(false)

// 注册表单
const registerForm = reactive({ username: '', password: '', confirmPassword: '' })
const registerLoading = ref(false)
const registerFormRef = ref(null)

// 用户名实时校验
const usernameExists = ref(false)
const checkingUsername = ref(false)
let debounceTimer = null

// 注册表单验证规则
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateAccountLength = (rule, value, callback) => {
  if (!value || value.length < 3 || value.length > 20) {
    callback(new Error('账号长度必须在3-20个字符之间'))
  } else {
    callback()
  }
}

const validatePasswordLength = (rule, value, callback) => {
  if (!value || value.length < 6 || value.length > 20) {
    callback(new Error('密码长度必须在6-20个字符之间'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { validator: validateAccountLength, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: validatePasswordLength, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 检查用户名是否已存在
const checkUsername = async () => {
  const usernameVal = registerForm.username
  if (!usernameVal || usernameVal.length < 3 || usernameVal.length > 20) {
    usernameExists.value = false
    checkingUsername.value = false
    return
  }
  checkingUsername.value = true
  try {
    const res = await request.get('/auth/check-username', { params: { username: usernameVal } })
    if (res.data.code === 200) {
      usernameExists.value = !res.data.data
    } else {
      usernameExists.value = false
    }
  } catch (error) {
    console.error('检测账号名失败，请检查网络后再试', error)
    usernameExists.value = false
  } finally {
    checkingUsername.value = false
  }
}

const checkUsernameDebounced = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    checkUsername()
  }, 500)
}

// 监听用户名变化，重置存在状态
watch(() => registerForm.username, () => {
  usernameExists.value = false
})

// 切换到注册模式
const switchToRegister = () => {
  registerForm.username = ''
  registerForm.password = ''
  registerForm.confirmPassword = ''
  usernameExists.value = false
  checkingUsername.value = false
  isRegisterMode.value = true
  nextTick(() => {
    registerFormRef.value?.clearValidate()
  })
}

// 切换到登录模式
const switchToLogin = () => {
  loginForm.username = ''
  loginForm.password = ''
  isRegisterMode.value = false
}

// 登录处理
const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loginLoading.value = true
  try {
    await userStore.login(loginForm.username, loginForm.password)
    ElMessage.success('登录成功')
    router.push('/home')
  } catch (err) {
    ElMessage.error(err.message || '登录失败')
  } finally {
    loginLoading.value = false
  }
}

// 注册处理
const handleRegister = async () => {
  try {
    await registerFormRef.value.validate()
  } catch {
    return
  }
  if (usernameExists.value) {
    ElMessage.error('账号已存在，请更换')
    return
  }
  registerLoading.value = true
  try {
    await userStore.register(registerForm.username, registerForm.password)
    ElMessage.success('注册成功，已自动登录')
    router.push('/home')
  } catch (err) {
    ElMessage.error(err.message || '注册失败')
  } finally {
    registerLoading.value = false
  }
}

// 如果已经登录，直接跳转首页
if (userStore.isAuthenticated) {
  router.push('/home')
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-family: 'Segoe UI', 'PingFang SC', Roboto, 'Helvetica Neue', sans-serif;
}

/* 天空 */
.sky {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #6bc4ff 0%, #8ad0ff 60%, #b0e0ff 100%);
  z-index: 0;
}

/* 太阳 */
.sun {
  position: absolute;
  top: 8%;
  right: 8%;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, #ffe69e, #ffcc33);
  border-radius: 50%;
  box-shadow: 0 0 30px rgba(255, 200, 50, 0.6);
  z-index: 0;
  animation: sunGlow 3s ease-in-out infinite alternate;
}

@keyframes sunGlow {
  0% {
    box-shadow: 0 0 20px rgba(255, 200, 50, 0.4);
    transform: scale(1);
  }
  100% {
    box-shadow: 0 0 45px rgba(255, 200, 50, 0.9);
    transform: scale(1.02);
  }
}

/* 云朵 */
.clouds {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 1000px;
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.05), 0 0 0 5px rgba(255, 255, 255, 0.7), 0 0 0 12px rgba(255, 245, 230, 0.3);
  animation: floatLeft linear infinite;
}

.cloud1 {
  width: 120px;
  height: 70px;
  top: 12%;
  left: 110%;
  animation-duration: 22s;
}
.cloud1::before, .cloud1::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 50%;
}
.cloud1::before {
  width: 60px;
  height: 60px;
  top: -30px;
  left: 15px;
}
.cloud1::after {
  width: 80px;
  height: 80px;
  top: -40px;
  left: 45px;
}

.cloud2 {
  width: 150px;
  height: 85px;
  top: 35%;
  left: 130%;
  animation-duration: 28s;
  animation-delay: -6s;
}
.cloud2::before {
  width: 75px;
  height: 75px;
  top: -35px;
  left: 20px;
}
.cloud2::after {
  width: 95px;
  height: 95px;
  top: -48px;
  left: 55px;
}

.cloud3 {
  width: 100px;
  height: 60px;
  top: 60%;
  left: 115%;
  animation-duration: 18s;
  animation-delay: -12s;
}
.cloud3::before {
  width: 50px;
  height: 50px;
  top: -25px;
  left: 12px;
}
.cloud3::after {
  width: 65px;
  height: 65px;
  top: -32px;
  left: 35px;
}

.cloud4 {
  width: 80px;
  height: 50px;
  top: 78%;
  left: 120%;
  animation-duration: 15s;
  animation-delay: -4s;
}
.cloud4::before {
  width: 40px;
  height: 40px;
  top: -20px;
  left: 10px;
}
.cloud4::after {
  width: 55px;
  height: 55px;
  top: -28px;
  left: 30px;
}

@keyframes floatLeft {
  0% {
    transform: translateX(0);
    opacity: 0.9;
  }
  100% {
    transform: translateX(-200vw);
    opacity: 0.3;
  }
}

/* 登录卡片容器 */
.login-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 420px;
  z-index: 10;
}

.login-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  border-radius: 32px;
  padding: 30px 20px 40px;
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.2);
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.login-card h2 {
  font-size: 28px;
  font-weight: 600;
  color: #2c5a7a;
  margin-bottom: 24px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.register-form .el-form {
  width: 100%;
}

.register-form .el-form-item {
  margin-bottom: 16px;
}
.register-form .el-form-item:last-child {
  margin-bottom: 0;
}

.input-field :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.action-btn {
  width: 100%;
  border-radius: 40px;
  background: linear-gradient(95deg, #409eff, #66b1ff);
  border: none;
  margin-top: 8px;
}

.action-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.extra-links {
  margin-top: 16px;
  font-size: 13px;
}
.extra-links a {
  color: #5a7d9a;
  text-decoration: none;
}
.extra-links a:hover {
  color: #409eff;
}

.error-tip {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  text-align: left;
  padding-left: 16px;
}
.checking-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
  text-align: left;
  padding-left: 16px;
}

@media (max-width: 640px) {
  .login-card {
    padding: 30px 20px;
  }
  .login-card h2 {
    font-size: 24px;
  }
  .sun {
    width: 60px;
    height: 60px;
    top: 6%;
    right: 6%;
  }
}
</style>