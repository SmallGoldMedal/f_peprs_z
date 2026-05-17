<template>
  <div class="log-manage">
    <el-card>
      <template #header>
        <span>推荐日志管理</span>
      </template>
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.userId" />
        </el-form-item>
        <el-form-item label="算法类型">
          <el-select v-model="searchForm.algorithmType" clearable>
            <el-option label="知识推荐" :value="0" />
            <el-option label="协同过滤" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
          :data="logList"
          v-loading="loading"
          stripe
          border
          row-key="id"
          :expand-row-keys="expandedRows"
          @expand-change="handleExpandChange"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="用户ID">{{ row.userId }}</el-descriptions-item>
                <el-descriptions-item label="用户名">{{ row.username || '-' }}</el-descriptions-item>
                <el-descriptions-item label="方案ID">{{ row.planId }}</el-descriptions-item>
                <el-descriptions-item label="算法类型">{{ row.algorithmType === 0 ? '知识推荐' : '协同过滤' }}</el-descriptions-item>
                <el-descriptions-item label="创建时间" :span="2">{{ row.createTime }}</el-descriptions-item>
                <el-descriptions-item label="用户快照" :span="2">
                  <pre class="json-pre">{{ formatJson(row.userSnapshot) }}</pre>
                </el-descriptions-item>
                <el-descriptions-item label="方案快照" :span="2">
                  <pre class="json-pre">{{ formatJson(row.planSnapshot) }}</pre>
                </el-descriptions-item>
                <el-descriptions-item label="运动记录快照" :span="2">
                  <pre class="json-pre">{{ formatJson(row.workoutRecordSnapshot) }}</pre>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="planId" label="方案ID" width="100" />
        <el-table-column label="算法" width="100">
          <template #default="{ row }">{{ row.algorithmType === 0 ? '知识推荐' : '协同过滤' }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="danger" @click="deleteLog(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchLogs"
          @current-change="fetchLogs"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const logList = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(10)
const searchForm = reactive({ userId: '', algorithmType: null })

// 展开的行ID列表
const expandedRows = ref([])

// 格式化JSON显示
const formatJson = (jsonStr) => {
  if (!jsonStr) return '无'
  try {
    const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return jsonStr
  }
}

const handleExpandChange = (row, expanded) => {
  if (expanded) {
    if (!expandedRows.value.includes(row.id)) {
      expandedRows.value.push(row.id)
    }
  } else {
    expandedRows.value = expandedRows.value.filter(id => id !== row.id)
  }
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await request.post('/admin/recommend-log/search', {
      page: page.value,
      size: size.value,
      userId: searchForm.userId || undefined,
      algorithmType: searchForm.algorithmType
    })
    if (res.data.code === 200) {
      logList.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('获取日志失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.userId = ''
  searchForm.algorithmType = null
  page.value = 1
  fetchLogs()
}

const deleteLog = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该日志吗？', '提示', { type: 'warning' })
    const res = await request.delete(`/admin/recommend-log/delete/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchLogs()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
  }
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.expand-content {
  padding: 16px;
  background-color: #fafafa;
}

.json-pre {
  margin: 0;
  font-family: monospace;
  font-size: 12px;
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow: auto;
}
</style>