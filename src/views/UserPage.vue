// 文件位置：C:\Users\12243\Desktop\f_peprs_z\src\views\UserPage.vue
<template>
  <div class="home-container">
    <!-- 头部栏 -->
    <header class="app-header">
      <div class="logo">健身运动方案系统</div>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>欢迎回来，{{ displayName }}</span>
        <el-button
            v-if="userStore.isAdmin"
            type="primary"
            size="small"
            @click="switchToAdminView"
            style="margin-left: 12px"
        >
          切换到管理员视角
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
          <el-menu-item index="home">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="profile">
            <el-icon><UserFilled /></el-icon>
            <span>个人资料</span>
          </el-menu-item>
          <el-menu-item index="plan">
            <el-icon><Calendar /></el-icon>
            <span>运动方案</span>
          </el-menu-item>
          <el-menu-item index="workout">
            <el-icon><Document /></el-icon>
            <span>运动记录</span>
          </el-menu-item>
          <el-menu-item index="rating">
            <el-icon><Star /></el-icon>
            <span>评价反馈</span>
          </el-menu-item>
          <el-menu-item index="injury">
            <el-icon><Warning /></el-icon>
            <span>伤病记录</span>
          </el-menu-item>
          <el-menu-item index="setting">
            <el-icon><Setting /></el-icon>
            <span>账号设置</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- 右侧内容区域 -->
      <main class="content-area">
        <component :is="currentComponent" />
      </main>
    </div>
  </div>
</template>

<script setup>
// Home主页框架组件，负责布局和菜单切换
import { ref, computed, markRaw, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  UserFilled,
  Calendar,
  Document,
  Warning,
  Star,
  Setting,
  House
} from '@element-plus/icons-vue'
import request from '@/utils/request'

// 导入各功能组件
import Home from './Home/test.vue'
import UserProfile from './UserProfile/UserProfile.vue'
import Plan from './Plan/test.vue'
import WorkoutRecords from './WorkoutRecords/test.vue'
import Rating from './Rating/test.vue'
import Injury from './Injury/test.vue'
import SettingsPage from '@/views/Settings/Settings.vue'

const router = useRouter()
const userStore = useUserStore()

// 显示名称（优先昵称，其次用户名）
const displayName = ref('')
const fetchDisplayName = async () => {
  try {
    const res = await request.get('/user/info')
    if (res.data.code === 200 && res.data.data) {
      const nickname = res.data.data.nickname
      if (nickname && nickname.trim() !== '') {
        displayName.value = nickname
      } else {
        displayName.value = userStore.username
      }
    } else {
      displayName.value = userStore.username
    }
  } catch {
    displayName.value = userStore.username
  }
}

// 当前激活的菜单项（从store读取，保持刷新后状态）
const activeMenu = ref(userStore.currentMenu || 'home')

// 组件映射表（索引与组件一一对应）
const componentMap = {
  home: markRaw(Home),
  profile: markRaw(UserProfile),
  plan: markRaw(Plan),
  workout: markRaw(WorkoutRecords),
  rating: markRaw(Rating),
  injury: markRaw(Injury),
  setting: markRaw(SettingsPage)
}

// 当前显示的组件
const currentComponent = computed(() => componentMap[activeMenu.value])

// 菜单选择事件
const handleMenuSelect = (index) => {
  activeMenu.value = index
  userStore.setCurrentMenu(index)
}

// 切换到管理员视图
const switchToAdminView = () => {
  router.push('/admin')
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
.home-container {
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
</style>

<style>
/* 全局效果：鼠标光标处于输入状态时，光标显示为黑色 */
.home-container input,
.home-container textarea {
  caret-color: black;
}
</style>