<template>
  <div class="exercise-page">
    <el-card class="exercise-card">
      <template #header>
        <div class="card-header">
          <span>运动项目库</span>
        </div>
      </template>

      <!-- 搜索筛选栏 -->
      <div class="search-section">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-select
                v-model="selectedCategories"
                multiple
                collapse-tags
                placeholder="类别"
                clearable
                @change="handleCategoryChange"
            >
              <el-option label="有氧" :value="1" />
              <el-option label="力量" :value="2" />
              <el-option label="柔韧" :value="4" />
              <el-option label="平衡" :value="8" />
              <el-option label="热身" :value="16" />
              <el-option label="放松" :value="32" />
            </el-select>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-select v-model="query.difficulty" placeholder="难度" clearable @change="handleSearch">
              <el-option label="简单" :value="0" />
              <el-option label="普通" :value="1" />
              <el-option label="较难" :value="2" />
              <el-option label="很难" :value="3" />
            </el-select>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-select v-model="query.intensity" placeholder="强度" clearable @change="handleSearch">
              <el-option label="低" :value="0" />
              <el-option label="中" :value="1" />
              <el-option label="高" :value="2" />
            </el-select>
          </el-col>

          <el-col :xs="24" :sm="12" :md="6" :lg="4">
            <el-select
                v-model="selectedEnvs"
                multiple
                collapse-tags
                placeholder="适合环境"
                clearable
                @change="handleEnvChange"
            >
              <el-option label="居家" :value="1" />
              <el-option label="健身房" :value="2" />
              <el-option label="户外" :value="4" />
            </el-select>
          </el-col>

          <el-col :xs="24" :sm="24" :md="6" :lg="8" class="search-buttons">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
        </el-row>
      </div>

      <div class="table-wrapper">
        <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" fixed="left" />
          <el-table-column prop="exerciseName" label="运动名称" width="180" fixed="left" />
          <el-table-column label="类别" width="100">
            <template #default="{ row }">{{ getCategoryText(row.categoryMask) }}</template>
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

          <!-- 主要锻炼部位 -->
          <el-table-column label="主要锻炼部位" width="120" show-overflow-tooltip>
            <template #default="{ row }">{{ getBodyPartText(row.targetBodyPartMask) }}</template>
          </el-table-column>

<!--          &lt;!&ndash; 次要锻炼部位 &ndash;&gt;-->
<!--          <el-table-column label="次要锻炼部位" width="120" show-overflow-tooltip>-->
<!--            <template #default="{ row }">{{ getBodyPartText(row.secondaryBodyPartMask) }}</template>-->
<!--          </el-table-column>-->

          <!-- 适合环境 -->
          <el-table-column label="适合环境" width="100" show-overflow-tooltip>
            <template #default="{ row }">{{ getEnvText(row.suitableEnvMask) }}</template>
          </el-table-column>

          <!-- 所需设备 -->
          <el-table-column prop="requiredEquipment" label="所需设备" width="150" show-overflow-tooltip />

          <!-- 注意事项 -->
          <el-table-column prop="cautions" label="注意事项" width="180" show-overflow-tooltip />

          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="showDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination">
        <el-pagination
            v-model:current-page="query.page"
            v-model:page-size="query.size"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" :title="detailData?.exerciseName || '运动详情'" width="600px">
      <div v-if="detailData">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="运动名称">{{ detailData.exerciseName }}</el-descriptions-item>
          <el-descriptions-item label="类别" v-if="detailData.categoryMask">{{ getCategoryText(detailData.categoryMask) }}</el-descriptions-item>
          <el-descriptions-item label="难度" v-if="detailData.difficulty !== undefined && detailData.difficulty !== null">{{ getDifficultyText(detailData.difficulty) }}</el-descriptions-item>
          <el-descriptions-item label="强度" v-if="detailData.intensity !== undefined && detailData.intensity !== null">{{ getIntensityText(detailData.intensity) }}</el-descriptions-item>

          <el-descriptions-item label="建议心率范围" v-if="(detailData.heartRateMin !== null && detailData.heartRateMin !== undefined) || (detailData.heartRateMax !== null && detailData.heartRateMax !== undefined)">
            <span v-if="detailData.heartRateMin !== null && detailData.heartRateMin !== undefined && detailData.heartRateMax !== null && detailData.heartRateMax !== undefined">
              {{ detailData.heartRateMin }} - {{ detailData.heartRateMax }} bpm
            </span>
            <span v-else-if="detailData.heartRateMin !== null && detailData.heartRateMin !== undefined">≥ {{ detailData.heartRateMin }} bpm</span>
            <span v-else-if="detailData.heartRateMax !== null && detailData.heartRateMax !== undefined">≤ {{ detailData.heartRateMax }} bpm</span>
          </el-descriptions-item>

          <el-descriptions-item label="推荐年龄范围" v-if="(detailData.minRecommendedAge !== null && detailData.minRecommendedAge !== undefined) || (detailData.maxRecommendedAge !== null && detailData.maxRecommendedAge !== undefined)">
            <span v-if="detailData.minRecommendedAge !== null && detailData.minRecommendedAge !== undefined && detailData.maxRecommendedAge !== null && detailData.maxRecommendedAge !== undefined">
              {{ detailData.minRecommendedAge }} - {{ detailData.maxRecommendedAge }} 岁
            </span>
            <span v-else-if="detailData.minRecommendedAge !== null && detailData.minRecommendedAge !== undefined">≥ {{ detailData.minRecommendedAge }} 岁</span>
            <span v-else-if="detailData.maxRecommendedAge !== null && detailData.maxRecommendedAge !== undefined">≤ {{ detailData.maxRecommendedAge }} 岁</span>
          </el-descriptions-item>

          <el-descriptions-item label="主要锻炼部位" v-if="detailData.targetBodyPartMask">{{ getBodyPartText(detailData.targetBodyPartMask) }}</el-descriptions-item>
          <el-descriptions-item label="次要锻炼部位" v-if="detailData.secondaryBodyPartMask">{{ getBodyPartText(detailData.secondaryBodyPartMask) }}</el-descriptions-item>
          <el-descriptions-item label="适合环境" v-if="detailData.suitableEnvMask">{{ getEnvText(detailData.suitableEnvMask) }}</el-descriptions-item>
          <el-descriptions-item label="所需设备" v-if="detailData.requiredEquipment">{{ detailData.requiredEquipment }}</el-descriptions-item>
          <el-descriptions-item label="单组时长" v-if="detailData.durationPerSet !== null && detailData.durationPerSet !== undefined">{{ detailData.durationPerSet }} 分钟</el-descriptions-item>
          <el-descriptions-item label="组数" v-if="detailData.sets !== null && detailData.sets !== undefined">{{ detailData.sets }}</el-descriptions-item>
          <el-descriptions-item label="每组次数" v-if="detailData.reps !== null && detailData.reps !== undefined">{{ detailData.reps }}</el-descriptions-item>
          <el-descriptions-item label="距离" v-if="detailData.distance !== null && detailData.distance !== undefined">{{ detailData.distance }} km</el-descriptions-item>
          <el-descriptions-item label="频率" v-if="detailData.frequency !== null && detailData.frequency !== undefined">{{ detailData.frequency }} 次/分钟</el-descriptions-item>
          <el-descriptions-item label="MET值" v-if="detailData.metValue !== null && detailData.metValue !== undefined">{{ detailData.metValue }}</el-descriptions-item>
          <el-descriptions-item label="注意事项" v-if="detailData.cautions">{{ detailData.cautions }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from '@/utils/request.js'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const detailVisible = ref(false)
const detailData = ref(null)

const selectedCategories = ref([])
const selectedEnvs = ref([])

const query = reactive({
  page: 1,
  size: 10,
  difficulty: null,
  intensity: null,
  categoryMask: null,
  suitableEnvMask: null
})

const handleCategoryChange = (vals) => {
  let mask = 0
  vals.forEach(v => mask |= v)
  query.categoryMask = mask || null
  handleSearch()
}

const handleEnvChange = (vals) => {
  let mask = 0
  vals.forEach(v => mask |= v)
  query.suitableEnvMask = mask || null
  handleSearch()
}

// 类别文本
const categoryMap = { 1: '有氧', 2: '力量', 4: '柔韧', 8: '平衡', 16: '热身', 32: '放松' }
const getCategoryText = (mask) => {
  if (!mask) return '-'
  const texts = []
  for (const [val, text] of Object.entries(categoryMap)) {
    if (mask & parseInt(val)) texts.push(text)
  }
  return texts.join(',') || '-'
}

// 难度
const difficultyMap = { 0: '简单', 1: '普通', 2: '较难', 3: '很难' }
const getDifficultyText = (val) => difficultyMap[val] || '-'
const getDifficultyType = (val) => {
  if (val === 0) return 'success'
  if (val === 1) return 'info'
  if (val === 2) return 'warning'
  if (val === 3) return 'danger'
  return 'info'
}

// 强度
const intensityMap = { 0: '低', 1: '中', 2: '高' }
const getIntensityText = (val) => intensityMap[val] || '-'
const getIntensityType = (val) => {
  if (val === 0) return 'success'
  if (val === 1) return 'warning'
  if (val === 2) return 'danger'
  return 'info'
}

// 环境
const envMap = { 1: '居家', 2: '健身房', 4: '户外' }
const getEnvText = (mask) => {
  if (!mask) return '-'
  const texts = []
  for (const [val, text] of Object.entries(envMap)) {
    if (mask & parseInt(val)) texts.push(text)
  }
  return texts.join(',') || '-'
}

// 锻炼部位（主要/次要）映射
const bodyPartMap = { 1: '头', 2: '手', 4: '脚', 8: '肩', 16: '脖', 32: '胯', 64: '身子', 128: '内脏', 256: '骨' }
const getBodyPartText = (mask) => {
  if (!mask) return '-'
  const parts = []
  for (const [val, text] of Object.entries(bodyPartMap)) {
    if (mask & parseInt(val)) parts.push(text)
  }
  return parts.join(',') || '-'
}

// 获取运动项目列表
const fetchExercises = async () => {
  // 确保分页参数合法
  if (!query.size || query.size < 1) query.size = 10
  if (query.size > 100) query.size = 100
  if (!query.page || query.page < 1) query.page = 1

  loading.value = true
  try {
    const res = await axios.post('/exercise/search', {
      page: query.page,
      size: query.size,
      categoryMask: query.categoryMask,
      difficulty: query.difficulty,
      intensity: query.intensity,
      suitableEnvMask: query.suitableEnvMask
    })
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

// 页码变化时调用
const handlePageChange = () => {
  fetchExercises()
}

// 每页条数变化时调用
const handleSizeChange = () => {
  fetchExercises()
}

const handleSearch = () => {
  query.page = 1
  fetchExercises()
}

const resetSearch = () => {
  selectedCategories.value = []
  selectedEnvs.value = []
  query.difficulty = null
  query.intensity = null
  query.categoryMask = null
  query.suitableEnvMask = null
  query.page = 1
  query.size = 10   // 确保重置每页条数
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
  max-width: 100%;
  margin: 0 auto;
  overflow-x: auto;
}

.exercise-card {
  border-radius: 16px;
}

.card-header {
  font-weight: 600;
  font-size: 18px;
}

.search-section {
  margin-bottom: 20px;
  padding: 0 0 12px 0;
}

.search-section .el-select {
  width: 100%;
}

.search-buttons {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.table-wrapper {
  overflow-x: auto;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .search-buttons {
    margin-top: 12px;
    justify-content: flex-start;
  }
}
</style>