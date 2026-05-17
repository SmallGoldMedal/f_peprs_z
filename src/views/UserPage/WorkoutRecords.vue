<template>
  <div class="workout-page">
    <el-card class="record-card">
      <template #header>
        <div class="card-header">
          <span>我的运动记录</span>
          <div class="header-buttons">
            <el-button
                type="primary"
                :disabled="!hasPendingPlanWorkout"
                @click="showPlanWorkoutDialog"
            >
              添加方案内运动记录
            </el-button>
            <el-button type="success" @click="showCustomAddDialog">
              添加自定义记录
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item label="开始日期">
          <el-date-picker v-model="query.startDate" type="date" placeholder="开始日期" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="query.endDate" type="date" placeholder="结束日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchRecords">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="recordList" v-loading="loading" stripe>
        <el-table-column prop="completionDate" label="日期" width="120" />
        <el-table-column label="运动名称" min-width="150">
          <template #default="{ row }">{{ getExerciseName(row.exerciseId) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">{{ row.status === 0 ? '完成' : '未完成' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="actualSets" label="组数" width="80" />
        <el-table-column prop="actualReps" label="次数" width="80" />
        <el-table-column prop="actualDuration" label="时长(分钟)" width="100" />
        <el-table-column prop="actualDistance" label="距离(km)" width="100" />
        <el-table-column prop="actualCalories" label="消耗(kcal)" width="100" />
        <el-table-column label="是否不适" width="100">
          <template #default="{ row }">
            <el-tag :type="row.injuryId ? 'danger' : 'success'">{{ row.injuryId ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteRecord(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="550px" destroy-on-close @closed="onDialogClosed">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <!-- 运动项目下拉选择（动态选项） -->
        <el-form-item label="运动项目" prop="exerciseId">
          <el-select
              v-model="form.exerciseId"
              filterable
              placeholder="请选择运动项目"
              style="width: 100%"
              @change="onExerciseChange"
              :loading="exerciseLoading"
          >
            <el-option
                v-for="item in currentExerciseOptions"
                :key="item.id"
                :label="item.exerciseName"
                :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="完成日期" prop="completionDate">
          <el-date-picker v-model="form.completionDate" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="0">完成</el-radio>
            <el-radio :label="1">未完成</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="组数" prop="actualSets">
          <el-input-number v-model="form.actualSets" :min="0" />
        </el-form-item>
        <el-form-item label="次数" prop="actualReps">
          <el-input-number v-model="form.actualReps" :min="0" />
        </el-form-item>
        <el-form-item label="时长(分钟)" prop="actualDuration">
          <el-input-number v-model="form.actualDuration" :min="0" />
        </el-form-item>
        <el-form-item label="距离(km)" prop="actualDistance">
          <el-input-number v-model="form.actualDistance" :min="0" :step="0.1" />
        </el-form-item>
        <el-form-item label="消耗(kcal)" prop="actualCalories">
          <el-input-number v-model="form.actualCalories" :min="0" />
        </el-form-item>

        <el-form-item label="是否感到不适">
          <el-switch v-model="form.unwellFlag" @change="handleUnwellChange" />
          <span style="margin-left: 8px">{{ form.unwellFlag ? '是' : '否' }}</span>
        </el-form-item>

        <el-form-item v-if="form.unwellFlag" label="关联伤病" prop="injuryId">
          <el-select v-model="form.injuryId" placeholder="请选择关联的伤病记录" clearable filterable>
            <el-option
                v-for="item in injuryList"
                :key="item.id"
                :label="`${getBodyPartText(item.bodyPartMask)} - ${getInjuryStatusText(item.status)} (${formatDateShort(item.injuredDate)})`"
                :value="item.id"
            />
          </el-select>
          <div class="tip-text">选择本次运动感到不适关联的伤病记录</div>
        </el-form-item>

        <!-- 方案ID隐藏字段 -->
        <el-form-item v-if="form.planId" label="所属方案">
          <el-input :value="getPlanName(form.planId)" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted, computed} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import request from '@/utils/request.js'

const loading = ref(false)
const recordList = ref([])

// 日期范围默认最近7天
const today = new Date()
today.setHours(0, 0, 0, 0)
const sevenDaysAgo = new Date(today)
sevenDaysAgo.setDate(today.getDate() - 7)

const query = reactive({
  startDate: sevenDaysAgo,
  endDate: today
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

// 表单数据
const form = reactive({
  id: null,
  exerciseId: null,
  completionDate: null,
  status: 0,
  actualSets: null,
  actualReps: null,
  actualDuration: null,
  actualDistance: null,
  actualCalories: null,
  planId: null,
  unwellFlag: false,
  injuryId: null
})

// 运动项目下拉相关
const fullExerciseOptions = ref([])       // 全部运动项目
const currentExerciseOptions = ref([])    // 当前显示的下拉选项
const exerciseNameMap = ref({})
const exerciseDetailMap = ref({})
const exerciseLoading = ref(false)

// 方案运动项目缓存（存储 schemeId 和对应运动列表）
const planExerciseCache = ref(new Map())

// 伤病列表
const injuryList = ref([])

// 方案相关
const planList = ref([])
const pendingPlanWorkout = ref(null)

const rules = {
  exerciseId: [{required: true, message: '请选择运动项目', trigger: 'change'}],
  completionDate: [{required: true, message: '请选择完成日期', trigger: 'change'}],
  status: [{required: true, message: '请选择状态', trigger: 'change'}]
}

const hasPendingPlanWorkout = computed(() => !!pendingPlanWorkout.value)

// ---------- 辅助函数 ----------
const bodyPartMap = {1: '头', 2: '手', 4: '脚', 8: '肩', 16: '脖', 32: '胯', 64: '身子', 128: '内脏', 256: '骨'}
const getBodyPartText = (mask) => {
  if (!mask) return '-'
  const parts = []
  for (const [val, text] of Object.entries(bodyPartMap)) {
    if (mask & parseInt(val)) parts.push(text)
  }
  return parts.join(',') || '-'
}
const getInjuryStatusText = (status) => {
  const map = {0: '治疗中', 1: '恢复中', 2: '已痊愈'}
  return map[status] || '未知'
}
const formatDateShort = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}
const handleUnwellChange = (val) => {
  if (!val) form.injuryId = null
}

const getExerciseName = (id) => exerciseNameMap.value[id] || `运动${id}`
const getPlanName = (planId) => {
  const plan = planList.value.find(p => p.id === planId)
  return plan ? plan.planName : ''
}

// 加载全部运动项目（用于自定义添加和编辑）
const loadAllExercises = async () => {
  if (fullExerciseOptions.value.length > 0) return
  exerciseLoading.value = true
  try {
    const res = await request.post('/exercise/search', {page: 1, size: 100})
    if (res.data.code === 200) {
      const exercises = res.data.data.records || []
      fullExerciseOptions.value = exercises
      exercises.forEach(ex => {
        exerciseNameMap.value[ex.id] = ex.exerciseName
        exerciseDetailMap.value[ex.id] = ex
      })
    } else {
      ElMessage.error('加载运动项目失败')
    }
  } catch (error) {
    console.error('加载运动项目失败', error)
    ElMessage.error('加载运动项目失败，请刷新页面重试')
  } finally {
    exerciseLoading.value = false
  }
}

// 加载指定方案的运动项目列表（用于方案内记录）
const loadPlanExercises = async (planId) => {
  if (planExerciseCache.value.has(planId)) {
    currentExerciseOptions.value = planExerciseCache.value.get(planId)
    return
  }
  exerciseLoading.value = true
  try {
    const res = await request.get(`/user/plan-day-detail/list/${planId}`)
    if (res.data.code === 200) {
      const details = res.data.data || []
      const exerciseIds = [...new Set(details.map(d => d.exerciseId))]
      const planExercises = []
      for (const exId of exerciseIds) {
        // 优先从已加载的详情中获取，否则请求
        let ex = exerciseDetailMap.value[exId]
        if (!ex) {
          const exRes = await request.get(`/exercise/${exId}`)
          if (exRes.data.code === 200) {
            ex = exRes.data.data
            exerciseNameMap.value[ex.id] = ex.exerciseName
            exerciseDetailMap.value[ex.id] = ex
          }
        }
        if (ex) {
          planExercises.push({id: ex.id, exerciseName: ex.exerciseName})
        }
      }
      planExerciseCache.value.set(planId, planExercises)
      currentExerciseOptions.value = planExercises
    } else {
      currentExerciseOptions.value = []
    }
  } catch (error) {
    console.error('加载方案运动项目失败', error)
    ElMessage.error('加载方案运动项目失败')
    currentExerciseOptions.value = []
  } finally {
    exerciseLoading.value = false
  }
}

// 选择运动项目后自动填充默认值
const onExerciseChange = (exerciseId) => {
  const detail = exerciseDetailMap.value[exerciseId]
  if (!detail) return
  form.actualSets = detail.sets !== null ? detail.sets : null
  form.actualReps = detail.reps !== null ? detail.reps : null
  if (detail.durationPerSet && detail.sets) {
    form.actualDuration = detail.durationPerSet * detail.sets
  } else if (detail.durationPerSet) {
    form.actualDuration = detail.durationPerSet
  } else {
    form.actualDuration = null
  }
  form.actualDistance = detail.distance !== null ? detail.distance : null
  form.actualCalories = null
}

// 获取伤病列表
const fetchInjuries = async () => {
  try {
    const res = await request.get('/user/injury/list')
    if (res.data.code === 200) injuryList.value = res.data.data || []
  } catch {
  }
}

// 获取所有方案列表
const fetchPlans = async () => {
  try {
    const res = await request.get('/user/plan/list')
    if (res.data.code === 200) planList.value = res.data.data || []
  } catch {
  }
}

// 查找待记录的方案运动日
const checkPendingPlanWorkout = async () => {
  await fetchPlans()
  const recordRes = await request.post('/user/workout-record/search', {page: 1, size: 1000})
  const existingRecords = (recordRes.data.code === 200 && recordRes.data.data.records) ? recordRes.data.data.records : []
  const recordedSet = new Set()
  existingRecords.forEach(rec => {
    if (rec.status === 0) {
      recordedSet.add(`${rec.completionDate}_${rec.exerciseId}`)
    }
  })

  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  for (const plan of planList.value) {
    const detailRes = await request.get(`/user/plan-day-detail/list/${plan.id}`)
    if (detailRes.data.code !== 200) continue
    const details = detailRes.data.data || []
    const dayMap = new Map()
    details.forEach(d => {
      if (!dayMap.has(d.dayNumber)) dayMap.set(d.dayNumber, [])
      dayMap.get(d.dayNumber).push(d)
    })
    const startDate = new Date(plan.startDate)
    const pendingDays = []
    for (let [dayNum, dayDetails] of dayMap.entries()) {
      const targetDate = new Date(startDate)
      targetDate.setDate(startDate.getDate() + dayNum - 1)
      targetDate.setHours(0, 0, 0, 0)
      if (targetDate > todayDate) continue
      let allRecorded = true
      for (const detail of dayDetails) {
        const key = `${targetDate.toISOString().split('T')[0]}_${detail.exerciseId}`
        if (!recordedSet.has(key)) {
          allRecorded = false
          break
        }
      }
      if (!allRecorded) {
        pendingDays.push({dayNum, targetDate, details: dayDetails})
      }
    }
    if (pendingDays.length > 0) {
      pendingDays.sort((a, b) => a.dayNum - b.dayNum)
      const nearest = pendingDays[0]
      let targetDetail = null
      for (const detail of nearest.details) {
        const exRes = await request.get(`/exercise/${detail.exerciseId}`)
        if (exRes.data.code === 200) {
          const categoryMask = exRes.data.data.categoryMask || 0
          if (!(categoryMask & 16) && !(categoryMask & 32)) {
            targetDetail = detail
            break
          }
        }
      }
      if (!targetDetail) targetDetail = nearest.details[0]
      pendingPlanWorkout.value = {
        planId: plan.id,
        exerciseId: targetDetail.exerciseId,
        dayNumber: nearest.dayNum,
        completionDate: nearest.targetDate
      }
      return
    }
  }
  pendingPlanWorkout.value = null
}

// 确保全局运动列表已加载
const ensureFullExercisesLoaded = async () => {
  if (fullExerciseOptions.value.length === 0) {
    await loadAllExercises()
  }
}

// 显示方案内记录对话框
const showPlanWorkoutDialog = async () => {
  if (!pendingPlanWorkout.value) {
    ElMessage.warning('当前没有待记录的方案运动日')
    return
  }
  const planId = pendingPlanWorkout.value.planId
  // 加载方案内的运动项目列表
  await loadPlanExercises(planId)
  if (currentExerciseOptions.value.length === 0) {
    ElMessage.warning('该方案无运动项目，无法添加记录')
    return
  }
  resetForm()
  form.planId = planId
  form.exerciseId = pendingPlanWorkout.value.exerciseId
  form.completionDate = pendingPlanWorkout.value.completionDate
  form.status = 0
  onExerciseChange(form.exerciseId)
  isEdit.value = false
  dialogTitle.value = '添加方案内运动记录'
  dialogVisible.value = true
}

// 自定义添加（使用全部运动项目）
const showCustomAddDialog = async () => {
  await ensureFullExercisesLoaded()
  resetForm()
  form.planId = null
  currentExerciseOptions.value = fullExerciseOptions.value
  isEdit.value = false
  dialogTitle.value = '添加自定义记录'
  dialogVisible.value = true
}

// 编辑记录（使用全部运动项目）
const showEditDialog = async (row) => {
  await ensureFullExercisesLoaded()
  resetForm()
  isEdit.value = true
  dialogTitle.value = '编辑运动记录'
  Object.assign(form, {
    id: row.id,
    exerciseId: row.exerciseId,
    completionDate: row.completionDate,
    status: row.status,
    actualSets: row.actualSets,
    actualReps: row.actualReps,
    actualDuration: row.actualDuration,
    actualDistance: row.actualDistance,
    actualCalories: row.actualCalories,
    planId: row.planId,
    unwellFlag: !!row.injuryId,
    injuryId: row.injuryId || null
  })
  currentExerciseOptions.value = fullExerciseOptions.value
  dialogVisible.value = true
}

// 对话框关闭时清空动态选项（避免下次打开时残留）
const onDialogClosed = () => {
  currentExerciseOptions.value = []
}

const resetForm = () => {
  form.id = null
  form.exerciseId = null
  form.completionDate = new Date()
  form.status = 0
  form.actualSets = null
  form.actualReps = null
  form.actualDuration = null
  form.actualDistance = null
  form.actualCalories = null
  form.planId = null
  form.unwellFlag = false
  form.injuryId = null
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const payload = {
      exerciseId: form.exerciseId,
      completionDate: new Date(form.completionDate).toISOString().split('T')[0],
      status: form.status,
      actualSets: form.actualSets,
      actualReps: form.actualReps,
      actualDuration: form.actualDuration,
      actualDistance: form.actualDistance,
      actualCalories: form.actualCalories,
      planId: form.planId || null,
      injuryId: form.unwellFlag ? form.injuryId : null
    }
    let res
    if (isEdit.value) {
      res = await request.put(`/user/workout-record/update/${form.id}`, payload)
    } else {
      res = await request.post('/user/workout-record/add', payload)
    }
    if (res.data.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      fetchRecords()
      await checkPendingPlanWorkout()
      // 通知首页刷新今日提醒
      window.dispatchEvent(new CustomEvent('workout-record-changed'))
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 获取记录列表
const fetchRecords = async () => {
  loading.value = true
  try {
    const params = {page: 1, size: 100}
    if (query.startDate) params.startDate = new Date(query.startDate).toISOString().split('T')[0]
    if (query.endDate) params.endDate = new Date(query.endDate).toISOString().split('T')[0]
    const res = await request.post('/user/workout-record/search', params)
    if (res.data.code === 200) {
      recordList.value = res.data.data.records || []
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('获取记录失败')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  const todayReset = new Date()
  todayReset.setHours(0, 0, 0, 0)
  const sevenDaysAgoReset = new Date(todayReset)
  sevenDaysAgoReset.setDate(todayReset.getDate() - 7)
  query.startDate = sevenDaysAgoReset
  query.endDate = todayReset
  fetchRecords()
}

const deleteRecord = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该记录吗？', '提示', {type: 'warning'})
    const res = await request.delete(`/user/workout-record/delete/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchRecords()
      await checkPendingPlanWorkout()
      window.dispatchEvent(new CustomEvent('workout-record-changed'))
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
  }
}

onMounted(async () => {
  await loadAllExercises()
  await fetchInjuries()
  await checkPendingPlanWorkout()
  await fetchRecords()
})
</script>

<style scoped>
.workout-page {
  max-width: 1400px;
  margin: 0 auto;
}

.record-card {
  border-radius: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.header-buttons {
  display: flex;
  gap: 12px;
}

.filter-form {
  margin-bottom: 16px;
}

.tip-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>