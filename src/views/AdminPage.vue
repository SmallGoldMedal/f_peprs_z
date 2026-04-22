// 文件位置：C:\Users\12243\Desktop\f_peprs_z\src\views\AdminPage.vue
<template>
  <div class="admin-container">
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

    <div class="app-main">
      <aside class="sidebar">
        <el-menu
            :default-active="activeMenu"
            class="menu-vertical"
            @select="handleMenuSelect"
        >
          <el-menu-item index="dataManage">
            <el-icon><DataBoard /></el-icon>
            <span>系统数据管理</span>
          </el-menu-item>
          <el-menu-item index="userManage">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="logManage">
            <el-icon><Document /></el-icon>
            <span>系统日志管理</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <main class="content-area">
        <component :is="currentComponent" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, markRaw, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, DataBoard, Document } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 导入三个管理组件
import SystemDataManage from './AdminPage/SystemDataManage.vue'
import UserManage from './AdminPage/UserManage.vue'
import LogManage from './AdminPage/LogManage.vue'

const router = useRouter()
const userStore = useUserStore()

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

const activeMenu = ref('dataManage')

const componentMap = {
  dataManage: markRaw(SystemDataManage),
  userManage: markRaw(UserManage),
  logManage: markRaw(LogManage)
}

const currentComponent = computed(() => componentMap[activeMenu.value])

const handleMenuSelect = (index) => {
  activeMenu.value = index
}

const goBackToUserView = () => {
  router.push('/home')
}

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
  } catch {}
}

onMounted(() => {
  fetchDisplayName()
})
</script>

<style scoped>
/* 样式与原 AdminPage.vue 保持一致，此处省略（实际使用原有样式） */
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
}

.admin-container input,
.admin-container textarea {
  caret-color: black;
}
</style>