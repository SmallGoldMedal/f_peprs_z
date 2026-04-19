<template>
  <div class="dashboard">
    <el-card class="welcome-card" shadow="hover">
      <h2>欢迎回来，{{ displayName }}</h2>
    </el-card>

    <el-card v-if="hasActiveAdoptedPlan" class="info-card" shadow="hover">
      <template #header>
        <div class="card-header">今日提醒</div>
      </template>
      <div v-if="!todayWorkoutCompleted" class="reminder">
        <el-alert title="今日运动流程" type="info" :closable="false">
          <template #default>
            <div v-if="todayPlanDetails.warmups && todayPlanDetails.warmups.length">
              <strong>热身：</strong> {{ todayPlanDetails.warmups.join('、') }}
            </div>
            <div v-if="todayPlanDetails.cores && todayPlanDetails.cores.length">
              <strong>核心运动：</strong> {{ todayPlanDetails.cores.join('、') }}
            </div>
            <div v-if="todayPlanDetails.cooldowns && todayPlanDetails.cooldowns.length">
              <strong>放松：</strong> {{ todayPlanDetails.cooldowns.join('、') }}
            </div>
            <div v-if="!todayPlanDetails.warmups && !todayPlanDetails.cores && !todayPlanDetails.cooldowns">
              请查看方案详情
            </div>
          </template>
        </el-alert>
      </div>
      <div v-else class="no-reminder">
        <el-icon><SuccessFilled /></el-icon>
        <span>今日运动已完成，继续保持！</span>
      </div>
    </el-card>

    <el-card class="guide-card" shadow="hover">
      <template #header>
        <div class="card-header">使用指引</div>
      </template>
      <div class="guide-steps">
        <div class="guide-step">
          <div class="step-info">
            <div class="step-num">1</div>
            <div class="step-desc">
              <strong>完善个人资料</strong>
              <p>填写身高、体重、运动目标等，让推荐更精准</p>
            </div>
          </div>
          <el-button type="primary" size="small" @click="goToProfile">去完善</el-button>
        </div>
        <div class="guide-step">
          <div class="step-info">
            <div class="step-num">2</div>
            <div class="step-desc">
              <strong>生成运动方案</strong>
              <p>选择运动天数、环境、器械，获取健身运动方案</p>
            </div>
          </div>
          <el-button type="primary" size="small" @click="goToPlan">去生成</el-button>
        </div>
        <div class="guide-step">
          <div class="step-info">
            <div class="step-num">3</div>
            <div class="step-desc">
              <strong>记录运动数据</strong>
              <p>完成运动后及时记录，系统会动态调整后续方案</p>
            </div>
          </div>
          <el-button type="primary" size="small" @click="goToRecords">去记录</el-button>
        </div>
        <div class="guide-step guide-step-flex">
          <div class="step-info">
            <div class="step-num">4</div>
            <div class="step-desc">
              <strong>评价反馈</strong>
              <p>为运动项目或已完成方案打分，帮助系统优化推荐</p>
            </div>
          </div>
          <div class="step-actions">
            <el-button type="success" size="small" @click="openExerciseRatingDialog">评价运动项目</el-button>
            <el-button type="success" size="small" @click="openPlanRatingDialog">评价方案</el-button>
          </div>
        </div>
        <div class="guide-step">
          <div class="step-info">
            <div class="step-num">5</div>
            <div class="step-desc">
              <strong>伤病记录</strong>
              <p>记录伤病情况，系统将自动避开不适部位</p>
            </div>
          </div>
          <el-button type="primary" size="small" @click="goToInjury">去记录</el-button>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="exerciseRatingDialogVisible" title="评价运动项目" width="500px" destroy-on-close>
      <el-form :model="exerciseRatingForm" :rules="exerciseRatingRules" ref="exerciseRatingFormRef" label-width="100px">
        <el-form-item label="运动项目" prop="exerciseId">
          <el-select v-model="exerciseRatingForm.exerciseId" filterable placeholder="请选择运动项目">
            <el-option v-for="ex in exerciseList" :key="ex.id" :label="`${ex.exerciseName} (${getCategoryName(ex.categoryMask)})`" :value="ex.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="评分 (1-10)" prop="rating">
          <el-slider v-model="exerciseRatingForm.rating" :min="1" :max="10" show-stops :marks="{1:'1',5:'5',10:'10'}" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exerciseRatingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExerciseRating" :loading="ratingLoading">提交评分</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="planRatingDialogVisible" title="评价运动方案" width="500px" destroy-on-close>
      <el-form :model="planRatingForm" :rules="planRatingRules" ref="planRatingFormRef" label-width="100px">
        <el-form-item label="选择方案" prop="planId">
          <el-select v-model="planRatingForm.planId" filterable placeholder="请选择方案">
            <el-option v-for="plan in userPlans" :key="plan.id" :label="`${plan.planName} (${plan.startDate} ~ ${plan.endDate})`" :value="plan.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="方案评分 (1-10)" prop="planScore">
          <el-slider v-model="planRatingForm.planScore" :min="1" :max="10" show-stops :marks="{1:'1',5:'5',10:'10'}" />
        </el-form-item>
        <el-form-item label="文字反馈" prop="feedback">
          <el-input type="textarea" v-model="planRatingForm.feedback" rows="3" placeholder="说说你对这个方案的感受..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planRatingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPlanRating" :loading="planRatingLoading">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { SuccessFilled } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const displayName = computed(() => userStore.displayName)

const hasActiveAdoptedPlan = ref(false)
const todayWorkoutCompleted = ref(false)
const todayPlanDetails = ref({ warmups: [], cores: [], cooldowns: [] })

const exerciseList = ref([])
const userPlans = ref([])
const exerciseRatingDialogVisible = ref(false)
const planRatingDialogVisible = ref(false)
const ratingLoading = ref(false)
const planRatingLoading = ref(false)
const exerciseRatingFormRef = ref(null)
const planRatingFormRef = ref(null)

const exerciseRatingForm = ref({ exerciseId: null, rating: 5 })
const exerciseRatingRules = { exerciseId: [{ required: true, message: '请选择运动项目', trigger: 'change' }], rating: [{ required: true, message: '请选择评分', trigger: 'change' }] }

const planRatingForm = ref({ planId: null, planScore: 5, feedback: '' })
const planRatingRules = { planId: [{ required: true, message: '请选择方案', trigger: 'change' }], planScore: [{ required: true, message: '请选择评分', trigger: 'change' }] }

const getCategoryName = (mask) => {
  const map = { 1: '有氧', 2: '力量', 4: '柔韧', 8: '平衡', 16: '热身', 32: '放松' }
  if (!mask) return '其他'
  for (const [val, name] of Object.entries(map)) if (mask & parseInt(val)) return name
  return '其他'
}

const checkActiveAdoptedPlan = async () => {
  try {
    const res = await request.get('/plan/list')
    if (res.data.code !== 200) return
    const plans = res.data.data.records || []
    const today = dayjs().format('YYYY-MM-DD')
    // 状态为已采纳(1)或进行中(2)且未完成(3)
    const activeAdopted = plans.filter(p => (p.status === 1 || p.status === 2) && p.startDate <= today && dayjs(p.startDate).add(p.durationDays - 1, 'day').format('YYYY-MM-DD') >= today)
    hasActiveAdoptedPlan.value = activeAdopted.length > 0
    if (hasActiveAdoptedPlan.value) await fetchTodayPlanDetails(activeAdopted[0])
  } catch (error) {
    console.error(error)
    hasActiveAdoptedPlan.value = false
  }
}

const fetchTodayPlanDetails = async (activePlan) => {
  try {
    const res = await request.get(`/plan/${activePlan.id}`)
    if (res.data.code === 200) {
      const planData = res.data.data
      const details = planData.details || []
      const today = dayjs().format('YYYY-MM-DD')
      const todayNum = dayjs(today).diff(dayjs(activePlan.startDate), 'day') + 1
      const todayDetails = details.filter(d => d.dayNumber === todayNum).sort((a,b) => a.orderIndex - b.orderIndex)
      const exercisesRes = await request.post('/exercise/search', { page: 1, size: 100 })
      const exMap = new Map()
      if (exercisesRes.data.code === 200) {
        (exercisesRes.data.data.records || []).forEach(e => exMap.set(e.id, e))
      }
      const warmups = [], cores = [], cooldowns = []
      todayDetails.forEach(d => {
        const ex = exMap.get(d.exerciseId)
        if (!ex) return
        if (ex.categoryMask & 16) warmups.push(ex.exerciseName)
        else if (ex.categoryMask & 32) cooldowns.push(ex.exerciseName)
        else cores.push(ex.exerciseName)
      })
      todayPlanDetails.value = { warmups, cores, cooldowns }
    }
  } catch (error) {
    console.error('获取今日方案明细失败', error)
  }
}

const checkTodayWorkout = async () => {
  if (!hasActiveAdoptedPlan.value) return
  const today = dayjs().format('YYYY-MM-DD')
  try {
    const res = await request.get('/record/list', { params: { page: 1, size: 10, completionDate: today } })
    if (res.data.code === 200) {
      const records = res.data.data.records || []
      todayWorkoutCompleted.value = records.some(r => r.completionDate === today && r.workoutRecordStatus === 0)
    } else {
      todayWorkoutCompleted.value = false
    }
  } catch (error) {
    todayWorkoutCompleted.value = false
  }
}

const fetchExerciseListForRating = async () => {
  try {
    const res = await request.post('/exercise/search', { page: 1, size: 100 })
    if (res.data.code === 200) exerciseList.value = res.data.data.records || []
  } catch (error) { console.error(error) }
}

const fetchUserPlansForRating = async () => {
  try {
    const res = await request.get('/plan/list')
    if (res.data.code === 200) {
      const plans = res.data.data.records || []
      plans.forEach(p => {
        p.endDate = dayjs(p.startDate).add(p.durationDays - 1, 'day').format('YYYY-MM-DD')
      })
      userPlans.value = plans
    }
  } catch (error) { console.error(error) }
}

const openExerciseRatingDialog = () => {
  exerciseRatingForm.value = { exerciseId: null, rating: 5 }
  exerciseRatingDialogVisible.value = true
}

const submitExerciseRating = async () => {
  try { await exerciseRatingFormRef.value.validate() } catch { return }
  ratingLoading.value = true
  try {
    const res = await request.post('/rating/submit', {
      exerciseId: exerciseRatingForm.value.exerciseId,
      rating: exerciseRatingForm.value.rating,
      isDefault: 0
    })
    if (res.data.code === 200) {
      ElMessage.success('评分提交成功，感谢反馈！')
      exerciseRatingDialogVisible.value = false
    } else ElMessage.error(res.data.message || '提交失败')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '提交失败')
  } finally {
    ratingLoading.value = false
  }
}

const openPlanRatingDialog = () => {
  if (userPlans.value.length === 0) {
    ElMessage.warning('暂无方案，请先生成方案后再评价')
    return
  }
  planRatingForm.value = { planId: null, planScore: 5, feedback: '' }
  planRatingDialogVisible.value = true
}

const submitPlanRating = async () => {
  try { await planRatingFormRef.value.validate() } catch { return }
  planRatingLoading.value = true
  try {
    const res = await request.post('/plan/feedback', {
      planId: planRatingForm.value.planId,
      planScore: planRatingForm.value.planScore,
      feedback: planRatingForm.value.feedback
    })
    if (res.data.code === 200) {
      ElMessage.success('方案评价提交成功，感谢反馈！')
      planRatingDialogVisible.value = false
    } else ElMessage.error(res.data.message || '提交失败')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '提交失败')
  } finally {
    planRatingLoading.value = false
  }
}

const goToProfile = () => {
  userStore.setCurrentMenu('profile')
  router.push('/home')
}
const goToPlan = () => {
  userStore.setCurrentMenu('plan')
  router.push('/home')
}
const goToRecords = () => {
  userStore.setCurrentMenu('records')
  router.push('/home')
}
const goToInjury = () => {
  userStore.setCurrentMenu('injuries')
  router.push('/home')
}

onMounted(async () => {
  await checkActiveAdoptedPlan()
  if (hasActiveAdoptedPlan.value) await checkTodayWorkout()
  await fetchExerciseListForRating()
  await fetchUserPlansForRating()
})
</script>

<style scoped>
.dashboard { max-width: 1200px; margin: 0 auto; }
.welcome-card, .info-card, .guide-card { margin-bottom: 24px; border-radius: 16px; }
.card-header { font-size: 18px; font-weight: 600; color: #2c5a7a; }
.reminder { padding: 10px 0; }
.no-reminder { display: flex; align-items: center; gap: 12px; color: #67c23a; font-size: 16px; }
.guide-steps { display: flex; flex-direction: column; gap: 20px; }
.guide-step { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8f9fc; border-radius: 12px; transition: all 0.2s; }
.guide-step-flex { flex-wrap: wrap; gap: 12px; }
.guide-step:hover { background: #eef2f6; transform: translateX(4px); }
.step-info { display: flex; align-items: center; gap: 16px; }
.step-num { width: 32px; height: 32px; background: #409eff; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; }
.step-desc strong { font-size: 16px; color: #2c5a7a; }
.step-desc p { margin: 4px 0 0; font-size: 13px; color: #5a7d9a; }
.step-actions { display: flex; gap: 8px; }
</style>