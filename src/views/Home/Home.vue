// 文件位置：C:\Users\12243\Desktop\f_peprs_z\src\views\Home\Home.vue
<template>
  <div class="home-dashboard">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>我的方案</span>
              <el-icon><Calendar /></el-icon>
            </div>
          </template>
          <div class="stat-value">{{ planCount }}</div>
          <div class="stat-label">总方案数</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>运动记录</span>
              <el-icon><Document /></el-icon>
            </div>
          </template>
          <div class="stat-value">{{ recordCount }}</div>
          <div class="stat-label">本月完成</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总消耗</span>
              <el-icon><Fire /></el-icon>
            </div>
          </template>
          <div class="stat-value">{{ totalCalories }}</div>
          <div class="stat-label">千卡</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="recent-plan-card">
      <template #header>
        <span>最近方案</span>
        <el-button type="primary" link @click="goToPlan">查看全部 →</el-button>
      </template>
      <el-table :data="recentPlans" v-loading="loadingPlans" stripe>
        <el-table-column prop="planName" label="方案名称" />
        <el-table-column label="开始日期" width="120">
          <template #default="{ row }">{{ formatDate(row.startDate) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewPlan(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Calendar, Document, Fire } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const planCount = ref(0)
const recordCount = ref(0)
const totalCalories = ref(0)
const recentPlans = ref([])
const loadingPlans = ref(false)

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}

const getStatusText = (status) => {
  const map = { 0: '已推荐', 1: '进行中', 2: '已完成', 3: '未完成', 4: '暂停' }
  return map[status] || '未知'
}

const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'primary', 2: 'success', 3: 'danger', 4: 'warning' }
  return map[status] || 'info'
}

const fetchDashboard = async () => {
  try {
    // 获取方案列表
    const planRes = await request.get('/user/plan/list')
    if (planRes.data.code === 200) {
      const plans = planRes.data.data || []
      planCount.value = plans.length
      recentPlans.value = plans.slice(0, 5)
    }
    // 获取运动记录（本月）
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    const recordRes = await request.post('/user/workout-record/search', {
      page: 1, size: 100, startDate, endDate
    })
    if (recordRes.data.code === 200) {
      const records = recordRes.data.data.records || []
      recordCount.value = records.length
      totalCalories.value = records.reduce((sum, r) => sum + (r.actualCalories || 0), 0)
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const goToPlan = () => {
  router.push('/home')
  // 通过事件通知父组件切换菜单，但这里无法直接修改 activeMenu，需要借助 store
  const { useUserStore } = require('@/stores/user')
  const userStore = useUserStore()
  userStore.setCurrentMenu('plan')
  location.reload() // 简单刷新，实际可使用事件总线
}

const viewPlan = (planId) => {
  // 跳转到方案详情页（需要实现方案详情组件，暂跳转方案列表）
  router.push('/home')
  const { useUserStore } = require('@/stores/user')
  const userStore = useUserStore()
  userStore.setCurrentMenu('plan')
  location.reload()
}

onMounted(() => {
  fetchDashboard()
})
</script>

<style scoped>
.home-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}
.stat-card {
  text-align: center;
  border-radius: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin: 12px 0;
}
.stat-label {
  color: #909399;
  font-size: 14px;
}
.recent-plan-card {
  margin-top: 20px;
  border-radius: 16px;
}
</style>