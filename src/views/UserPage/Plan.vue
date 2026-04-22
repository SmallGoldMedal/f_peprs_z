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

      <el-table :data="planList" v-loading="loading" stripe>
        <el-table-column prop="planName" label="方案名称" />
        <el-table-column label="开始日期" width="120">
          <template #default="{ row }">{{ formatDate(row.startDate) }}</template>
        </el-table-column>
        <el-table-column label="天数" width="80">
          <template #default="{ row }">{{ row.durationDays }}天</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预估消耗" width="120">
          <template #default="{ row }">{{ row.estimatedCalories || 0 }} kcal</template>
        </el-table-column>
        <el-table-column label="已消耗" width="100">
          <template #default="{ row }">{{ row.consumedCalories || 0 }} kcal</template>
        </el-table-column>
        <el-table-column label="评分" width="80">
          <template #default="{ row }">{{ row.planScore || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button link type="warning" @click="updateStatus(row)" :disabled="row.status === 2 || row.status === 3">更新状态</el-button>
            <el-button link type="success" @click="showFeedback(row)" :disabled="!!row.planScore">评分反馈</el-button>
            <el-button link type="danger" @click="deletePlan(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 生成方案对话框 -->
    <el-dialog v-model="generateVisible" title="生成新方案" width="600px" destroy-on-close>
      <el-form :model="generateForm" :rules="generateRules" ref="generateFormRef" label-width="120px">
        <el-form-item label="方案名称" prop="planName">
          <el-input v-model="generateForm.planName" placeholder="例如：减脂计划" />
        </el-form-item>
        <el-form-item label="方案类型" prop="planType">
          <el-radio-group v-model="generateForm.planType">
            <el-radio :label="0">全天安排</el-radio>
            <el-radio :label="1">间隔安排</el-radio>
            <el-radio :label="2">每周固定天</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker v-model="generateForm.startDate" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="方案天数" prop="durationDays">
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
        <el-form-item label="运动目的" prop="purpose">
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
          <el-input-number v-model="generateForm.loseWeightValue" :min="0" :step="0.5" />
        </el-form-item>
        <el-form-item label="运动环境" prop="environmentMask">
          <el-checkbox-group @change="updateEnvMask">
            <el-checkbox :label="1">居家</el-checkbox>
            <el-checkbox :label="2">健身房</el-checkbox>
            <el-checkbox :label="4">户外</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="运动经验" prop="experience">
          <el-radio-group v-model="generateForm.experience">
            <el-radio :label="0">没经验</el-radio>
            <el-radio :label="1">经验较少</el-radio>
            <el-radio :label="2">经验丰富</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="拥有的设备" prop="equipment">
          <el-input v-model="generateForm.equipment" placeholder="例如：瑜伽垫、哑铃" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateVisible = false">取消</el-button>
        <el-button type="primary" @click="submitGenerate" :loading="generating">生成</el-button>
      </template>
    </el-dialog>

    <!-- 方案详情对话框 -->
    <el-dialog v-model="detailVisible" :title="currentPlan?.planName" width="800px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentPlan">
        <el-descriptions-item label="开始日期">{{ formatDate(currentPlan.startDate) }}</el-descriptions-item>
        <el-descriptions-item label="天数">{{ currentPlan.durationDays }}天</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusText(currentPlan.status) }}</el-descriptions-item>
        <el-descriptions-item label="预估消耗">{{ currentPlan.estimatedCalories || 0 }} kcal</el-descriptions-item>
        <el-descriptions-item label="已消耗">{{ currentPlan.consumedCalories || 0 }} kcal</el-descriptions-item>
        <el-descriptions-item label="评分">{{ currentPlan.planScore || '未评分' }}</el-descriptions-item>
        <el-descriptions-item label="反馈" :span="2">{{ currentPlan.feedback || '无' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider>每日明细</el-divider>
      <el-table :data="planDetails" v-loading="loadingDetails" stripe>
        <el-table-column prop="dayNumber" label="第几天" width="80" />
        <el-table-column prop="exerciseId" label="运动ID" width="80" />
        <el-table-column label="组数" width="80">
          <template #default="{ row }">{{ row.sets || '-' }}</template>
        </el-table-column>
        <el-table-column label="次数" width="80">
          <template #default="{ row }">{{ row.reps || '-' }}</template>
        </el-table-column>
        <el-table-column label="时长(分钟)" width="100">
          <template #default="{ row }">{{ row.exerciseDuration || '-' }}</template>
        </el-table-column>
        <el-table-column label="距离(km)" width="100">
          <template #default="{ row }">{{ row.distance || '-' }}</template>
        </el-table-column>
        <el-table-column label="预估卡路里" width="100">
          <template #default="{ row }">{{ row.estimatedCalories || 0 }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 更新状态对话框 -->
    <el-dialog v-model="statusVisible" title="更新方案状态" width="400px">
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="状态">
          <el-select v-model="statusForm.status">
            <el-option label="已推荐" :value="0" />
            <el-option label="进行中" :value="1" />
            <el-option label="已完成" :value="2" />
            <el-option label="未完成" :value="3" />
            <el-option label="暂停" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStatus">确定</el-button>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request.js'

const loading = ref(false)
const planList = ref([])
const generateVisible = ref(false)
const generating = ref(false)
const generateFormRef = ref(null)
const detailVisible = ref(false)
const currentPlan = ref(null)
const planDetails = ref([])
const loadingDetails = ref(false)
const statusVisible = ref(false)
const statusForm = reactive({ status: 0 })
let currentPlanId = null
const feedbackVisible = ref(false)
const feedbackForm = reactive({ planScore: 5, feedback: '' })

const generateForm = reactive({
  planName: '',
  planType: 0,
  startDate: null,
  durationDays: 7,
  intervalDays: null,
  weeklyDaysMask: 0,
  purpose: 1,
  loseWeightValue: null,
  environmentMask: 0,
  experience: 0,
  equipment: ''
})

const generateRules = {
  planName: [{ required: true, message: '请输入方案名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  durationDays: [{ required: true, message: '请输入方案天数' }],
  purpose: [{ required: true, message: '请选择运动目的' }]
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

const updateWeeklyMask = (vals) => {
  let mask = 0
  vals.forEach(v => mask |= v)
  generateForm.weeklyDaysMask = mask
}

const updateEnvMask = (vals) => {
  let mask = 0
  vals.forEach(v => mask |= v)
  generateForm.environmentMask = mask
}

const fetchPlans = async () => {
  loading.value = true
  try {
    const res = await request.get('/user/plan/list')
    if (res.data.code === 200) {
      planList.value = res.data.data || []
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('获取方案列表失败')
  } finally {
    loading.value = false
  }
}

const showGenerateDialog = () => {
  generateVisible.value = true
}

const submitGenerate = async () => {
  if (!generateFormRef.value) return
  try {
    await generateFormRef.value.validate()
  } catch { return }
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

const viewDetail = async (plan) => {
  currentPlan.value = plan
  detailVisible.value = true
  loadingDetails.value = true
  try {
    const res = await request.get(`/user/plan/${plan.id}`)
    if (res.data.code === 200) {
      currentPlan.value = res.data.data
    }
    const detailRes = await request.get(`/user/plan-day-detail/list/${plan.id}`)
    if (detailRes.data.code === 200) {
      planDetails.value = detailRes.data.data || []
    }
  } catch {
    ElMessage.error('获取详情失败')
  } finally {
    loadingDetails.value = false
  }
}

const updateStatus = (plan) => {
  currentPlanId = plan.id
  statusForm.status = plan.status
  statusVisible.value = true
}

const submitStatus = async () => {
  try {
    const res = await request.put(`/user/plan/${currentPlanId}/status`, { status: statusForm.status })
    if (res.data.code === 200) {
      ElMessage.success('状态更新成功')
      statusVisible.value = false
      fetchPlans()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('更新失败')
  }
}

const showFeedback = (plan) => {
  currentPlanId = plan.id
  feedbackForm.planScore = 5
  feedbackForm.feedback = ''
  feedbackVisible.value = true
}

const submitFeedback = async () => {
  try {
    const res = await request.post(`/user/plan/${currentPlanId}/feedback`, {
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

// 删除方案
const deletePlan = async (plan) => {
  try {
    await ElMessageBox.confirm(`确定删除方案“${plan.planName}”吗？删除后不可恢复，关联的运动记录将不再关联此方案。`, '提示', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    const res = await request.delete(`/user/plan/${plan.id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchPlans()
    } else {
      ElMessage.error(res.data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchPlans()
})
</script>

<style scoped>
.plan-page {
  max-width: 1400px;
  margin: 0 auto;
}
.plan-card {
  border-radius: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}
</style>