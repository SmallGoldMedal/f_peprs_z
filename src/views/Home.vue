<template>
  <div class="home-container">
    <header class="app-header">
      <div class="logo">健身运动方案系统</div>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>欢迎回来，{{ displayName }}</span>
        <el-button
            v-if="userStore.isAdmin && $route.path !== '/admin'"
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

    <div class="app-main">
      <aside class="sidebar">
        <el-menu
            :default-active="activeMenu"
            class="menu-vertical"
            @select="handleMenuSelect"
        >
          <el-menu-item index="home">
            <el-icon><House/></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="profile">
            <el-icon><UserFilled/></el-icon>
            <span>个人</span>
          </el-menu-item>
          <el-menu-item index="plan">
            <el-icon><Calendar/></el-icon>
            <span>生成方案</span>
          </el-menu-item>
          <el-menu-item index="records">
            <el-icon><Document/></el-icon>
            <span>运动记录</span>
          </el-menu-item>
          <el-menu-item index="injuries">
            <el-icon><Warning/></el-icon>
            <span>伤病记录</span>
          </el-menu-item>
          <el-menu-item index="settings">
            <el-icon><Setting/></el-icon>
            <span>设置</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <main class="content-area">
        <component :is="currentComponent"/>
      </main>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, markRaw, onMounted, watch} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useUserStore} from '@/stores/user'
import {ElMessage, ElMessageBox} from 'element-plus'
import {
  House,
  User,
  UserFilled,
  Calendar,
  Document,
  Setting,
  Warning
} from '@element-plus/icons-vue'

import Dashboard from './Dashboard.vue'
import Profile from './Profile.vue'
import PlanRecommend from './PlanRecommend.vue'
import WorkoutRecords from './WorkoutRecords.vue'
import InjuryRecords from './InjuryRecords.vue'
import Settings from './Settings.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const displayName = computed(() => userStore.displayName)

onMounted(() => {
  userStore.fetchUserInfo()
})

const activeMenu = ref(userStore.currentMenu)

watch(() => userStore.currentMenu, (newVal) => {
  activeMenu.value = newVal
})

const componentMap = {
  home: markRaw(Dashboard),
  profile: markRaw(Profile),
  plan: markRaw(PlanRecommend),
  records: markRaw(WorkoutRecords),
  injuries: markRaw(InjuryRecords),
  settings: markRaw(Settings)
}

const currentComponent = computed(() => componentMap[activeMenu.value])

const handleMenuSelect = (index) => {
  activeMenu.value = index
  userStore.setCurrentMenu(index)
}

const switchToAdminView = () => {
  router.push('/admin')
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    ElMessage.success('已退出登录')
  } catch {
    // 用户取消
  }
}
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