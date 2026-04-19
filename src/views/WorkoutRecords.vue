<template>
  <div class="workout-records">
    <el-card class="records-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span style="margin-left: 8px">添加运动记录</span>
        </div>
      </template>
      
      <el-form
        ref="formRef"
        :model="recordForm"
        :rules="formRules"
        class="record-form"
        label-width="120px"
      >
        <el-form-item label="关联方案" prop="planId">
          <el-select v-model="recordForm.planId" @change="onPlanChange" placeholder="请选择方案">
            <el-option
              v-for="plan in activePlans"
              :key="plan.id"
              :label="plan.planName"
              :value="plan.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="完成日期" prop="completionDate">
          <el-date-picker
            v-model="recordForm.completionDate"
            type="date"
            placeholder="选择日期"
            :disabled-date="disabledDate"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="onCompletionDateChange"
          />
        </el-form-item>
        
        <el-form-item label="运动项目" prop="exerciseId">
          <el-select v-model="recordForm.exerciseId" @change="onExerciseChange" placeholder="请选择运动项目">
            <el-option
              v-for="ex in recordForm.planId === 0 ? allExercises : dayExercises"
              :key="recordForm.planId === 0 ? ex.id : ex.exerciseId"
              :label="recordForm.planId === 0 ? ex.exerciseName : allExercises.find(e => e.id === ex.exerciseId)?.exerciseName"
              :value="recordForm.planId === 0 ? ex.id : ex.exerciseId"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="执行状态" prop="workoutRecordStatus">
          <el-radio-group v-model="recordForm.workoutRecordStatus">
            <el-radio :label="0">完成</el-radio>
            <el-radio :label="1">部分完成</el-radio>
            <el-radio :label="2">未完成</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="实际时长(分钟)">
          <el-input-number v-model="recordForm.actualDuration" :min="1" :max="300" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="预估消耗(卡路里)">
          <el-input v-model="recordForm.actualCalories" readonly />
          <div class="form-tip">系统根据运动类型、强度和您的体重自动计算</div>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="recordForm.discomfortFlag">运动过程中感到不适</el-checkbox>
        </el-form-item>
        
        <el-form-item v-if="recordForm.discomfortFlag" label="不适相关伤病">
          <el-input v-model="recordForm.discomfortInjuryName" placeholder="请输入伤病名称" />
          <div class="form-tip">请先在“伤病记录”中添加伤病，然后关联</div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitRecord" :loading="submitting">
            提交记录
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="history-card" shadow="hover" style="margin-top: 24px">
      <template #header>
        <div class="card-header">
          <el-icon><Clock /></el-icon>
          <span style="margin-left: 8px">最近运动记录</span>
        </div>
      </template>
      
      <el-empty v-if="recentRecords.length === 0" description="暂无运动记录" />
      
      <el-table v-else :data="recentRecords" style="width: 100%">
        <el-table-column prop="completionDate" label="完成日期" width="150" />
        <el-table-column prop="exerciseName" label="运动项目" />
        <el-table-column prop="actualDuration" label="时长(分钟)" width="120" />
        <el-table-column prop="actualCalories" label="消耗(卡路里)" width="150" />
        <el-table-column prop="workoutRecordStatus" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.workoutRecordStatus === 0 ? 'success' : scope.row.workoutRecordStatus === 1 ? 'warning' : 'danger'">
              {{ scope.row.workoutRecordStatus === 0 ? '完成' : scope.row.workoutRecordStatus === 1 ? '部分完成' : '未完成' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button type="text" size="small" @click="openExerciseRating(scope.row.exerciseId)">
              评价
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import { Document, Clock } from '@element-plus/icons-vue'

const userStore = useUserStore()
const formRef = ref(null)
const submitting = ref(false)
const loadingHistory = ref(false)

const activePlans = ref([])
const allExercises = ref([])
const planDetailsMap = ref(new Map())
const dayExercises = ref([])

const selectedCategory = ref(0)
const filteredExercises = computed(() => {
  let list = allExercises.value
  if (selectedCategory.value && selectedCategory.value !== 0) {
    list = list.filter(ex => (ex.categoryMask & selectedCategory.value) !== 0)
  }
  return list
})

const recordForm = reactive({
  planId: 0,
  completionDate: '',
  exerciseId: null,
  actualDuration: null,
  actualCalories: null,
  workoutRecordStatus: 0,
  discomfortFlag: false,
  injuryId: null,
  discomfortInjuryName: ''
})

const formRules = {
  planId: [{ required: true, message: '请选择关联方案', trigger: 'change' }],
  completionDate: [{ required: true, message: '请选择完成日期', trigger: 'change' }],
  exerciseId: [{ required: true, message: '请选择运动项目', trigger: 'change' }],
  workoutRecordStatus: [{ required: true, message: '请选择执行状态', trigger: 'change' }]
}

const getCategoryName = (mask) => {
  const map = {1: '有氧', 2: '力量', 4: '柔韧', 8: '平衡'}
  if (!mask) return '其他'
  for (const [val, name] of Object.entries(map)) if (mask & parseInt(val)) return name
  return '其他'
}

const fetchActivePlans = async () => {
  if (userStore.isGuest) return
  try {
    const res = await request.get('/plan/list')
    if (res.data.code === 200) {
      const plans = res.data.data.records || []
      const today = dayjs().format('YYYY-MM-DD')
      const active = plans.filter(p => p.status !== 3 && p.startDate <= today && (p.endDate || p.startDate) >= today)
      active.sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
      activePlans.value = active
      if (active.length > 0 && recordForm.planId === 0) {
        recordForm.planId = active[0].id
        await onPlanChange(active[0].id)
      }
    }
  } catch (error) {
    console.error('获取方案列表失败', error)
  }
}

const fetchAllExercises = async () => {
  if (userStore.isGuest) return
  try {
    const res = await request.post('/exercise/search', { page: 1, size: 100 })
    if (res.data.code === 200) allExercises.value = res.data.data.records || []
  } catch (error) {
    console.error('获取运动库失败', error)
  }
}

const onPlanChange = async (planId) => {
  recordForm.exerciseId = null
  dayExercises.value = []
  if (planId === 0) {
    planDetailsMap.value.clear()
    recordForm.completionDate = ''
    return
  }
  try {
    const res = await request.get(`/plan/${planId}`)
    if (res.data.code === 200) {
      const plan = res.data.data
      const details = plan.details || []
      const map = new Map()
      for (const d of details) {
        const day = d.dayNumber
        if (!map.has(day)) map.set(day, [])
        map.get(day).push(d)
      }
      planDetailsMap.value = map
      recordForm.completionDate = ''
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('加载方案明细失败')
  }
}

const onCompletionDateChange = async (date) => {
  if (recordForm.planId === 0) return
  if (!date) {
    dayExercises.value = []
    recordForm.exerciseId = null
    return
  }
  const plan = activePlans.value.find(p => p.id === recordForm.planId)
  if (!plan) return
  const startDate = plan.startDate
  const dayNumber = dayjs(date).diff(dayjs(startDate), 'day') + 1
  if (dayNumber < 1 || dayNumber > plan.durationWeeks * 7) {
    ElMessage.warning('完成日期不在方案有效期内')
    dayExercises.value = []
    recordForm.exerciseId = null
    return
  }
  let details = planDetailsMap.value.get(dayNumber) || []
  const filtered = details.filter(d => {
    const ex = allExercises.value.find(e => e.id === d.exerciseId)
    return ex && (ex.categoryMask & 16) === 0 && (ex.categoryMask & 32) === 0
  })
  dayExercises.value = filtered
  if (filtered.length > 0) {
    recordForm.exerciseId = filtered[0].exerciseId
    onExerciseChange(filtered[0].exerciseId)
  } else {
    recordForm.exerciseId = null
  }
}

const onExerciseChange = async (exerciseId) => {
  if (!exerciseId) return
  const exercise = allExercises.value.find(e => e.id === exerciseId)
  if (exercise && exercise.durationMin) {
    recordForm.actualDuration = exercise.durationMin
    const calories = await estimateCalories(exercise, recordForm.actualDuration)
    recordForm.actualCalories = calories
  } else {
    recordForm.actualCalories = null
  }
}

const estimateCalories = async (exercise, durationMinutes) => {
  let weight = 70
  try {
    const res = await request.get('/user/info')
    if (res.data.code === 200 && res.data.data.weight) weight = res.data.data.weight
  } catch (error) {}
  let met = 5.0
  if (exercise.categoryMask & 1) {
    if (exercise.intensity === 2) met = 8.0
    else if (exercise.intensity === 1) met = 6.0
    else met = 4.0
  } else if (exercise.categoryMask & 2) {
    if (exercise.intensity === 2) met = 6.0
    else if (exercise.intensity === 1) met = 4.5
    else met = 3.5
  } else if (exercise.categoryMask & 4) met = 2.5
  else if (exercise.categoryMask & 8) met = 3.0
  return Math.round(met * weight * (durationMinutes / 60))
}

const disabledDate = (time) => time > new Date()

const submitRecord = async () => {
  try {
    await formRef.value.validate()
  } catch { return }
  if (recordForm.planId === 0) {
    ElMessage.warning('请选择有效方案')
    return
  }
  let injuryId = null
  if (recordForm.discomfortFlag && recordForm.discomfortInjuryName) {
    // 先尝试创建伤病记录（简化：这里不自动创建，由用户先录入伤病）
    ElMessage.warning('感到不适请先在“伤病记录”中添加伤病，然后关联')
    return
  }
  const payload = {
    planId: recordForm.planId,
    completionDate: recordForm.completionDate,
    workoutRecordStatus: recordForm.workoutRecordStatus,
    actualDuration: recordForm.actualDuration,
    actualCalories: recordForm.actualCalories,
    discomfortFlag: recordForm.discomfortFlag ? 1 : 0,
    injuryId: injuryId
  }
  submitting.value = true
  try {
    const res = await request.post('/record/add', payload)
    if (res.data.code === 200) {
      ElMessage.success('运动记录添加成功')
      resetForm()
      fetchRecentRecords()
      if (recordForm.planId !== 0 && recordForm.completionDate) await onCompletionDateChange(recordForm.completionDate)
    } else ElMessage.error(res.data.message || '添加失败')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '网络错误')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  recordForm.planId = activePlans.value.length > 0 ? activePlans.value[0].id : 0
  recordForm.completionDate = dayjs().format('YYYY-MM-DD')
  recordForm.exerciseId = null
  recordForm.actualDuration = null
  recordForm.actualCalories = null
  recordForm.workoutRecordStatus = 0
  recordForm.discomfortFlag = false
  recordForm.injuryId = null
  recordForm.discomfortInjuryName = ''
  selectedCategory.value = 0
  if (recordForm.planId !== 0) {
    onPlanChange(recordForm.planId).then(() => onCompletionDateChange(recordForm.completionDate))
  } else dayExercises.value = []
  formRef.value?.clearValidate()
}

const recentRecords = ref([])
const fetchRecentRecords = async () => {
  if (userStore.isGuest) return
  loadingHistory.value = true
  try {
    const res = await request.get('/record/list', { params: { page: 1, size: 5 } })
    if (res.data.code === 200) recentRecords.value = res.data.data.records || []
  } catch (error) {
    console.error('获取历史记录失败', error)
  } finally {
    loadingHistory.value = false
  }
}

const openExerciseRating = async (exerciseId) => {
  if (!exerciseId) return
  if (userStore.isGuest) {
    ElMessage.warning('请登录后评价运动项目')
    return
  }
  if (userStore.isAdmin) {
    ElMessage.warning('管理员无法评价')
    return
  }
  try {
    const { value: rating } = await ElMessageBox.prompt('请输入评分(1-10)', '评价运动项目', {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputPattern: /^[1-9]|10$/,
      inputErrorMessage: '请输入1-10的数字'
    })
    const res = await request.post('/rating/submit', { exerciseId, rating: parseInt(rating), isDefault: 0 })
    if (res.data.code === 200) {
      ElMessage.success('评分成功')
      await fetchRecentRecords()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('评分失败')
  }
}

onMounted(async () => {
  if (!userStore.isGuest) {
    await fetchAllExercises()
    await fetchActivePlans()
    recordForm.completionDate = dayjs().format('YYYY-MM-DD')
    resetForm()
    await fetchRecentRecords()
  } else {
    ElMessage.warning('游客模式无法记录运动，请登录后使用')
  }
})
</script>

<style scoped>
.workout-records {
  max-width: 1200px;
  margin: 0 auto;
}

.records-card, .history-card {
  border-radius: 16px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
  color: #2c5a7a;
}

.record-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.exercise-selector {
  display: flex;
  align-items: center;
  width: 100%;
}
</style>