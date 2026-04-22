// 文件位置：C:\Users\12243\Desktop\f_peprs_z\src\views\AdminPage\LogManage.vue
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
      <el-table :data="logList" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userId" label="用户ID" width="100" />
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
  } catch {}
}

onMounted(() => {
  fetchLogs()
})
</script>