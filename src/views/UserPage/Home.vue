<template>
  <div class="home-dashboard">
    <!-- 今日运动提醒卡片 -->
    <el-card v-if="todayPendingWorkouts.length > 0" class="reminder-card" shadow="hover">
      <div class="reminder-header">
        <el-icon class="reminder-icon"><WarningFilled /></el-icon>
        <span class="reminder-title">今日运动提醒</span>
      </div>
      <div class="reminder-body">
        <div class="reminder-desc">您今天还有以下运动未完成，请及时记录：</div>
        <div class="pending-list">
          <div
              v-for="item in todayPendingWorkouts"
              :key="`${item.planId}_${item.exerciseId}`"
              class="pending-item"
              @click="goToWorkoutWithPlan(item)"
          >
            <el-tag type="warning" effect="plain" size="large">
              {{ getExerciseName(item.exerciseId, item.exerciseName) }}
              <span class="plan-hint">（方案：{{ item.planName }}）</span>
            </el-tag>
          </div>
        </div>
        <div class="reminder-action">
          <el-button type="primary" size="small" @click="goToWorkout">查看全部运动记录</el-button>
        </div>
      </div>
    </el-card>

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
              <el-icon><Delete /></el-icon>
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Calendar, Document, Delete, WarningFilled } from '@element-plus/icons-vue'
import request from '@/utils/request.js'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const planCount = ref(0)
const recordCount = ref(0)
const totalCalories = ref(0)
const recentPlans = ref([])
const loadingPlans = ref(false)
const todayPendingWorkouts = ref([])
const exerciseNameMap = ref({})

const getTodayStr = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

const loadExerciseNameMap = async () => {
  try {
    const res = await request.post('/exercise/search', { page: 1, size: 100 })
    if (res.data.code === 200) {
      const exercises = res.data.data.records || []
      exercises.forEach(ex => {
        exerciseNameMap.value[ex.id] = ex.exerciseName
      })
    }
  } catch (error) {
    console.error('加载运动名称失败', error)
  }
}

const getExerciseName = (exerciseId, backendName) => {
  if (backendName && backendName.trim()) return backendName
  return exerciseNameMap.value[exerciseId] || `运动${exerciseId}`
}

const checkTodayPendingWorkouts = async () => {
  todayPendingWorkouts.value = []
  try {
    const plansRes = await request.get('/user/plan/list')
    if (plansRes.data.code !== 200) return
    const activePlans = (plansRes.data.data || []).filter(p => p.status === 1)
    if (activePlans.length === 0) return

    const recordRes = await request.post('/user/workout-record/search', { page: 1, size: 1000 })
    const records = (recordRes.data.code === 200 && recordRes.data.data.records) ? recordRes.data.data.records : []
    const completedSet = new Set()
    records.forEach(rec => {
      if (rec.status === 0) {
        completedSet.add(`${rec.completionDate}_${rec.exerciseId}`)
      }
    })

    const todayStr = getTodayStr()
    const pendingItems = []

    for (const plan of activePlans) {
      const detailRes = await request.get(`/user/plan-day-detail/list/${plan.id}`)
      if (detailRes.data.code !== 200) continue
      const details = detailRes.data.data || []
      if (details.length === 0) continue

      const startDate = new Date(plan.startDate)
      const todayDate = new Date()
      const diffDays = Math.floor((todayDate - startDate) / (1000 * 60 * 60 * 24))
      const currentDayNumber = diffDays + 1
      if (currentDayNumber < 1 || currentDayNumber > plan.durationDays) continue

      const todayDetails = details.filter(d => d.dayNumber === currentDayNumber)
      for (const detail of todayDetails) {
        const key = `${todayStr}_${detail.exerciseId}`
        if (!completedSet.has(key)) {
          pendingItems.push({
            planId: plan.id,
            planName: plan.planName,
            exerciseId: detail.exerciseId,
            exerciseName: detail.exerciseName
          })
        }
      }
    }
    todayPendingWorkouts.value = pendingItems
  } catch (error) {
    console.error('检查今日运动提醒失败', error)
  }
}

const goToWorkout = () => {
  userStore.setCurrentMenu('workout')
  window.location.reload()
}

const goToWorkoutWithPlan = (item) => {
  ElMessage.info(`请为“${getExerciseName(item.exerciseId, item.exerciseName)}”添加记录`)
  userStore.setCurrentMenu('workout')
  window.location.reload()
}

const goToPlan = () => {
  userStore.setCurrentMenu('plan')
  window.location.reload()
}

const viewPlan = (planId) => {
  userStore.setCurrentMenu('plan')
  window.location.reload()
}

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
    const planRes = await request.get('/user/plan/list')
    if (planRes.data.code === 200) {
      const plans = planRes.data.data || []
      planCount.value = plans.length
      recentPlans.value = plans.slice(0, 5)
    }
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

// 监听运动记录变更事件
const handleWorkoutRecordChange = () => {
  checkTodayPendingWorkouts()
}

onMounted(async () => {
  await loadExerciseNameMap()
  await fetchDashboard()
  await checkTodayPendingWorkouts()
  window.addEventListener('workout-record-changed', handleWorkoutRecordChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('workout-record-changed', handleWorkoutRecordChange)
})
</script>

<style scoped>
/* 样式保持不变，略 */
.home-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}
.reminder-card {
  margin-bottom: 20px;
  border-left: 4px solid #e6a23c;
  background-color: #fdf6ec;
}
.reminder-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.reminder-icon {
  font-size: 20px;
  color: #e6a23c;
}
.reminder-title {
  font-weight: bold;
  font-size: 16px;
  color: #e6a23c;
}
.reminder-body {
  padding-left: 28px;
}
.reminder-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}
.pending-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 12px 0;
}
.pending-item {
  cursor: pointer;
  transition: transform 0.1s ease;
}
.pending-item:hover {
  transform: scale(1.02);
}
.plan-hint {
  font-size: 12px;
  margin-left: 6px;
  color: #909399;
}
.reminder-action {
  margin-top: 8px;
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