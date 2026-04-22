<template>
  <div class="exercise-page">
    <el-card class="exercise-card">
      <template #header>
        <div class="card-header">
          <span>运动项目库</span>
          <div class="filter-bar">
            <el-select v-model="query.categoryMask" placeholder="类别" clearable @change="handleSearch">
              <el-option label="有氧" :value="1" />
              <el-option label="力量" :value="2" />
              <el-option label="柔韧" :value="4" />
              <el-option label="平衡" :value="8" />
              <el-option label="热身" :value="16" />
              <el-option label="放松" :value="32" />
            </el-select>
            <el-select v-model="query.difficulty" placeholder="难度" clearable @change="handleSearch">
              <el-option label="简单" :value="0" />
              <el-option label="普通" :value="1" />
              <el-option label="较难" :value="2" />
              <el-option label="很难" :value="3" />
            </el-select>
            <el-select v-model="query.intensity" placeholder="强度" clearable @change="handleSearch">
              <el-option label="低" :value="0" />
              <el-option label="中" :value="1" />
              <el-option label="高" :value="2" />
            </el-select>
            <el-select v-model="query.suitableEnvMask" placeholder="适合环境" clearable @change="handleSearch">
              <el-option label="居家" :value="1" />
              <el-option label="健身房" :value="2" />
              <el-option label="户外" :value="4" />
            </el-select>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="exerciseName" label="运动名称" width="180" />
        <el-table-column label="类别" width="100">
          <template #default="{ row }">
            <span>{{ getCategoryText(row.categoryMask) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="getDifficultyType(row.difficulty)">{{ getDifficultyText(row.difficulty) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="强度" width="80">
          <template #default="{ row }">
            <el-tag :type="getIntensityType(row.intensity)">{{ getIntensityText(row.intensity) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="durationPerSet" label="单组时长(分钟)" width="120" />
        <el-table-column prop="sets" label="组数" width="80" />
        <el-table-column prop="reps" label="每组次数" width="100" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
            v-model:current-page="query.page"
            v-model:page-size="query.size"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSearch"
            @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" :title="detailData?.exerciseName || '运动详情'" width="600px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="运动名称">{{ detailData.exerciseName }}</el-descriptions-item>
        <el-descriptions-item label="类别">{{ getCategoryText(detailData.categoryMask) }}</el-descriptions-item>
        <el-descriptions-item label="难度">{{ getDifficultyText(detailData.difficulty) }}</el-descriptions-item>
        <el-descriptions-item label="强度">{{ getIntensityText(detailData.intensity) }}</el-descriptions-item>
        <el-descriptions-item label="最低心率(bpm)">{{ detailData.heartRateMin ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="最高心率(bpm)">{{ detailData.heartRateMax ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="推荐年龄">{{ detailData.minRecommendedAge ?? '-' }} - {{ detailData.maxRecommendedAge ?? '-' }} 岁</el-descriptions-item>
        <el-descriptions-item label="单组时长">{{ detailData.durationPerSet ?? '-' }} 分钟</el-descriptions-item>
        <el-descriptions-item label="组数">{{ detailData.sets ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="每组次数">{{ detailData.reps ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="距离">{{ detailData.distance ?? '-' }} km</el-descriptions-item>
        <el-descriptions-item label="频率">{{ detailData.frequency ?? '-' }} 次/分钟</el-descriptions-item>
        <el-descriptions-item label="适合环境">{{ getEnvText(detailData.suitableEnvMask) }}</el-descriptions-item>
        <el-descriptions-item label="所需设备">{{ detailData.requiredEquipment || '无' }}</el-descriptions-item>
        <el-descriptions-item label="MET值">{{ detailData.metValue ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="注意事项" :span="2">{{ detailData.cautions || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from '@/utils/request'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const detailVisible = ref(false)
const detailData = ref(null)

const query = reactive({
  page: 1,
  size: 10,
  categoryMask: null,
  difficulty: null,
  intensity: null,
  suitableEnvMask: null
})

// 类别映射（位掩码）
const categoryMap = {
  1: '有氧', 2: '力量', 4: '柔韧', 8: '平衡', 16: '热身', 32: '放松'
}
const getCategoryText = (mask) => {
  if (!mask) return '-'
  const texts = []
  for (const [val, text] of Object.entries(categoryMap)) {
    if (mask & parseInt(val)) texts.push(text)
  }
  return texts.join(',') || '-'
}

const difficultyMap = { 0: '简单', 1: '普通', 2: '较难', 3: '很难' }
const getDifficultyText = (val) => difficultyMap[val] || '-'
const getDifficultyType = (val) => {
  if (val === 0) return 'success'
  if (val === 1) return 'info'
  if (val === 2) return 'warning'
  if (val === 3) return 'danger'
  return 'info'
}

const intensityMap = { 0: '低', 1: '中', 2: '高' }
const getIntensityText = (val) => intensityMap[val] || '-'
const getIntensityType = (val) => {
  if (val === 0) return 'success'
  if (val === 1) return 'warning'
  if (val === 2) return 'danger'
  return 'info'
}

const envMap = { 1: '居家', 2: '健身房', 4: '户外' }
const getEnvText = (mask) => {
  if (!mask) return '-'
  const texts = []
  for (const [val, text] of Object.entries(envMap)) {
    if (mask & parseInt(val)) texts.push(text)
  }
  return texts.join(',') || '-'
}

const fetchExercises = async () => {
  loading.value = true
  try {
    const res = await axios.post('/exercise/search', query)
    if (res.data.code === 200) {
      tableData.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.message || '获取数据失败')
    }
  } catch (error) {
    ElMessage.error('请求失败，请检查网络')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchExercises()
}

const resetSearch = () => {
  query.categoryMask = null
  query.difficulty = null
  query.intensity = null
  query.suitableEnvMask = null
  query.page = 1
  fetchExercises()
}

const showDetail = async (row) => {
  try {
    const res = await axios.get(`/exercise/${row.id}`)
    if (res.data.code === 200) {
      detailData.value = res.data.data
      detailVisible.value = true
    } else {
      ElMessage.error(res.data.message || '获取详情失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  }
}

onMounted(() => {
  fetchExercises()
})
</script>

<style scoped>
.exercise-page {
  max-width: 1400px;
  margin: 0 auto;
}

.exercise-card {
  border-radius: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  font-weight: 600;
  font-size: 18px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>