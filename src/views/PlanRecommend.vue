<template>
  <div class="plan-recommend">
    <el-card class="generate-card" shadow="hover">
      <template #header>
        <div class="card-header">生成运动方案</div>
      </template>
      <el-form :model="generateForm" label-width="100px" class="generate-form">
        <el-form-item label="名称">
          <el-input v-model="generateForm.planName" placeholder="可选，不填则自动生成" style="width: 250px"/>
        </el-form-item>
<<<<<<< HEAD
        <el-form-item label="持续周数">
          <el-input-number v-model="generateForm.durationWeeks" :min="1" :max="52" :step="1" controls-position="right"/>
          <span style="margin-left: 10px; color: #909399;">周（1~52）</span>
=======
        <el-form-item label="方案天数">
          <el-input-number v-model="generateForm.durationDays" :min="1" :max="30" :step="1"
                           controls-position="right"/>
>>>>>>> 3d87fdc7b795b75f11283dc981b171432f7f7285
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="generateForm.startDate" type="date" placeholder="选择日期"
                          value-format="YYYY-MM-DD"/>
        </el-form-item>

        <el-form-item label="运动安排">
          <el-radio-group v-model="scheduleType" @change="onScheduleTypeChange">
            <el-radio value="daily">每天</el-radio>
            <el-radio value="interval">每隔几天运动一次</el-radio>
            <el-radio value="weekly">每周自定义天数</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="scheduleType === 'interval'" label="间隔天数">
          <el-input-number v-model="intervalDays" :min="1" :max="30" :step="1" controls-position="right"/>
          <span style="margin-left: 10px; color: #909399;">例如：2表示每2天运动一次</span>
        </el-form-item>
        <el-form-item v-if="scheduleType === 'weekly'" label="选择周几">
          <el-checkbox-group v-model="weeklyDays">
            <el-checkbox :label="1">周一</el-checkbox>
            <el-checkbox :label="2">周二</el-checkbox>
            <el-checkbox :label="3">周三</el-checkbox>
            <el-checkbox :label="4">周四</el-checkbox>
            <el-checkbox :label="5">周五</el-checkbox>
            <el-checkbox :label="6">周六</el-checkbox>
            <el-checkbox :label="7">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="目标">
          <el-select v-model="generateForm.purpose" placeholder="请选择主要目标" style="width: 150px; margin-right: 12px;">
            <el-option label="减脂" value="减脂" />
            <el-option label="增肌" value="增肌" />
            <el-option label="提高心肺" value="提高心肺" />
            <el-option label="柔韧改善" value="柔韧改善" />
            <el-option label="康复" value="康复" />
          </el-select>
          <el-input-number v-model="generateForm.targetValue" :min="0" :max="100" :step="0.5" controls-position="right" placeholder="目标数值" style="width: 120px"/>
          <span style="margin-left: 8px; color: #909399;">
            {{ targetUnit }}
          </span>
        </el-form-item>

        <el-form-item label="场合">
          <div class="option-group">
            <el-checkbox-group v-model="generateForm.environment">
              <el-checkbox-button value="1">居家</el-checkbox-button>
              <el-checkbox-button value="2">健身房</el-checkbox-button>
              <el-checkbox-button value="4">户外</el-checkbox-button>
            </el-checkbox-group>
          </div>
        </el-form-item>

        <el-form-item label="可用器械">
          <div class="equipment-area">
            <el-input v-model="newEquipment" placeholder="输入器械名称，例如：哑铃" style="width: 200px; margin-right: 10px" @keyup.enter="addEquipment"/>
            <el-button type="primary" @click="addEquipment" :disabled="!newEquipment.trim()">添加</el-button>
          </div>
          <div class="equipment-history" v-if="equipmentHistory.length">
            <span class="history-label">历史器械：</span>
            <el-tag v-for="item in equipmentHistory" :key="item" size="small" class="history-tag" @click="appendEquipment(item)">{{ item }}</el-tag>
            <el-button type="text" size="small" @click="clearHistory">清空历史</el-button>
          </div>
          <div class="selected-equipment" v-if="equipmentList.length">
            <span class="history-label">已选器械：</span>
            <el-tag v-for="(item, idx) in equipmentList" :key="idx" closable @close="removeEquipment(idx)" size="small" type="primary" style="margin-right: 8px; margin-bottom: 4px">{{ item }}</el-tag>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="generatePlan" :loading="generating">生成运动方案</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="currentPlan && currentPlan.details" class="plan-result-card" shadow="hover">
      <template #header>
        <div class="card-header">
          {{ currentPlan.planName || '生成的方案' }}
          <div>
            <el-button type="success" @click="adoptCurrentPlan" :loading="adopting" :disabled="isAdopted">采纳此方案</el-button>
            <el-button type="warning" @click="regeneratePlan" :loading="generating">重新生成</el-button>
          </div>
        </div>
      </template>
      <el-descriptions :column="3" border class="plan-info">
        <el-descriptions-item label="开始日期">{{ currentPlan.startDate }}</el-descriptions-item>
<<<<<<< HEAD
        <el-descriptions-item label="结束日期">{{ calculateEndDate(currentPlan.startDate, currentPlan.durationDays) }}</el-descriptions-item>
        <el-descriptions-item label="持续周数">{{ currentPlan.durationWeeks }} 周</el-descriptions-item>
        <el-descriptions-item label="目标">{{ currentPlan.purpose || '未指定' }}{{ currentPlan.targetValue ? ' (' + currentPlan.targetValue + getTargetUnitSuffix(currentPlan.purpose) + ')' : '' }}</el-descriptions-item>
        <el-descriptions-item label="场合">{{ formatEnvMask(currentPlan.environment) }}</el-descriptions-item>
=======
        <el-descriptions-item label="结束日期">
          {{ currentPlan.endDate || calculateEndDate(currentPlan.startDate, currentPlan.durationWeeks * 7) }}
        </el-descriptions-item>
        <el-descriptions-item label="总天数">{{ currentPlan.durationWeeks * 7 }} 天</el-descriptions-item>
        <el-descriptions-item label="运动目标">{{ formatTargetMask(currentPlan.targetValue) }}</el-descriptions-item>
        <el-descriptions-item label="运动环境">{{ formatEnvMask(currentPlan.environment) }}</el-descriptions-item>
>>>>>>> 3d87fdc7b795b75f11283dc981b171432f7f7285
        <el-descriptions-item label="所需器械">{{ currentPlan.equipment || '无' }}</el-descriptions-item>
      </el-descriptions>

      <el-table :data="detailList" border stripe class="detail-table">
        <el-table-column prop="dayNumber" label="第几天" width="80"/>
        <el-table-column prop="exerciseName" label="运动项目" min-width="150"/>
        <el-table-column prop="category" label="类别" width="100"/>
        <el-table-column prop="sets" label="组数" width="80"/>
        <el-table-column prop="reps" label="每组次数" width="100"/>
        <el-table-column prop="durationMin" label="时长(分)" width="100"/>
        <el-table-column prop="cautions" label="注意事项" min-width="150" show-overflow-tooltip/>
        <el-table-column prop="requiredEquipment" label="推荐器械" min-width="120" show-overflow-tooltip/>
      </el-table>

      <div ref="chartRef" style="width: 100%; height: 400px; margin-top: 20px"></div>
    </el-card>

    <el-card class="plan-list-card" shadow="hover">
      <template #header>
        <div class="card-header">我的运动方案</div>
      </template>
      <el-table :data="planList" border stripe @row-click="viewPlanDetail" style="cursor: pointer">
        <el-table-column prop="planName" label="方案名称" min-width="150"/>
        <el-table-column prop="startDate" label="开始日期" width="120"/>
        <el-table-column prop="endDate" label="结束日期" width="120"/>
        <el-table-column label="持续周数" width="100">
          <template #default="{ row }">{{ row.durationWeeks }} 周</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 2 ? 'success' : 'primary'">
              {{ row.status === 0 ? '推荐' : row.status === 1 ? '被选择' : '已完成' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否采纳" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '已采纳' : '未采纳' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="80">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="openPlanRatingForPlan(row)">评分</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="viewPlanDetail(row)">查看详情</el-button>
            <el-button type="danger" link @click.stop="deletePlan(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!planList.length" description="暂无方案，请先生成" :image-size="80"/>
    </el-card>

    <el-dialog v-model="detailDialogVisible" :title="historyPlan?.planName || '方案详情'" width="80%" destroy-on-close>
      <div v-if="historyPlan">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="开始日期">{{ historyPlan.startDate }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ historyPlan.endDate }}</el-descriptions-item>
<<<<<<< HEAD
          <el-descriptions-item label="持续周数">{{ historyPlan.durationWeeks }} 周</el-descriptions-item>
          <el-descriptions-item label="状态">{{ historyPlan.status === 0 ? '已推荐' : historyPlan.status === 1 ? '已采纳' : historyPlan.status === 2 ? '进行中' : historyPlan.status === 3 ? '已完成' : '未完成' }}</el-descriptions-item>
          <el-descriptions-item label="是否采纳">{{ historyPlan.status === 1 ? '已采纳' : '未采纳' }}</el-descriptions-item>
          <el-descriptions-item label="目标">{{ historyPlan.purpose || '未指定' }}{{ historyPlan.targetValue ? ' (' + historyPlan.targetValue + getTargetUnitSuffix(historyPlan.purpose) + ')' : '' }}</el-descriptions-item>
=======
          <el-descriptions-item label="状态">
            {{ historyPlan.status === 0 ? '推荐' : historyPlan.status === 1 ? '被选择' : '已完成' }}
          </el-descriptions-item>
          <el-descriptions-item label="是否采纳">{{ historyPlan.adopted ? '已采纳' : '未采纳' }}</el-descriptions-item>
>>>>>>> 3d87fdc7b795b75f11283dc981b171432f7f7285
        </el-descriptions>
        <el-table :data="historyDetails" border stripe>
          <el-table-column prop="dayNumber" label="第几天" width="80"/>
          <el-table-column prop="exerciseName" label="运动项目" min-width="150"/>
          <el-table-column prop="category" label="类别" width="100"/>
          <el-table-column prop="sets" label="组数" width="80"/>
          <el-table-column prop="reps" label="每组次数" width="100"/>
          <el-table-column prop="durationMin" label="时长(分)" width="100"/>
          <el-table-column prop="cautions" label="注意事项" min-width="150" show-overflow-tooltip/>
          <el-table-column prop="requiredEquipment" label="推荐器械" min-width="120" show-overflow-tooltip/>
        </el-table>
        <div ref="historyChartRef" style="width: 100%; height: 400px; margin-top: 20px"></div>
        <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 16px;">
          <el-divider>方案评价</el-divider>
          <el-form inline>
            <el-form-item label="评分(1-10)">
              <el-slider v-model="historyRatingForm.planScore" :min="1" :max="10" style="width: 200px"/>
            </el-form-item>
            <el-form-item label="反馈">
              <el-input v-model="historyRatingForm.feedback" placeholder="说说感受" style="width: 250px"/>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitHistoryRating" :loading="ratingHistoryLoading">提交评价</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button v-if="historyPlan && historyPlan.status !== 1" type="success" @click="adoptHistoryPlan" :loading="adoptingHistory">采纳方案</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const userStore = useUserStore()

const generateForm = ref({
  planName: '',
<<<<<<< HEAD
  durationWeeks: 1,       // 持续周数
  startDate: dayjs().format('YYYY-MM-DD'),
  purpose: '',
  targetValue: null,      // 目标数值
  environment: []
=======
  durationDays: 7,
  startDate: new Date().toISOString().slice(0, 10),
  planTarget: [],
  planEnvironment: []
>>>>>>> 3d87fdc7b795b75f11283dc981b171432f7f7285
})
const scheduleType = ref('daily')
const intervalDays = ref(2)
const weeklyDays = ref([1, 3, 5])

// 根据目标类型返回单位文本
const targetUnit = computed(() => {
  const purpose = generateForm.value.purpose
  if (purpose === '减脂') return 'kg'
  if (purpose === '增肌') return 'kg'
  if (purpose === '提高心肺') return 'bpm'
  return ''
})

const getTargetUnitSuffix = (purpose) => {
  if (purpose === '减脂') return 'kg'
  if (purpose === '增肌') return 'kg'
  if (purpose === '提高心肺') return 'bpm'
  return ''
}

const onScheduleTypeChange = () => {}

const calculateEndDate = (startDate, durationDays) => {
  if (!startDate || !durationDays) return ''
  return dayjs(startDate).add(durationDays - 1, 'day').format('YYYY-MM-DD')
}

const equipmentList = ref([])
const newEquipment = ref('')
const equipmentHistory = ref([])

const loadEquipmentHistory = () => {
  const stored = localStorage.getItem(`equipment_history_${userStore.userId}`)
  equipmentHistory.value = stored ? JSON.parse(stored) : []
}
const saveEquipmentHistory = () => {
  localStorage.setItem(`equipment_history_${userStore.userId}`, JSON.stringify(equipmentHistory.value))
}
const addEquipment = () => {
  const val = newEquipment.value.trim()
  if (!val) return
  if (!equipmentList.value.includes(val)) equipmentList.value.push(val)
  if (!equipmentHistory.value.includes(val)) {
    equipmentHistory.value.unshift(val)
    if (equipmentHistory.value.length > 20) equipmentHistory.value.pop()
    saveEquipmentHistory()
  }
  newEquipment.value = ''
}
const appendEquipment = (item) => {
  if (!equipmentList.value.includes(item)) equipmentList.value.push(item)
}
const removeEquipment = (idx) => {
  equipmentList.value.splice(idx, 1)
}
const clearHistory = () => {
  equipmentHistory.value = []
  saveEquipmentHistory()
}

const generating = ref(false)
const adopting = ref(false)
const adoptingHistory = ref(false)
const currentPlan = ref(null)
const detailList = ref([])
let chartInstance = null
const chartRef = ref(null)
const planList = ref([])
const detailDialogVisible = ref(false)
const historyPlan = ref(null)
const historyDetails = ref([])
let historyChartInstance = null
const historyChartRef = ref(null)
const exerciseList = ref([])
const historyRatingForm = ref({ planScore: 5, feedback: '' })
const ratingHistoryLoading = ref(false)

const fetchExercises = async () => {
  try {
    const res = await request.post('/exercise/search', { page: 1, size: 100 })
    if (res.data.code === 200) exerciseList.value = res.data.data.records || []
  } catch (error) {
    console.error(error)
  }
}

const enrichDetails = (details) => {
  if (!details || !exerciseList.value.length) return details
  return details.map(d => {
    const ex = exerciseList.value.find(e => e.id === d.exerciseId)
    if (!ex) return { ...d, exerciseName: '未知运动', category: '', cautions: '', requiredEquipment: '' }
    let category = ''
    const mask = ex.categoryMask
    if (mask & 1) category = '有氧'
    else if (mask & 2) category = '力量'
    else if (mask & 4) category = '柔韧'
    else if (mask & 8) category = '平衡'
    else category = '其他'
    return {
      ...d,
      exerciseName: ex.exerciseName,
      category,
      cautions: ex.cautions || '',
      requiredEquipment: ex.requiredEquipment || ''
    }
  })
}

const formatTargetMask = (mask) => {
  if (!mask) return '未指定'
  const map = { 1: '有氧', 2: '力量', 4: '柔韧', 8: '平衡' }
  const parts = []
  for (const [val, name] of Object.entries(map)) if (mask & parseInt(val)) parts.push(name)
  return parts.join('、') || '未指定'
}

const formatEnvMask = (mask) => {
  if (!mask) return '未指定'
  const map = { 1: '居家', 2: '健身房', 4: '户外' }
  const parts = []
  for (const [val, name] of Object.entries(map)) if (mask & parseInt(val)) parts.push(name)
  return parts.join('、') || '未指定'
}

const generatePlan = async () => {
  if (!generateForm.value.startDate) return ElMessage.warning('请选择开始日期')
  // 持续周数转为天数
  const durationDays = generateForm.value.durationWeeks * 7
  if (durationDays < 1 || durationDays > 365) {
    ElMessage.warning('持续周数转换后天数超出范围（1~365天）')
    return
  }
  generating.value = true
  try {
    const targetMask = generateForm.value.planTarget.reduce((acc, val) => acc | val, 0) || null
    const envMask = generateForm.value.planEnvironment.reduce((acc, val) => acc | val, 0) || null
    const equipment = equipmentList.value.length ? equipmentList.value.join(',') : null
    let intervalDaysVal = null, weeklyDaysMaskVal = null
    if (scheduleType.value === 'interval') {
      intervalDaysVal = intervalDays.value
    } else if (scheduleType.value === 'weekly') {
      weeklyDaysMaskVal = weeklyDays.value.reduce((mask, day) => mask | (1 << (day - 1)), 0)
    } else {
      intervalDaysVal = 1
    }
    const payload = {
      planName: generateForm.value.planName || null,
      durationDays: durationDays,                     // 转换后的天数
      startDate: generateForm.value.startDate,
<<<<<<< HEAD
      purpose: generateForm.value.purpose,
      targetValue: generateForm.value.targetValue,   // 目标数值
      environment: environmentMask || null,
=======
      targetValue: targetMask,
      environment: envMask,
>>>>>>> 3d87fdc7b795b75f11283dc981b171432f7f7285
      equipment: equipment,
      intervalDays: intervalDaysVal,
      weeklyDaysMask: weeklyDaysMaskVal
    }
    const res = await request.post('/plan/generate', payload)
    if (res.data.code === 200) {
      const plan = res.data.data
      // 补充前端需要的持续周数（后端可能未返回，自行计算）
      if (plan.durationWeeks === undefined && plan.durationDays) plan.durationWeeks = Math.ceil(plan.durationDays / 7)
      if (plan.details) plan.details = enrichDetails(plan.details)
      currentPlan.value = plan
      detailList.value = plan.details
      await nextTick()
      renderChart()
      ElMessage.success('方案生成成功')
      await fetchPlans()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '生成失败')
  } finally {
    generating.value = false
  }
}

const regeneratePlan = async () => {
  await generatePlan()
}

const isAdopted = computed(() => currentPlan.value?.status === 1)

const adoptCurrentPlan = async () => {
  if (!currentPlan.value || !currentPlan.value.id) {
    ElMessage.warning('请先保存方案后再采纳')
    return
  }
  adopting.value = true
  try {
    const res = await request.put('/plan/update', { id: currentPlan.value.id, status: 1 })
    if (res.data.code === 200) {
      ElMessage.success('已采纳方案')
      currentPlan.value.status = 1
      await fetchPlans()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error(error.response?.data?.message)
  } finally {
    adopting.value = false
  }
}

const adoptHistoryPlan = async () => {
  if (!historyPlan.value) return
  adoptingHistory.value = true
  try {
    const res = await request.put('/plan/update', { id: historyPlan.value.id, status: 1 })
    if (res.data.code === 200) {
      ElMessage.success('已采纳方案')
      historyPlan.value.status = 1
      await fetchPlans()
      if (currentPlan.value && currentPlan.value.id === historyPlan.value.id) currentPlan.value.status = 1
      detailDialogVisible.value = false
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error(error.response?.data?.message)
  } finally {
    adoptingHistory.value = false
  }
}

const renderChart = () => {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)
  const dayMap = new Map()
  detailList.value.forEach(d => {
    const day = d.dayNumber
    const duration = d.durationMin || 0
    dayMap.set(day, (dayMap.get(day) || 0) + duration)
  })
  const days = Array.from(dayMap.keys()).sort((a,b)=>a-b)
  const durations = days.map(d => dayMap.get(d))
  chartInstance.setOption({
    title: { text: '每日运动时长趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: days, name: '天数' },
    yAxis: { type: 'value', name: '时长(分钟)' },
    series: [{ type: 'line', data: durations, smooth: true, areaStyle: {}, lineStyle: { width: 2, color: '#409eff' } }]
  })
}

const fetchPlans = async () => {
  try {
    const res = await request.get('/plan/list')
    if (res.data.code === 200) {
      const plans = res.data.data.records || []
      plans.forEach(p => {
        p.endDate = calculateEndDate(p.startDate, p.durationDays)
        if (!p.durationWeeks && p.durationDays) p.durationWeeks = Math.ceil(p.durationDays / 7)
      })
      planList.value = plans
    }
  } catch (error) {
    console.error(error)
  }
}

const viewPlanDetail = async (plan) => {
  try {
    const res = await request.get(`/plan/${plan.id}`)
    if (res.data.code === 200) {
      const data = res.data.data
      if (!data.durationWeeks && data.durationDays) data.durationWeeks = Math.ceil(data.durationDays / 7)
      if (data.details) data.details = enrichDetails(data.details)
      historyPlan.value = data
      historyDetails.value = data.details || []
      detailDialogVisible.value = true
      await nextTick()
      renderHistoryChart()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('获取方案详情失败')
  }
}

const openPlanRatingForPlan = (plan) => {
  historyPlan.value = plan
  historyRatingForm.value = { planScore: 5, feedback: '' }
  detailDialogVisible.value = true
}

const renderHistoryChart = () => {
  if (!historyChartRef.value) return
  if (historyChartInstance) historyChartInstance.dispose()
  historyChartInstance = echarts.init(historyChartRef.value)
  const dayMap = new Map()
  historyDetails.value.forEach(d => {
    const day = d.dayNumber
    const duration = d.durationMin || 0
    dayMap.set(day, (dayMap.get(day) || 0) + duration)
  })
  const days = Array.from(dayMap.keys()).sort((a,b)=>a-b)
  const durations = days.map(d => dayMap.get(d))
  historyChartInstance.setOption({
    title: { text: '每日运动时长趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: days, name: '天数' },
    yAxis: { type: 'value', name: '时长(分钟)' },
    series: [{ type: 'line', data: durations, smooth: true, areaStyle: {} }]
  })
}

const deletePlan = async (planId) => {
  try {
    await ElMessageBox.confirm('确定删除该方案吗？', '提示', { type: 'warning' })
    const res = await request.delete(`/plan/${planId}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      await fetchPlans()
      if (currentPlan.value?.id === planId) currentPlan.value = null
    } else ElMessage.error(res.data.message)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error.response?.data?.message)
  }
}

const submitHistoryRating = async () => {
  if (!historyPlan.value) return
  ratingHistoryLoading.value = true
  try {
    const res = await request.post('/plan/feedback', { planId: historyPlan.value.id, planScore: historyRatingForm.value.planScore, feedback: historyRatingForm.value.feedback })
    if (res.data.code === 200) {
      ElMessage.success('评价成功')
      historyRatingForm.value = { planScore: 5, feedback: '' }
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '提交失败')
  } finally {
    ratingHistoryLoading.value = false
  }
}

onMounted(async () => {
  await fetchExercises()
  loadEquipmentHistory()
  await fetchPlans()
})
</script>

<style scoped>
.plan-recommend {
  max-width: 1400px;
  margin: 0 auto;
}
.generate-card, .plan-result-card, .plan-list-card {
  margin-bottom: 24px;
  border-radius: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #2c5a7a;
}
.generate-form {
  max-width: 100%;
}
.option-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.option-group :deep(.el-checkbox-button) {
  margin-right: 0;
}
.option-group :deep(.el-checkbox-button.is-checked) {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}
.equipment-area {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.equipment-history {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.selected-equipment {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.history-label {
  font-size: 13px;
  color: #666;
}
.history-tag {
  cursor: pointer;
  transition: all 0.2s;
}
.history-tag:hover {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}
.detail-table {
  margin-top: 16px;
}
.plan-info {
  margin-bottom: 20px;
}
</style>