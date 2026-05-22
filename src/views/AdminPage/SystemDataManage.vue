<template>
  <div class="system-data-manage">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 运动项目 -->
      <el-tab-pane label="运动项目" name="exercise">
        <DataTable
            ref="exerciseTable"
            :columns="exerciseColumns"
            :form-fields="exerciseFields"
            :default-form="defaultExercise"
            add-api="/admin/exercise/add"
            update-api="/admin/exercise/update"
            delete-api="/admin/exercise/delete"
            list-api="/admin/exercise/search"
            :is-search-post="true"
        />
      </el-tab-pane>

      <!-- 运动方案（自定义表格，支持展开详情） -->
      <el-tab-pane label="运动方案" name="plan">
        <div class="plan-manage">
          <!-- 搜索栏 -->
          <el-form :inline="true" :model="planSearch" class="search-form">
            <el-form-item label="用户ID">
              <el-input v-model="planSearch.userId" placeholder="用户ID" clearable />
            </el-form-item>
            <el-form-item label="方案名称">
              <el-input v-model="planSearch.planName" placeholder="方案名称" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="planSearch.status" placeholder="状态" clearable>
                <el-option label="已推荐" :value="0" />
                <el-option label="进行中" :value="1" />
                <el-option label="已完成" :value="2" />
                <el-option label="未完成" :value="3" />
                <el-option label="暂停" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchPlans">查询</el-button>
              <el-button @click="resetPlanSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 方案表格，支持展开行 -->
          <el-table
              :data="planList"
              v-loading="planLoading"
              stripe
              border
              row-key="id"
              :expand-row-keys="expandedPlanIds"
              @expand-change="handleExpandChange"
          >
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="plan-details-container">
                  <div v-if="row.detailsLoading" class="loading-tip">加载明细中...</div>
                  <div v-else-if="!row.details || row.details.length === 0" class="empty-tip">暂无明细</div>
                  <div v-else>
                    <!-- 按天分组展示 -->
                    <div v-for="day in row.groupedDetails" :key="day.dayNumber" class="day-group">
                      <div class="day-title">第 {{ day.dayNumber }} 天</div>
                      <el-table :data="day.items" border size="small" class="day-table">
                        <!-- 运动名称：优先使用后端返回，若无则显示 运动ID -->
                        <el-table-column label="运动名称" min-width="180">
                          <template #default="{ row: item }">
                            {{ item.exerciseName || `运动${item.exerciseId}` }}
                          </template>
                        </el-table-column>
                        <el-table-column label="组数" prop="sets" width="80" />
                        <el-table-column label="次数" prop="reps" width="80" />
                        <el-table-column label="时长(分钟)" prop="exerciseDuration" width="100" />
                        <el-table-column label="距离(km)" prop="distance" width="100" />
                        <el-table-column label="频率(次/分)" prop="frequency" width="100" />
                        <el-table-column label="预估消耗(kcal)" prop="estimatedCalories" width="120" />
                      </el-table>
                      <div class="day-total">当日总消耗：{{ day.totalCalories }} kcal</div>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="planName" label="方案名称" min-width="150" />
            <el-table-column prop="userId" label="用户ID" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getPlanStatusType(row.status)">{{ getPlanStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="estimatedCalories" label="预估消耗(kcal)" width="120" />
            <el-table-column prop="consumedCalories" label="已消耗(kcal)" width="120" />
            <el-table-column prop="planScore" label="评分" width="80" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" @click="deletePlan(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
              v-model:current-page="planPage"
              v-model:page-size="planSize"
              :total="planTotal"
              layout="total, sizes, prev, pager, next"
              @size-change="fetchPlans"
              @current-change="fetchPlans"
          />
        </div>
      </el-tab-pane>

      <!-- 伤病记录 -->
      <el-tab-pane label="伤病记录" name="injury">
        <DataTable
            ref="injuryTable"
            :columns="injuryColumns"
            :form-fields="injuryFields"
            :default-form="defaultInjury"
            add-api="/admin/injury/add"
            update-api="/admin/injury/update"
            delete-api="/admin/injury/delete"
            list-api="/admin/injury/search"
            :is-search-post="true"
        />
      </el-tab-pane>

      <!-- 运动记录 -->
      <el-tab-pane label="运动记录" name="workoutRecord">
        <DataTable
            ref="workoutTable"
            :columns="workoutColumns"
            :form-fields="workoutFields"
            :default-form="defaultWorkout"
            update-api="/admin/workout-record/update"
            delete-api="/admin/workout-record/delete"
            list-api="/admin/workout-record/search"
            :is-search-post="true"
        />
      </el-tab-pane>

      <!-- 运动评分 -->
      <el-tab-pane label="运动评分" name="exerciseRating">
        <DataTable
            ref="ratingTable"
            :columns="ratingColumns"
            :form-fields="ratingFields"
            :default-form="defaultRating"
            delete-api="/admin/exercise-rating/delete"
            list-api="/admin/exercise-rating/search"
            :is-search-post="true"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DataTable from './DataTable.vue'
import request from '@/utils/request'

const activeTab = ref('exercise')

// ------------------- 运动项目配置 -------------------
const exerciseColumns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'exerciseName', label: '名称', minWidth: 120 },
  { prop: 'categoryMask', label: '类别掩码', width: 100 },
  { prop: 'difficulty', label: '难度', width: 80 },
  { prop: 'intensity', label: '强度', width: 80 },
  { prop: 'durationPerSet', label: '单组时长', width: 100 },
  { prop: 'sets', label: '组数', width: 80 },
  { prop: 'reps', label: '次数', width: 80 }
]

const exerciseFields = [
  { prop: 'exerciseName', label: '运动名称', type: 'input', required: true },
  { prop: 'categoryMask', label: '类别掩码', type: 'number', required: true },
  { prop: 'difficulty', label: '难度(0-3)', type: 'number', required: true },
  { prop: 'intensity', label: '强度(0-2)', type: 'number', required: true },
  { prop: 'heartRateMin', label: '最低心率', type: 'number' },
  { prop: 'heartRateMax', label: '最高心率', type: 'number' },
  { prop: 'minRecommendedAge', label: '最小年龄', type: 'number' },
  { prop: 'maxRecommendedAge', label: '最大年龄', type: 'number' },
  { prop: 'targetBodyPartMask', label: '主要部位掩码', type: 'number' },
  { prop: 'secondaryBodyPartMask', label: '次要部位掩码', type: 'number' },
  { prop: 'durationPerSet', label: '单组时长(分)', type: 'number' },
  { prop: 'sets', label: '组数', type: 'number' },
  { prop: 'reps', label: '每组次数', type: 'number' },
  { prop: 'distance', label: '距离(km)', type: 'number' },
  { prop: 'frequency', label: '频率', type: 'number' },
  { prop: 'suitableEnvMask', label: '适合环境掩码', type: 'number' },
  { prop: 'contraindicatedChronicMask', label: '禁忌慢性病掩码', type: 'number' },
  { prop: 'requiredEquipment', label: '所需设备', type: 'input' },
  { prop: 'metValue', label: 'MET值', type: 'number' },
  { prop: 'cautions', label: '注意事项', type: 'textarea' }
]
const defaultExercise = {}

// ------------------- 方案管理 -------------------
const planList = ref([])
const planLoading = ref(false)
const planTotal = ref(0)
const planPage = ref(1)
const planSize = ref(10)
const planSearch = reactive({
  userId: '',
  planName: '',
  status: null
})

const expandedPlanIds = ref([])

const getPlanStatusText = (status) => {
  const map = { 0: '已推荐', 1: '进行中', 2: '已完成', 3: '未完成', 4: '暂停' }
  return map[status] || '未知'
}
const getPlanStatusType = (status) => {
  const map = { 0: 'info', 1: 'primary', 2: 'success', 3: 'danger', 4: 'warning' }
  return map[status] || 'info'
}

const fetchPlans = async () => {
  planLoading.value = true
  try {
    const params = {
      page: planPage.value,
      size: planSize.value,
      userId: planSearch.userId || undefined,
      planName: planSearch.planName || undefined,
      status: planSearch.status !== null ? planSearch.status : undefined
    }
    const res = await request.post('/admin/plan/search', params)
    if (res.data.code === 200) {
      const data = res.data.data
      planList.value = (data.records || []).map(p => ({
        ...p,
        details: null,
        groupedDetails: null,
        detailsLoading: false
      }))
      planTotal.value = data.total || 0
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('获取方案列表失败')
  } finally {
    planLoading.value = false
  }
}

const resetPlanSearch = () => {
  planSearch.userId = ''
  planSearch.planName = ''
  planSearch.status = null
  planPage.value = 1
  fetchPlans()
}

const loadPlanDetails = async (plan) => {
  if (plan.details !== null) return
  plan.detailsLoading = true
  try {
    const res = await request.get(`/admin/plan-day-detail/list/${plan.id}`, {
      params: { page: 1, size: 1000 }
    })
    if (res.data.code === 200) {
      const details = res.data.data.records || []
      // 按 dayNumber 分组
      const groupMap = new Map()
      details.forEach(d => {
        const day = d.dayNumber
        if (!groupMap.has(day)) groupMap.set(day, [])
        groupMap.get(day).push(d)
      })
      const grouped = []
      for (let [day, items] of groupMap.entries()) {
        items.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
        const totalCalories = items.reduce((sum, i) => sum + (i.estimatedCalories || 0), 0)
        grouped.push({
          dayNumber: day,
          items,
          totalCalories
        })
      }
      grouped.sort((a, b) => a.dayNumber - b.dayNumber)
      plan.details = details
      plan.groupedDetails = grouped
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

const handleExpandChange = (row, expanded) => {
  if (expanded) {
    if (!expandedPlanIds.value.includes(row.id)) {
      expandedPlanIds.value.push(row.id)
      loadPlanDetails(row)
    }
  } else {
    expandedPlanIds.value = expandedPlanIds.value.filter(id => id !== row.id)
  }
}

const deletePlan = async (planId) => {
  try {
    await ElMessageBox.confirm('确定删除该方案吗？删除后不可恢复。', '提示', { type: 'warning' })
    const res = await request.delete(`/admin/plan/${planId}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchPlans()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {}
}

// ------------------- 伤病记录配置 -------------------
const injuryColumns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'userId', label: '用户ID', width: 100 },
  { prop: 'bodyPartMask', label: '部位掩码', width: 100 },
  { prop: 'severity', label: '严重程度', width: 100 }
]

const injuryFields = [
  { prop: 'userId', label: '用户ID', type: 'number', required: true },
  { prop: 'bodyPartMask', label: '伤病部位掩码', type: 'number', required: true },
  { prop: 'severity', label: '严重程度(0-2)', type: 'number', required: true },
  { prop: 'symptomsMask', label: '症状掩码', type: 'number' },
  { prop: 'status', label: '状态(0-2)', type: 'number', required: true },
  { prop: 'injuredDate', label: '受伤日期', type: 'datetime', required: true },
  { prop: 'recoveredDate', label: '痊愈日期', type: 'datetime' }
]
const defaultInjury = {}

// ------------------- 运动记录配置 -------------------
const workoutColumns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'userId', label: '用户ID', width: 100 },
  { prop: 'exerciseId', label: '运动ID', width: 100 },
  { prop: 'completionDate', label: '完成日期', width: 120 },
  { prop: 'status', label: '状态', width: 80 }
]

const workoutFields = [
  { prop: 'userId', label: '用户ID', type: 'number', required: true },
  { prop: 'planId', label: '方案ID', type: 'number' },
  { prop: 'exerciseId', label: '运动ID', type: 'number', required: true },
  { prop: 'completionDate', label: '完成日期', type: 'date', required: true },
  { prop: 'status', label: '状态(0完成/1未完成)', type: 'number', required: true },
  { prop: 'actualSets', label: '完成组数', type: 'number' },
  { prop: 'actualReps', label: '每组次数', type: 'number' },
  { prop: 'actualDuration', label: '运动时长(分)', type: 'number' },
  { prop: 'actualDistance', label: '距离(km)', type: 'number' },
  { prop: 'actualCalories', label: '消耗卡路里', type: 'number' }
]
const defaultWorkout = {}

// ------------------- 运动评分配置 -------------------
const ratingColumns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'userId', label: '用户ID', width: 100 },
  { prop: 'exerciseId', label: '运动ID', width: 100 },
  { prop: 'exerciseScore', label: '评分', width: 100 }
]

const ratingFields = [
  { prop: 'userId', label: '用户ID', type: 'number', required: true },
  { prop: 'exerciseId', label: '运动ID', type: 'number', required: true },
  { prop: 'exerciseScore', label: '评分(1-10)', type: 'number', required: true },
  { prop: 'isDefault', label: '是否默认(0否/1是)', type: 'number' }
]
const defaultRating = {}

fetchPlans()
</script>

<style scoped>
.system-data-manage {
  height: 100%;
}
.plan-manage {
  padding: 0;
}
.search-form {
  margin-bottom: 20px;
}
.plan-details-container {
  padding: 16px;
  background-color: #fafafa;
}
.day-group {
  margin-bottom: 20px;
}
.day-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 16px;
}
.day-table {
  margin-bottom: 8px;
}
.day-total {
  text-align: right;
  font-size: 14px;
  color: #409eff;
}
.loading-tip, .empty-tip {
  text-align: center;
  color: #909399;
  padding: 20px;
}
</style>