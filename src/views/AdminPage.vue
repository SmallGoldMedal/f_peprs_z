// 文件位置：C:\Users\12243\Desktop\f_peprs_z\src\views\AdminPage.vue
<template>
  <div class="admin-container">
    <!-- 头部栏 -->
    <header class="app-header">
      <div class="logo">健身运动方案系统（管理后台）</div>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>管理员，{{ displayName }}</span>
        <el-button type="primary" size="small" @click="goBackToUserView" style="margin-left: 12px">
          返回用户视角
        </el-button>
        <el-button type="danger" size="small" @click="handleLogout" style="margin-left: 12px">
          退出登录
        </el-button>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="app-main">
      <!-- 左侧菜单栏 -->
      <aside class="sidebar">
        <el-menu
            :default-active="activeMenu"
            class="menu-vertical"
            @select="handleMenuSelect"
        >
          <el-menu-item index="dashboard">
            <el-icon><DataBoard /></el-icon>
            <span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="exercises">
            <el-icon><Basketball /></el-icon>
            <span>运动管理</span>
          </el-menu-item>
          <el-menu-item index="plans">
            <el-icon><Calendar /></el-icon>
            <span>方案管理</span>
          </el-menu-item>
          <el-menu-item index="records">
            <el-icon><Document /></el-icon>
            <span>记录管理</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- 右侧内容区域 -->
      <main class="content-area">
        <div class="placeholder-content">
          <el-empty description="管理功能开发中" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  DataBoard,
  Basketball,
  Calendar,
  Document
} from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

// 显示名称（优先昵称，其次用户名）
const displayName = ref('')
const fetchDisplayName = async () => {
  try {
    const res = await request.get('/user/info')
    if (res.data.code === 200 && res.data.data.nickname) {
      displayName.value = res.data.data.nickname
    } else {
      displayName.value = userStore.username
    }
  } catch {
    displayName.value = userStore.username
  }
}

// 当前激活的菜单项
const activeMenu = ref('dashboard')

// 菜单选择事件（预留，暂不加载具体组件）
const handleMenuSelect = (index) => {
  activeMenu.value = index
  // 此处可扩展为动态加载组件，当前仅做框架演示
}

// 返回用户视角
const goBackToUserView = () => {
  router.push('/home')
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await request.post('/auth/logout')
    userStore.clearAuth()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  fetchDisplayName()
})
</script>

<style scoped>
.admin-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 24px;
  background-color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.logo {
  font-size: 18px;
  font-weight: 600;
  color: #2c5a7a;
  letter-spacing: 1px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #5a7d9a;
  background-color: #f5f7fa;
  padding: 6px 14px;
  border-radius: 30px;
  cursor: default;
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background-color: #f8f9fc;
  border-right: 1px solid #e9ecef;
  overflow-y: auto;
}

.menu-vertical {
  border-right: none;
  background-color: transparent;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
}

:deep(.el-menu-item:hover) {
  background-color: #eef2f6;
}

:deep(.el-menu-item.is-active) {
  background-color: #e6f7ff;
  color: #409eff;
  font-weight: 500;
}

.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  width: 100%;
  max-width: 600px;
}
</style>

<style>
.admin-container input,
.admin-container textarea {
  caret-color: black;
}
</style>