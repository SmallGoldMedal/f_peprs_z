<template>
  <div class="workout-page">
    <el-card class="record-card">
      <template #header>
        <div class="card-header">
          <span>我的运动记录</span>
          <el-button type="primary" @click="showAddDialog">添加记录</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item label="开始日期">
          <el-date-picker v-model="query.startDate" type="date" placeholder="开始日期" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="query.endDate" type="date" placeholder="结束日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchRecords">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="recordList" v-loading="loading" stripe>
        <el-table-column prop="completionDate" label="日期" width="120" />
        <el-table-column prop="exerciseId" label="运动ID" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">{{ row.status === 0 ? '完成' : '未完成' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="actualSets" label="组数" width="80" />
        <el-table-column prop="actualReps" label="次数" width="80" />
        <el-table-column prop="actualDuration" label="时长(分钟)" width="100" />
        <el-table-column prop="actualDistance" label="距离(km)" width="100" />
        <el-table-column prop="actualCalories" label="消耗(kcal)" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteRecord(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑记录' : '添加记录'" width="500px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="运动项目ID" prop="exerciseId">
          <el-input-number v-model="form.exerciseId" :min="1" />
        </el-form-item>
        <el-form-item label="完成日期" prop="completionDate">
          <el-date-picker v-model="form.completionDate" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="0">完成</el-radio>
            <el-radio :label="1">未完成</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="组数" prop="actualSets">
          <el-input-number v-model="form.actualSets" :min="0" />
        </el-form-item>
        <el-form-item label="次数" prop="actualReps">
          <el-input-number v-model="form.actualReps" :min="0" />
        </el-form-item>
        <el-form-item label="时长(分钟)" prop="actualDuration">
          <el-input-number v-model="form.actualDuration" :min="0" />
        </el-form-item>
        <el-form-item label="距离(km)" prop="actualDistance">
          <el-input-number v-model="form.actualDistance" :min="0" :step="0.1" />
        </el-form-item>
        <el-form-item label="消耗(kcal)" prop="actualCalories">
          <el-input-number v-model="form.actualCalories" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const recordList = ref([])
const query = reactive({ startDate: null, endDate: null })
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  exerciseId: null,
  completionDate: null,
  status: 0,
  actualSets: null,
  actualReps: null,
  actualDuration: null,
  actualDistance: null,
  actualCalories: null,
  planId: null
})

const rules = {
  exerciseId: [{ required: true, message: '请输入运动项目ID', trigger: 'blur' }],
  completionDate: [{ required: true, message: '请选择完成日期', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const params = { page: 1, size: 100 }
    if (query.startDate) params.startDate = new Date(query.startDate).toISOString().split('T')[0]
    if (query.endDate) params.endDate = new Date(query.endDate).toISOString().split('T')[0]
    const res = await request.post('/user/workout-record/search', params)
    if (res.data.code === 200) {
      recordList.value = res.data.data.records || []
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('获取记录失败')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  query.startDate = null
  query.endDate = null
  fetchRecords()
}

const showAddDialog = () => {
  isEdit.value = false
  Object.assign(form, { id: null, exerciseId: null, completionDate: null, status: 0, actualSets: null, actualReps: null, actualDuration: null, actualDistance: null, actualCalories: null, planId: null })
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    exerciseId: row.exerciseId,
    completionDate: row.completionDate,
    status: row.status,
    actualSets: row.actualSets,
    actualReps: row.actualReps,
    actualDuration: row.actualDuration,
    actualDistance: row.actualDistance,
    actualCalories: row.actualCalories,
    planId: row.planId
  })
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch { return }
  submitting.value = true
  try {
    const payload = { ...form }
    if (payload.completionDate) payload.completionDate = new Date(payload.completionDate).toISOString().split('T')[0]
    let res
    if (isEdit.value) {
      res = await request.put(`/user/workout-record/update/${form.id}`, payload)
    } else {
      res = await request.post('/user/workout-record/add', payload)
    }
    if (res.data.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      fetchRecords()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteRecord = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该记录吗？', '提示', { type: 'warning' })
    const res = await request.delete(`/user/workout-record/delete/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchRecords()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch { }
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.workout-page {
  max-width: 1400px;
  margin: 0 auto;
}
.record-card {
  border-radius: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-form {
  margin-bottom: 16px;
}
</style>