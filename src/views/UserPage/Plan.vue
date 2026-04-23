// 文件位置：C:\Users\12243\Desktop\f_peprs_z\src\views\UserPage\Plan.vue
<template>
  <div class="plan-page">
    <el-card class="plan-card">
      <template #header>
        <div class="card-header">
          <span>我的运动方案</span>
          <el-button type="primary" @click="showGenerateDialog">生成新方案</el-button>
        </div>
      </template>

      <el-table
          :data="planList"
          row-key="id"
          :expand-row-keys="expandedRowKeys"
          @expand-change="handleExpandChange"
          v-loading="loading"
          stripe
      >
        <!-- 展开列：每天单独一个表格，每个项目一行 -->
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <div v-if="row.purpose === 1" class="daily-target-info">
                每日减脂目标：{{ getDailyTargetCalories(row) }} kcal
              </div>
              <div v-for="day in row.groupedDetails" :key="day.dayNumber" class="day-group">
                <div class="day-title">第 {{ day.dayNumber }} 天</div>
                <el-table :data="day.items" border size="small" class="day-table">
                  <el-table-column label="序号" width="60">
                    <template #default="{ $index }">{{ $index + 1 }}</template>
                  </el-table-column>
                  <el-table-column label="运动项目" min-width="300">
                    <template #default="{ row: item }">
                      <span class="exercise-name">{{ item.exerciseName }}</span>
                      <span class="exercise-attrs">
                        <template v-if="item.exerciseDuration"> {{ item.exerciseDuration }}分钟</template>
                        <template v-if="item.distance"> {{ item.distance }}km</template>
                        <template v-if="item.sets"> {{ item.sets }}组</template>
                        <template v-if="item.reps"> {{ item.reps }}次</template>
                        <template v-if="item.frequency"> {{ item.frequency }}次/分</template>
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="estimatedCalories" label="预估消耗(kcal)" width="120" />
                </el-table>
                <div class="day-total">当日总消耗：{{ day.totalCalories }} kcal</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="planName" label="方案名称" />
        <el-table-column label="开始日期" width="120">
          <template #default="{ row }">{{ formatDate(row.startDate) }}</template>
        </el-table-column>
        <el-table-column label="锻炼天数" width="80">
          <template #default="{ row }">{{ row.durationDays }}天</template>
        </el-table-column>
        <el-table-column label="结束日期" width="120">
          <template #default="{ row }">{{ getEndDate(row) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预估消耗" width="120">
          <template #default="{ row }">{{ row.estimatedCalories || 0 }} kcal</template>
        </el-table-column>
        <el-table-column v-if="hasFatLossPlan" label="每日目标" width="120">
          <template #default="{ row }">
            <span v-if="row.purpose === 1">{{ getDailyTargetCalories(row) }} kcal</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="已消耗" width="100">
          <template #default="{ row }">{{ row.consumedCalories || 0 }} kcal</template>
        </el-table-column>
        <el-table-column label="评分" width="80">
          <template #default="{ row }">{{ row.planScore || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="toggleExpand(row)">
              {{ expandedRowKeys.includes(row.id) ? '收起' : '展开' }}
            </el-button>
            <el-button v-if="!isAdopted(row)" link type="success" @click="adoptPlan(row)">采纳</el-button>
            <span v-else class="adopted-text">已采纳</span>
            <el-button v-if="isPlanExpired(row)" link type="warning" @click="showFeedback(row)">评价</el-button>
            <el-button link type="danger" @click="deletePlan(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 生成方案对话框 -->
    <el-dialog v-model="generateVisible" title="生成新方案" width="600px" destroy-on-close>
      <el-form :model="generateForm" :rules="generateRules" ref="generateFormRef" label-width="120px">
        <el-form-item label="方案名" prop="planName">
          <el-input v-model="generateForm.planName" placeholder="例如：减脂计划" />
        </el-form-item>
        <el-form-item label="锻炼安排" prop="planType">
          <el-radio-group v-model="generateForm.planType">
            <el-radio :label="0">全天安排</el-radio>
            <el-radio :label="1">间隔安排</el-radio>
            <el-radio :label="2">每周固定天</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker v-model="generateForm.startDate" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="锻炼天数" prop="durationDays">
          <el-input-number v-model="generateForm.durationDays" :min="1" :max="364" />
        </el-form-item>
        <el-form-item v-if="generateForm.planType === 1" label="间隔天数" prop="intervalDays">
          <el-input-number v-model="generateForm.intervalDays" :min="1" :max="30" />
          <span class="tip">（每隔几天运动一次）</span>
        </el-form-item>
        <el-form-item v-if="generateForm.planType === 2" label="锻炼日" prop="weeklyDaysMask">
          <el-checkbox-group @change="updateWeeklyMask">
            <el-checkbox :label="1">周一</el-checkbox>
            <el-checkbox :label="2">周二</el-checkbox>
            <el-checkbox :label="4">周三</el-checkbox>
            <el-checkbox :label="8">周四</el-checkbox>
            <el-checkbox :label="16">周五</el-checkbox>
            <el-checkbox :label="32">周六</el-checkbox>
            <el-checkbox :label="64">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="目标" prop="purpose">
          <el-select v-model="generateForm.purpose">
            <el-option label="减肥减脂" :value="1" />
            <el-option label="增肌" :value="2" />
            <el-option label="提高耐力" :value="3" />
            <el-option label="提高柔韧性" :value="4" />
            <el-option label="保持身体健康" :value="5" />
            <el-option label="排解压力" :value="6" />
            <el-option label="增强平衡" :value="7" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="generateForm.purpose === 1" label="减脂量(kg)" prop="loseWeightValue">
          <el-input-number v-model="generateForm.loseWeightValue" :min="0" :step="0.5" :default="1" />
        </el-form-item>
        <el-form-item label="环境" prop="environmentMask">
          <el-checkbox-group v-model="envCheckedList" @change="handleEnvChange">
            <el-checkbox :label="1">居家</el-checkbox>
            <el-checkbox :label="2">健身房</el-checkbox>
            <el-checkbox :label="4">户外</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="经验" prop="experience">
          <el-radio-group v-model="generateForm.experience">
            <el-radio :label="0">没经验</el-radio>
            <el-radio :label="1">经验较少</el-radio>
            <el-radio :label="2">经验丰富</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="工具设备" prop="equipment">
          <el-input v-model="generateForm.equipment" placeholder="例如：瑜伽垫、哑铃" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateVisible = false">取消</el-button>
        <el-button type="primary" @click="submitGenerate" :loading="generating">生成</el-button>
      </template>
    </el-dialog>

    <!-- 评分反馈对话框 -->
    <el-dialog v-model="feedbackVisible" title="方案评分反馈" width="400px">
      <el-form :model="feedbackForm" label-width="100px">
        <el-form-item label="评分(1-10)">
          <el-slider v-model="feedbackForm.planScore" :min="1" :max="10" show-stops />
        </el-form-item>
        <el-form-item label="反馈内容">
          <el-input v-model="feedbackForm.feedback" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="feedbackVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFeedback">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request.js'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const planList = ref([])
const generateVisible = ref(false)
const generating = ref(false)
const generateFormRef = ref(null)
const feedbackVisible = ref(false)
const feedbackForm = reactive({ planScore: 5, feedback: '' })
let currentFeedbackPlanId = null

const expandedRowKeys = ref([])

const hasFatLossPlan = computed(() => planList.value.some(plan => plan.purpose === 1))

const getDailyTargetCalories = (plan) => {
  if (plan.purpose !== 1 || !plan.loseWeightValue || !plan.durationDays) return 0
  return Math.round(plan.loseWeightValue * 7700 / plan.durationDays)
}

const handleExpandChange = (row, expanded) => {
  if (expanded) {
    if (!expandedRowKeys.value.includes(row.id)) {
      expandedRowKeys.value.push(row.id)
      loadPlanDetails(row)
    }
  } else {
    expandedRowKeys.value = expandedRowKeys.value.filter(id => id !== row.id)
  }
}

const toggleExpand = (row) => {
  if (expandedRowKeys.value.includes(row.id)) {
    expandedRowKeys.value = expandedRowKeys.value.filter(id => id !== row.id)
  } else {
    expandedRowKeys.value.push(row.id)
    loadPlanDetails(row)
  }
}

// 将明细转换为每天的项目列表（每个项目一行）
const buildGroupedDetails = (details) => {
  if (!details || !details.length) return []
  const groupMap = new Map()
  details.forEach(detail => {
    const day = detail.dayNumber
    if (!groupMap.has(day)) groupMap.set(day, [])
    groupMap.get(day).push(detail)
  })
  const grouped = []
  for (let [day, items] of groupMap.entries()) {
    items.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
    const totalCalories = items.reduce((sum, i) => sum + (i.estimatedCalories || 0), 0)
    grouped.push({
      dayNumber: day,
      items: items.map(item => ({
        exerciseName: item.exerciseName || `运动${item.exerciseId}`,
        exerciseDuration: item.exerciseDuration,
        distance: item.distance,
        sets: item.sets,
        reps: item.reps,
        frequency: item.frequency,
        estimatedCalories: item.estimatedCalories || 0
      })),
      totalCalories: totalCalories
    })
  }
  grouped.sort((a, b) => a.dayNumber - b.dayNumber)
  return grouped
}

const loadPlanDetails = async (plan) => {
  if (plan.details && plan.details.length) {
    if (!plan.groupedDetails) plan.groupedDetails = buildGroupedDetails(plan.details)
    return
  }
  plan.detailsLoading = true
  try {
    const res = await request.get(`/user/plan-day-detail/list/${plan.id}`)
    if (res.data.code === 200) {
      const details = res.data.data || []
      plan.details = details
      plan.groupedDetails = buildGroupedDetails(details)
    } else {
      plan.details = []
      plan.groupedDetails = []
    }
  } catch {
    plan.details = []
    plan.groupedDetails = []
  } finally {
    plan.detailsLoading = false
  }
}

const isAdopted = (plan) => plan.status === 1
const adoptPlan = async (plan) => {
  try {
    const res = await request.put(`/user/plan/${plan.id}/status`, { status: 1 })
    if (res.data.code === 200) {
      ElMessage.success('已采纳方案')
      fetchPlans()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const isPlanExpired = (plan) => {
  if (!plan.startDate || !plan.durationDays) return false
  const end = new Date(new Date(plan.startDate).getTime() + plan.durationDays * 86400000)
  return new Date() > end
}

const getEndDate = (plan) => {
  if (!plan.startDate || !plan.durationDays) return '-'
  const end = new Date(new Date(plan.startDate).getTime() + plan.durationDays * 86400000)
  return end.toLocaleDateString()
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

const fetchPlans = async () => {
  loading.value = true
  try {
    const res = await request.get('/user/plan/list')
    if (res.data.code === 200) {
      const plans = res.data.data || []
      plans.forEach(p => {
        p.details = []
        p.groupedDetails = []
        p.detailsLoading = false
      })
      planList.value = plans
      expandedRowKeys.value = []
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('获取方案列表失败')
  } finally {
    loading.value = false
  }
}

// 生成方案相关
const envCheckedList = ref([])
const generateForm = reactive({
  planName: '',
  planType: 0,
  startDate: null,
  durationDays: 7,
  intervalDays: null,
  weeklyDaysMask: 0,
  purpose: 1,
  loseWeightValue: 1,
  environmentMask: 0,
  experience: 0,
  equipment: ''
})

const generateRules = {
  planName: [{ required: true, message: '请输入方案名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  durationDays: [{ required: true, message: '请输入锻炼天数' }],
  purpose: [{ required: true, message: '请选择目标' }]
}

const updateWeeklyMask = (vals) => {
  let mask = 0
  vals.forEach(v => mask |= v)
  generateForm.weeklyDaysMask = mask
}

const handleEnvChange = (vals) => {
  let mask = 0
  vals.forEach(v => mask |= v)
  generateForm.environmentMask = mask
}

const resetGenerateForm = () => {
  generateForm.planName = ''
  generateForm.planType = 0
  generateForm.startDate = new Date()
  generateForm.durationDays = 7
  generateForm.intervalDays = null
  generateForm.weeklyDaysMask = 0
  generateForm.purpose = 1
  generateForm.loseWeightValue = 1
  generateForm.environmentMask = 0
  generateForm.experience = 0
  generateForm.equipment = ''
  envCheckedList.value = []
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const username = userStore.username || 'user'
  generateForm.planName = `${username}_${year}-${month}`
}

const showGenerateDialog = () => {
  resetGenerateForm()
  generateVisible.value = true
}

const submitGenerate = async () => {
  if (!generateFormRef.value) return
  try {
    await generateFormRef.value.validate()
  } catch { return }
  if (generateForm.environmentMask === 0) generateForm.environmentMask = 7
  generating.value = true
  try {
    const payload = { ...generateForm }
    if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString()
    const res = await request.post('/user/plan/generate', payload)
    if (res.data.code === 200) {
      ElMessage.success('方案生成成功')
      generateVisible.value = false
      fetchPlans()
    } else {
      ElMessage.error(res.data.message || '生成失败')
    }
  } catch {
    ElMessage.error('生成失败')
  } finally {
    generating.value = false
  }
}

const showFeedback = (plan) => {
  currentFeedbackPlanId = plan.id
  feedbackForm.planScore = 5
  feedbackForm.feedback = ''
  feedbackVisible.value = true
}

const submitFeedback = async () => {
  try {
    const res = await request.post(`/user/plan/${currentFeedbackPlanId}/feedback`, {
      planScore: feedbackForm.planScore,
      feedback: feedbackForm.feedback
    })
    if (res.data.code === 200) {
      ElMessage.success('反馈提交成功')
      feedbackVisible.value = false
      fetchPlans()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('提交失败')
  }
}

const deletePlan = async (plan) => {
  try {
    await ElMessageBox.confirm(`确定删除方案“${plan.planName}”吗？`, '提示', { type: 'warning' })
    const res = await request.delete(`/user/plan/${plan.id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchPlans()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {}
}

onMounted(() => {
  fetchPlans()
})
</script>

<style scoped>
.plan-page { max-width: 1400px; margin: 0 auto; }
.plan-card { border-radius: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.tip { margin-left: 8px; font-size: 12px; color: #909399; }
.expand-content { padding: 12px; background-color: #fafafa; }
.day-group { margin-bottom: 20px; }
.day-title { font-weight: bold; margin-bottom: 8px; font-size: 16px; }
.day-table { margin-bottom: 8px; }
.day-total { text-align: right; font-size: 14px; color: #409eff; }
.exercise-name { font-weight: bold; margin-right: 8px; }
.exercise-attrs { color: #606266; }
.adopted-text { color: #909399; font-size: 14px; margin: 0 8px; }
.daily-target-info { margin-bottom: 12px; font-size: 14px; color: #e6a23c; font-weight: 500; }
</style>