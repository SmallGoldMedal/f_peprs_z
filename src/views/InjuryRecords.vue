<template>
  <div class="injury-container">
    <el-card class="injury-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>伤病记录</span>
          <el-button type="primary" @click="openAddDialog">添加记录</el-button>
        </div>
      </template>
      <el-table :data="injuryList" border stripe>
        <el-table-column prop="injuryName" label="伤病名称" min-width="120" />
        <el-table-column prop="injuryBodyPart" label="伤病部位" min-width="100" />
        <el-table-column prop="injurySeverity" label="严重程度" min-width="80" />
        <el-table-column prop="status" label="状态" min-width="80">
          <template #default="{ row }">
            {{ formatStatus(row.status) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!injuryList.length" description="暂无伤病记录" :image-size="80" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="伤病名称" prop="injuryName">
          <el-input v-model="form.injuryName" placeholder="例如：膝关节损伤" />
        </el-form-item>
        <el-form-item label="伤病部位" prop="injuryBodyPart">
          <el-input v-model="form.injuryBodyPart" placeholder="例如：膝盖、腰部、肩膀" />
        </el-form-item>
        <el-form-item label="严重程度" prop="injurySeverity">
          <el-select v-model="form.injurySeverity" placeholder="请选择严重程度">
            <el-option label="轻度" :value="0" />
            <el-option label="中度" :value="1" />
            <el-option label="重度" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" @change="onStatusChange">
            <el-option label="治疗中" :value="0" />
            <el-option label="康复中" :value="1" />
            <el-option label="已痊愈" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="injuredDate">
          <el-date-picker v-model="form.injuredDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="痊愈日期" prop="recoveredDate" v-if="form.status === 2">
          <el-date-picker v-model="form.recoveredDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Asia/Shanghai')

const injuryList = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加记录')
const loading = ref(false)
const formRef = ref(null)
const form = ref({
  id: null,
  injuryName: '',
  injuryBodyPart: '',
  injurySeverity: 0,
  status: 0,
  injuredDate: '',
  recoveredDate: ''
})

const rules = {
  injuryName: [{required: true, message: '伤病名称不能为空', trigger: 'blur'}],
  injuryBodyPart: [{required: true, message: '伤病部位不能为空', trigger: 'blur'}],
  injurySeverity: [{required: true, message: '请选择严重程度', trigger: 'change'}],
  status: [{required: true, message: '请选择状态', trigger: 'change'}]
}

const formatStatus = (status) => {
  if (status === 0) return '治疗中'
  if (status === 1) return '康复中'
  return '已痊愈'
}

// 状态变化时自动设置痊愈日期
const onStatusChange = () => {
  if (form.value.status === 2) {
    form.value.recoveredDate = dayjs().tz().format('YYYY-MM-DD')
  } else {
    form.value.recoveredDate = ''
  }
}

const fetchInjuries = async () => {
  try {
    const res = await request.post('/injury/search', { page: 1, size: 100 })
    if (res.data.code === 200) {
      injuryList.value = res.data.data.records || []
    } else {
      ElMessage.error(res.data.message || '获取伤病记录失败')
    }
  } catch (error) {
    console.error('获取伤病列表失败', error)
    ElMessage.error('获取伤病记录失败')
  }
}

const openAddDialog = () => {
  dialogTitle.value = '添加记录'
  const today = dayjs().tz().format('YYYY-MM-DD')
  form.value = {
    id: null,
    injuryName: '',
    injuryBodyPart: '',
    injurySeverity: 0,
    status: 0,
    injuredDate: today,
    recoveredDate: ''
  }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogTitle.value = '编辑伤病'
  form.value = {
    id: row.id,
    injuryName: row.injuryName,
    injuryBodyPart: row.injuryBodyPart,
    injurySeverity: row.injurySeverity,
    status: row.status,
    injuredDate: row.injuredDate || '',
    recoveredDate: row.recoveredDate || ''
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    const payload = {
      injuryName: form.value.injuryName,
      injuryBodyPart: form.value.injuryBodyPart,
      injurySeverity: form.value.injurySeverity,
      status: form.value.status,
      injuredDate: form.value.injuredDate,
      recoveredDate: form.value.recoveredDate
    }
    let res
    if (form.value.id) {
      res = await request.put('/injury/update', { id: form.value.id, ...payload })
    } else {
      res = await request.post('/injury/add', payload)
    }
    if (res.data.code === 200) {
      ElMessage.success(form.value.id ? '更新成功' : '添加成功')
      dialogVisible.value = false
      await fetchInjuries()
    } else {
      ElMessage.error(res.data.message || '操作失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该伤病记录吗？', '提示', {type: 'warning'})
    const res = await request.delete(`/injury/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      await fetchInjuries()
    } else {
      ElMessage.error(res.data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  fetchInjuries()
})
</script>

<style scoped>
.injury-container {
  max-width: 1200px;
  margin: 0 auto;
}

.injury-card {
  border-radius: 16px;
  background-color: #ffffff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #2c5a7a;
}
</style>