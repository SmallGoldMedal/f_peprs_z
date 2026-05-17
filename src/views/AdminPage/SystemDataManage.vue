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

      <!-- 运动方案 -->
      <el-tab-pane label="运动方案" name="plan">
        <DataTable
            ref="planTable"
            :columns="planColumns"
            :form-fields="[]"
            :default-form="{}"
            delete-api="/admin/plan"
            list-api="/admin/plan/search"
            :is-search-post="true"
        />
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
import {ref} from 'vue'
import DataTable from './DataTable.vue'

const activeTab = ref('exercise')

// ------------------- 运动项目配置 -------------------
const exerciseColumns = [
  {prop: 'id', label: 'ID', width: 80},
  {prop: 'exerciseName', label: '名称', minWidth: 120},
  {prop: 'categoryMask', label: '类别掩码', width: 100},
  {prop: 'difficulty', label: '难度', width: 80},
  {prop: 'intensity', label: '强度', width: 80},
  {prop: 'durationPerSet', label: '单组时长', width: 100},
  {prop: 'sets', label: '组数', width: 80},
  {prop: 'reps', label: '次数', width: 80}
]

const exerciseFields = [
  {prop: 'exerciseName', label: '运动名称', type: 'input', required: true},
  {prop: 'categoryMask', label: '类别掩码', type: 'number', required: true},
  {prop: 'difficulty', label: '难度(0-3)', type: 'number', required: true},
  {prop: 'intensity', label: '强度(0-2)', type: 'number', required: true},
  {prop: 'heartRateMin', label: '最低心率', type: 'number'},
  {prop: 'heartRateMax', label: '最高心率', type: 'number'},
  {prop: 'minRecommendedAge', label: '最小年龄', type: 'number'},
  {prop: 'maxRecommendedAge', label: '最大年龄', type: 'number'},
  {prop: 'targetBodyPartMask', label: '主要部位掩码', type: 'number'},
  {prop: 'secondaryBodyPartMask', label: '次要部位掩码', type: 'number'},
  {prop: 'durationPerSet', label: '单组时长(分)', type: 'number'},
  {prop: 'sets', label: '组数', type: 'number'},
  {prop: 'reps', label: '每组次数', type: 'number'},
  {prop: 'distance', label: '距离(km)', type: 'number'},
  {prop: 'frequency', label: '频率', type: 'number'},
  {prop: 'suitableEnvMask', label: '适合环境掩码', type: 'number'},
  {prop: 'contraindicatedChronicMask', label: '禁忌慢性病掩码', type: 'number'},
  {prop: 'requiredEquipment', label: '所需设备', type: 'input'},
  {prop: 'metValue', label: 'MET值', type: 'number'},
  {prop: 'cautions', label: '注意事项', type: 'textarea'}
]
const defaultExercise = {}

// ------------------- 运动方案配置（仅查询和删除） -------------------
const planColumns = [
  {prop: 'id', label: 'ID', width: 80},
  {prop: 'planName', label: '方案名称', minWidth: 150},
  {prop: 'userId', label: '用户ID', width: 100},
  {prop: 'status', label: '状态', width: 100}
]

// ------------------- 伤病记录配置 -------------------
const injuryColumns = [
  {prop: 'id', label: 'ID', width: 80},
  {prop: 'userId', label: '用户ID', width: 100},
  {prop: 'bodyPartMask', label: '部位掩码', width: 100},
  {prop: 'severity', label: '严重程度', width: 100}
]

const injuryFields = [
  {prop: 'userId', label: '用户ID', type: 'number', required: true},
  {prop: 'bodyPartMask', label: '伤病部位掩码', type: 'number', required: true},
  {prop: 'severity', label: '严重程度(0-2)', type: 'number', required: true},
  {prop: 'symptomsMask', label: '症状掩码', type: 'number'},
  {prop: 'status', label: '状态(0-2)', type: 'number', required: true},
  {prop: 'injuredDate', label: '受伤日期', type: 'datetime', required: true},
  {prop: 'recoveredDate', label: '痊愈日期', type: 'datetime'}
]
const defaultInjury = {}

// ------------------- 运动记录配置 -------------------
const workoutColumns = [
  {prop: 'id', label: 'ID', width: 80},
  {prop: 'userId', label: '用户ID', width: 100},
  {prop: 'exerciseId', label: '运动ID', width: 100},
  {prop: 'completionDate', label: '完成日期', width: 120},
  {prop: 'status', label: '状态', width: 80}
]

const workoutFields = [
  {prop: 'userId', label: '用户ID', type: 'number', required: true},
  {prop: 'planId', label: '方案ID', type: 'number'},
  {prop: 'exerciseId', label: '运动ID', type: 'number', required: true},
  {prop: 'completionDate', label: '完成日期', type: 'date', required: true},
  {prop: 'status', label: '状态(0完成/1未完成)', type: 'number', required: true},
  {prop: 'actualSets', label: '完成组数', type: 'number'},
  {prop: 'actualReps', label: '每组次数', type: 'number'},
  {prop: 'actualDuration', label: '运动时长(分)', type: 'number'},
  {prop: 'actualDistance', label: '距离(km)', type: 'number'},
  {prop: 'actualCalories', label: '消耗卡路里', type: 'number'}
]
const defaultWorkout = {}

// ------------------- 运动评分配置 -------------------
const ratingColumns = [
  {prop: 'id', label: 'ID', width: 80},
  {prop: 'userId', label: '用户ID', width: 100},
  {prop: 'exerciseId', label: '运动ID', width: 100},
  {prop: 'exerciseScore', label: '评分', width: 100}
]

const ratingFields = [
  {prop: 'userId', label: '用户ID', type: 'number', required: true},
  {prop: 'exerciseId', label: '运动ID', type: 'number', required: true},
  {prop: 'exerciseScore', label: '评分(1-10)', type: 'number', required: true},
  {prop: 'isDefault', label: '是否默认(0否/1是)', type: 'number'}
]
const defaultRating = {}
</script>