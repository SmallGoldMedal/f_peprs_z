<template>
  <div class="rating-page">
    <el-row :gutter="24">
      <!-- 左侧：运动方案评分 -->
      <el-col :xs="24" :lg="12">
        <el-card class="rating-card">
          <template #header>
            <span>运动方案评分</span>
          </template>
          <el-table
              :data="planList"
              row-key="id"
              :expand-row-keys="expandedPlanIds"
              @expand-change="handlePlanExpand"
              v-loading="planLoading"
              stripe
          >
            <el-table-column type="expand">
              <template #default="{ row: plan }">
                <div class="plan-details">
                  <div v-if="plan.detailsLoading" class="loading-tip">加载运动中...</div>
                  <el-table
                      v-else-if="plan.details && plan.details.length"
                      :data="plan.details"
                      size="small"
                      border
                  >
                    <el-table-column prop="exerciseName" label="运动名称" min-width="150" />
                    <el-table-column label="运动量" min-width="200">
                      <template #default="{ row: detail }">
                        <span>{{ formatExerciseVolume(detail) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="评分" width="150">
                      <template #default="{ row: detail }">
                        <el-input-number
                            v-model="detail.tempScore"
                            :min="1"
                            :max="10"
                            size="small"
                            controls-position="right"
                            style="width: 100px"
                        />
                      </template>
                    </el-table-column>
                  </el-table>
                  <div v-else class="empty-tip">该方案暂无运动项目</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="planName" label="方案名称" min-width="150" />
            <el-table-column label="开始日期" width="120">
              <template #default="{ row }">{{ formatDate(row.startDate) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="方案评分" width="220">
              <template #default="{ row }">
                <div class="plan-score-row">
                  <el-input-number
                      v-model="row.planScoreTemp"
                      :min="1"
                      :max="10"
                      size="small"
                      controls-position="right"
                      style="width: 100px"
                  />
                  <el-button type="primary" size="small" @click="submitPlanRating(row)">提交</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：运动项目评分 -->
      <el-col :xs="24" :lg="12">
        <el-card class="rating-card">
          <template #header>
            <span>运动项目评分</span>
          </template>
          <div class="search-bar">
            <el-input
                v-model="searchKeyword"
                placeholder="请输入运动名称关键字"
                clearable
                style="width: 260px; margin-right: 12px"
                @keyup.enter="searchExercise"
            />
            <el-button type="primary" @click="searchExercise">搜索</el-button>
            <el-button @click="clearSearch">重置</el-button>
          </div>
          <el-table :data="searchedExercises" v-loading="searchLoading" stripe style="margin-top: 16px">
            <el-table-column prop="exerciseName" label="运动名称" min-width="180" />
            <el-table-column label="评分" width="220">
              <template #default="{ row }">
                <div class="exercise-score-row">
                  <el-input-number
                      v-model="row.tempScore"
                      :min="1"
                      :max="10"
                      size="small"
                      controls-position="right"
                      style="width: 100px"
                  />
                  <el-button type="primary" size="small" @click="saveSingleExerciseRating(row)">保存</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

// ---------- 全局运动名称映射表 ----------
const exerciseNameMap = ref({})   // 数字 id -> 名称

// 加载所有运动名称（建立 id → name 映射）
const loadExerciseNameMap = async () => {
  try {
    const res = await request.post('/exercise/search', { page: 1, size: 100 })
    if (res.data.code === 200) {
      const exercises = res.data.data.records || []
      exercises.forEach(ex => {
        // 统一将 id 转为数字存储
        exerciseNameMap.value[Number(ex.id)] = ex.exerciseName
      })
      console.log('✅ 运动名称映射已加载，共', Object.keys(exerciseNameMap.value).length, '条')
    } else {
      console.error('❌ 加载运动名称失败', res.data.message)
    }
  } catch (error) {
    console.error('❌ 加载运动名称异常', error)
  }
}

// 获取运动名称（优先后端返回，否则从映射表获取，最后显示 ID）
const getExerciseName = (exerciseId, backendName) => {
  const idNum = Number(exerciseId)
  if (backendName && backendName.trim()) return backendName
  const name = exerciseNameMap.value[idNum]
  if (name) return name
  console.warn(`⚠️ 未找到运动ID ${idNum} 的名称`)
  return `运动${exerciseId}`
}

// ---------- 左侧：运动方案评分 ----------
const planList = ref([])
const planLoading = ref(false)
const expandedPlanIds = ref([])

const fetchPlans = async () => {
  planLoading.value = true
  try {
    const res = await request.get('/user/plan/list')
    if (res.data.code === 200) {
      planList.value = (res.data.data || []).map(plan => ({
        ...plan,
        details: null,
        detailsLoading: false,
        planScoreTemp: plan.planScore !== null ? plan.planScore : null
      }))
    } else {
      ElMessage.error(res.data.message || '获取方案列表失败')
    }
  } catch {
    ElMessage.error('获取方案列表失败')
  } finally {
    planLoading.value = false
  }
}

// 加载方案明细，按 exerciseId 去重，并填充运动名称
const loadPlanDetails = async (plan) => {
  if (plan.details !== null) return

  // 确保运动名称映射表已加载
  if (Object.keys(exerciseNameMap.value).length === 0) {
    await loadExerciseNameMap()
  }

  plan.detailsLoading = true
  try {
    const res = await request.get(`/user/plan-day-detail/list/${plan.id}`)
    if (res.data.code === 200) {
      const allDetails = res.data.data || []
      const uniqueMap = new Map()
      for (const d of allDetails) {
        const exId = Number(d.exerciseId)
        if (!uniqueMap.has(exId)) {
          uniqueMap.set(exId, {
            id: d.id,
            exerciseId: exId,
            exerciseName: getExerciseName(exId, d.exerciseName),
            sets: d.sets,
            reps: d.reps,
            exerciseDuration: d.exerciseDuration,
            distance: d.distance,
            frequency: d.frequency,
            tempScore: null
          })
        }
      }
      plan.details = Array.from(uniqueMap.values())
      await loadUserScoresForDetails(plan.details)
    } else {
      plan.details = []
    }
  } catch {
    plan.details = []
  } finally {
    plan.detailsLoading = false
  }
}

// 加载用户手动评分（isDefault=0）
const loadUserScoresForDetails = async (details) => {
  if (!details.length) return
  try {
    const res = await request.get('/user/exercise-rating/list')
    if (res.data.code === 200) {
      const ratings = res.data.data || []
      const ratingMap = {}
      ratings.forEach(r => {
        if (r.isDefault === 0) ratingMap[Number(r.exerciseId)] = r.exerciseScore
      })
      details.forEach(d => {
        d.tempScore = ratingMap[d.exerciseId] !== undefined ? ratingMap[d.exerciseId] : null
      })
    }
  } catch {}
}

const formatExerciseVolume = (detail) => {
  const parts = []
  if (detail.sets) parts.push(`${detail.sets}组`)
  if (detail.reps) parts.push(`${detail.reps}次`)
  if (detail.exerciseDuration) parts.push(`${detail.exerciseDuration}分钟`)
  if (detail.distance) parts.push(`${detail.distance}km`)
  if (detail.frequency) parts.push(`${detail.frequency}次/分`)
  return parts.join(' ') || '-'
}

const handlePlanExpand = (row, expanded) => {
  if (expanded) {
    if (!expandedPlanIds.value.includes(row.id)) {
      expandedPlanIds.value.push(row.id)
      loadPlanDetails(row)
    }
  } else {
    expandedPlanIds.value = expandedPlanIds.value.filter(id => id !== row.id)
  }
}

// 提交方案评分（同时为该方案下所有运动项目评分）
const submitPlanRating = async (plan) => {
  const score = plan.planScoreTemp
  if (score === null || score === undefined) {
    ElMessage.warning('请先填写方案评分')
    return
  }
  if (score < 1 || score > 10) {
    ElMessage.warning('评分必须在1-10之间')
    return
  }
  try {
    const feedbackRes = await request.post(`/user/plan/${plan.id}/feedback`, {
      planScore: score,
      feedback: ''
    })
    if (feedbackRes.data.code !== 200) {
      ElMessage.error(feedbackRes.data.message || '保存方案评分失败')
      return
    }
  } catch {
    ElMessage.error('保存方案评分失败')
    return
  }

  if (!plan.details) await loadPlanDetails(plan)
  const exerciseIds = (plan.details || []).map(d => d.exerciseId).filter(id => id)
  if (exerciseIds.length === 0) {
    ElMessage.warning('该方案无运动项目，无需评分')
    return
  }

  let successCount = 0
  for (const exId of exerciseIds) {
    try {
      const existingRes = await request.get(`/user/exercise-rating/exercise/${exId}`)
      let res
      if (existingRes.data.code === 200 && existingRes.data.data) {
        res = await request.put(`/user/exercise-rating/update/${existingRes.data.data.id}`, {
          exerciseScore: score,
          isDefault: 0
        })
      } else {
        res = await request.post('/user/exercise-rating/add', {
          exerciseId: exId,
          exerciseScore: score
        })
      }
      if (res.data.code === 200) successCount++
    } catch (e) { console.error(`评分运动${exId}失败`, e) }
  }
  ElMessage.success(`方案评分已保存，已为${successCount}个运动项目评分`)
  if (plan.details) plan.details.forEach(d => { d.tempScore = score })
  refreshSearchedExerciseRatings(exerciseIds, score)
}

const refreshSearchedExerciseRatings = (exerciseIds, score) => {
  if (!searchedExercises.value.length) return
  for (const ex of searchedExercises.value) {
    if (exerciseIds.includes(ex.id)) ex.tempScore = score
  }
}

// ---------- 右侧：运动项目评分 ----------
const searchKeyword = ref('')
const searchedExercises = ref([])
const searchLoading = ref(false)

// 从映射表构建运动列表（本地过滤，不再请求后端）
const searchExercise = async () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    ElMessage.warning('请输入运动名称关键字')
    return
  }
  searchLoading.value = true
  try {
    // 确保映射表已加载
    if (Object.keys(exerciseNameMap.value).length === 0) {
      await loadExerciseNameMap()
    }
    const allExercises = Object.entries(exerciseNameMap.value).map(([id, name]) => ({
      id: Number(id),
      exerciseName: name
    }))
    const filtered = allExercises.filter(ex => ex.exerciseName.toLowerCase().includes(keyword.toLowerCase()))
    if (filtered.length === 0) {
      ElMessage.info('未找到相关运动项目')
      searchedExercises.value = []
      return
    }
    const ratingMap = await getUserRatingMap()
    searchedExercises.value = filtered.map(ex => ({
      id: ex.id,
      exerciseName: ex.exerciseName,
      tempScore: ratingMap[ex.id] !== undefined ? ratingMap[ex.id] : null
    }))
  } catch {
    ElMessage.error('搜索失败')
  } finally {
    searchLoading.value = false
  }
}

const getUserRatingMap = async () => {
  try {
    const res = await request.get('/user/exercise-rating/list')
    if (res.data.code === 200) {
      const map = {}
      ;(res.data.data || []).forEach(r => {
        if (r.isDefault === 0) map[Number(r.exerciseId)] = r.exerciseScore
      })
      return map
    }
  } catch {}
  return {}
}

const saveSingleExerciseRating = async (exercise) => {
  const score = exercise.tempScore
  if (score === null || score === undefined) {
    ElMessage.warning('请先填写评分')
    return
  }
  if (score < 1 || score > 10) {
    ElMessage.warning('评分必须在1-10之间')
    return
  }
  try {
    const existingRes = await request.get(`/user/exercise-rating/exercise/${exercise.id}`)
    let res
    if (existingRes.data.code === 200 && existingRes.data.data) {
      res = await request.put(`/user/exercise-rating/update/${existingRes.data.data.id}`, {
        exerciseScore: score,
        isDefault: 0
      })
    } else {
      res = await request.post('/user/exercise-rating/add', {
        exerciseId: exercise.id,
        exerciseScore: score
      })
    }
    if (res.data.code === 200) {
      ElMessage.success('评分已保存')
      exercise.tempScore = score
      updatePlanDetailsRating(exercise.id, score)
    } else {
      ElMessage.error(res.data.message || '评分失败')
    }
  } catch {
    ElMessage.error('评分请求失败')
  }
}

const updatePlanDetailsRating = (exerciseId, score) => {
  const idNum = Number(exerciseId)
  for (const plan of planList.value) {
    if (plan.details && plan.details.length) {
      const detail = plan.details.find(d => d.exerciseId === idNum)
      if (detail) detail.tempScore = score
    }
  }
}

const clearSearch = () => {
  searchKeyword.value = ''
  searchedExercises.value = []
}

// 辅助函数
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

onMounted(async () => {
  await loadExerciseNameMap()   // 关键：先加载名称映射
  await fetchPlans()
})
</script>

<style scoped>
.rating-page {
  max-width: 100%;
  padding: 4px;
}
.rating-card {
  border-radius: 16px;
  height: 100%;
}
.plan-details {
  padding: 12px;
  background-color: #fafafa;
}
.loading-tip, .empty-tip {
  text-align: center;
  color: #909399;
  padding: 16px;
}
.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.plan-score-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.exercise-score-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>