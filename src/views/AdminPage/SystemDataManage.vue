<template>
  <div class="system-data-manage">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="运动项目" name="exercise">
        <DataTable
            ref="exerciseTable"
            api-prefix="/admin/exercise"
            :columns="exerciseColumns"
            :form-fields="exerciseFields"
            :default-form="defaultExercise"
            add-api="/admin/exercise/add"
            update-api="/admin/exercise/update"
            delete-api="/admin/exercise/delete"
            list-api="/admin/exercise/list"
            :extra-params="{}"
        />
      </el-tab-pane>
      <el-tab-pane label="运动方案" name="plan">
        <DataTable
            ref="planTable"
            api-prefix="/admin/plan"
            :columns="planColumns"
            :form-fields="planFields"
            :default-form="defaultPlan"
            add-api=""
            update-api=""
            delete-api="/admin/plan"
            list-api="/admin/plan/search"
            :is-search-post="true"
        />
      </el-tab-pane>
      <el-tab-pane label="伤病记录" name="injury">
        <DataTable
            ref="injuryTable"
            api-prefix="/admin/injury"
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
      <el-tab-pane label="运动记录" name="workoutRecord">
        <DataTable
            ref="workoutTable"
            api-prefix="/admin/workout-record"
            :columns="workoutColumns"
            :form-fields="workoutFields"
            :default-form="defaultWorkout"
            add-api=""
            update-api=""
            delete-api="/admin/workout-record/delete"
            list-api="/admin/workout-record/search"
            :is-search-post="true"
        />
      </el-tab-pane>
      <el-tab-pane label="运动评分" name="exerciseRating">
        <DataTable
            ref="ratingTable"
            api-prefix="/admin/exercise-rating"
            :columns="ratingColumns"
            :form-fields="ratingFields"
            :default-form="defaultRating"
            add-api=""
            update-api=""
            delete-api="/admin/exercise-rating/delete"
            list-api="/admin/exercise-rating/search"
            :is-search-post="true"
        />
      </el-tab-pane>
      <el-tab-pane label="方案明细" name="planDayDetail">
        <DataTable
            ref="detailTable"
            api-prefix="/admin/plan-day-detail"
            :columns="detailColumns"
            :form-fields="detailFields"
            :default-form="defaultDetail"
            add-api="/admin/plan-day-detail/add"
            update-api="/admin/plan-day-detail/update"
            delete-api="/admin/plan-day-detail/delete"
            list-api="/admin/plan-day-detail/list"
            :extra-params="{ planId: currentPlanIdForDetail }"
        />
        <div style="margin-top: 16px;">
          <el-input v-model="currentPlanIdForDetail" placeholder="输入方案ID查看明细" style="width: 200px;" />
          <el-button @click="refreshDetailTable">查询</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import DataTable from './components/DataTable.vue'  // 通用表格组件，见下文

const activeTab = ref('exercise')
const currentPlanIdForDetail = ref('')

const refreshDetailTable = () => {
  if (activeTab.value === 'planDayDetail' && detailTable.value) {
    detailTable.value.fetchData()
  }
}
const detailTable = ref(null)

// ---------- 运动项目列定义 ----------
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

// 其他表类似（篇幅限制，仅展示结构，实际需补充完整）
const planColumns = [{ prop: 'id', label: 'ID' }, { prop: 'planName', label: '方案名称' }]
const planFields = []
const defaultPlan = {}

const injuryColumns = [{ prop: 'id', label: 'ID' }, { prop: 'userId', label: '用户ID' }]
const injuryFields = []
const defaultInjury = {}

const workoutColumns = [{ prop: 'id', label: 'ID' }, { prop: 'userId', label: '用户ID' }]
const workoutFields = []
const defaultWorkout = {}

const ratingColumns = [{ prop: 'id', label: 'ID' }, { prop: 'userId', label: '用户ID' }, { prop: 'exerciseId', label: '运动ID' }]
const ratingFields = []
const defaultRating = {}

const detailColumns = [{ prop: 'id', label: 'ID' }, { prop: 'planId', label: '方案ID' }, { prop: 'exerciseId', label: '运动ID' }]
const detailFields = []
const defaultDetail = {}
</script>