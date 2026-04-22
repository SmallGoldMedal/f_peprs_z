<template>
  <div class="injury-page">
    <el-card class="injury-card">
      <template #header>
        <div class="card-header">
          <span>我的伤病记录</span>
          <el-button type="primary" @click="showAddDialog">添加记录</el-button>
        </div>
      </template>

      <el-table :data="injuryList" v-loading="loading" stripe>
        <el-table-column prop="bodyPartMask" label="部位" width="100">
          <template #default="{ row }">{{ getBodyPartText(row.bodyPartMask) }}</template>
        </el-table-column>
        <el-table-column label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)">{{ getSeverityText(row.severity) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="症状" width="120">
          <template #default="{ row }">{{ getSymptomsText(row.symptomsMask) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="injuredDate" label="受伤日期" width="120" />
        <el-table-column prop="recoveredDate" label="痊愈日期" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteInjury(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑伤病' : '添加伤病'" width="600px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="受伤部位" prop="bodyPartMask">
          <el-checkbox-group @change="updateBodyPartMask">
            <el-checkbox :label="1">头</el-checkbox>
            <el-checkbox :label="2">手</el-checkbox>
            <el-checkbox :label="4">脚</el-checkbox>
            <el-checkbox :label="8">肩</el-checkbox>
            <el-checkbox :label="16">脖</el-checkbox>
            <el-checkbox :label="32">胯</el-checkbox>
            <el-checkbox :label="64">身子</el-checkbox>
            <el-checkbox :label="128">内脏</el-checkbox>
            <el-checkbox :label="256">骨</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-radio-group v-model="form.severity">
            <el-radio :label="0">轻微</el-radio>
            <el-radio :label="1">中等严重</el-radio>
            <el-radio :label="2">严重</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="症状" prop="symptomsMask">
          <el-checkbox-group @change="updateSymptomsMask">
            <el-checkbox :label="1">擦伤</el-checkbox>
            <el-checkbox :label="2">有伤痕</el-checkbox>
            <el-checkbox :label="4">出血</el-checkbox>
            <el-checkbox :label="8">疼痛</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="0">治疗中</el-radio>
            <el-radio :label="1">恢复中</el-radio>
            <el-radio :label="2">已痊愈</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="受伤日期" prop="injuredDate">
          <el-date-picker v-model="form.injuredDate" type="datetime" placeholder="选择日期时间" />
        </el-form-item>
        <el-form-item label="痊愈日期" prop="recoveredDate">
          <el-date-picker v-model="form.recoveredDate" type="datetime" placeholder="选择日期时间" />
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
const injuryList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  bodyPartMask: 0,
  severity: 0,
  symptomsMask: 0,
  status: 0,
  injuredDate: null,
  recoveredDate: null
})

const rules = {
  bodyPartMask: [{ required: true, message: '请选择受伤部位', trigger: 'change' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  injuredDate: [{ required: true, message: '请选择受伤日期', trigger: 'change' }]
}

const bodyPartMap = { 1: '头', 2: '手', 4: '脚', 8: '肩', 16: '脖', 32: '胯', 64: '身子', 128: '内脏', 256: '骨' }
const getBodyPartText = (mask) => {
  if (!mask) return '-'
  const parts = []
  for (const [val, text] of Object.entries(bodyPartMap)) {
    if (mask & parseInt(val)) parts.push(text)
  }
  return parts.join(',') || '-'
}

const severityText = { 0: '轻微', 1: '中等严重', 2: '严重' }
const getSeverityText = (val) => severityText[val] || '-'
const getSeverityType = (val) => {
  if (val === 0) return 'success'
  if (val === 1) return 'warning'
  return 'danger'
}

const symptomsMap = { 1: '擦伤', 2: '有伤痕', 4: '出血', 8: '疼痛' }
const getSymptomsText = (mask) => {
  if (!mask) return '-'
  const syms = []
  for (const [val, text] of Object.entries(symptomsMap)) {
    if (mask & parseInt(val)) syms.push(text)
  }
  return syms.join(',') || '-'
}

const statusText = { 0: '治疗中', 1: '恢复中', 2: '已痊愈' }
const getStatusText = (val) => statusText[val] || '-'
const getStatusType = (val) => {
  if (val === 0) return 'danger'
  if (val === 1) return 'warning'
  return 'success'
}

const updateBodyPartMask = (vals) => {
  let mask = 0
  vals.forEach(v => mask |= v)
  form.bodyPartMask = mask
}

const updateSymptomsMask = (vals) => {
  let mask = 0
  vals.forEach(v => mask |= v)
  form.symptomsMask = mask
}

const fetchInjuries = async () => {
  loading.value = true
  try {
    const res = await request.get('/user/injury/list')
    if (res.data.code === 200) {
      injuryList.value = res.data.data || []
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('获取伤病记录失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  form.id = null
  form.bodyPartMask = 0
  form.severity = 0
  form.symptomsMask = 0
  form.status = 0
  form.injuredDate = null
  form.recoveredDate = null
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    bodyPartMask: row.bodyPartMask,
    severity: row.severity,
    symptomsMask: row.symptomsMask,
    status: row.status,
    injuredDate: row.injuredDate,
    recoveredDate: row.recoveredDate
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
    if (payload.injuredDate) payload.injuredDate = new Date(payload.injuredDate).toISOString()
    if (payload.recoveredDate) payload.recoveredDate = new Date(payload.recoveredDate).toISOString()
    let res
    if (isEdit.value) {
      res = await request.put(`/user/injury/update/${form.id}`, payload)
    } else {
      res = await request.post('/user/injury/add', payload)
    }
    if (res.data.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      fetchInjuries()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteInjury = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该伤病记录吗？', '提示', { type: 'warning' })
    const res = await request.delete(`/user/injury/delete/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchInjuries()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch { }
}

onMounted(() => {
  fetchInjuries()
})
</script>

<style scoped>
.injury-page {
  max-width: 1200px;
  margin: 0 auto;
}
.injury-card {
  border-radius: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>