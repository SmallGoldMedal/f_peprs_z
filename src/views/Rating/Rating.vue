<template>
  <div class="rating-page">
    <el-card class="rating-card">
      <template #header>
        <div class="card-header">
          <span>我的运动评分</span>
          <el-button type="primary" @click="showAddDialog">添加评分</el-button>
        </div>
      </template>

      <el-table :data="ratingList" v-loading="loading" stripe>
        <el-table-column prop="exerciseId" label="运动ID" width="100" />
        <el-table-column prop="exerciseScore" label="评分" width="100">
          <template #default="{ row }">
            <el-rate v-model="row.exerciseScore" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column prop="isDefault" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isDefault === 1 ? 'info' : 'success'">{{ row.isDefault === 1 ? '默认' : '手动' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteRating(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑评分' : '添加评分'" width="400px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="运动ID" prop="exerciseId">
          <el-input-number v-model="form.exerciseId" :min="1" />
        </el-form-item>
        <el-form-item label="评分(1-10)" prop="exerciseScore">
          <el-slider v-model="form.exerciseScore" :min="1" :max="10" show-stops />
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
const ratingList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({ id: null, exerciseId: null, exerciseScore: 5 })

const rules = {
  exerciseId: [{ required: true, message: '请输入运动ID', trigger: 'blur' }],
  exerciseScore: [{ required: true, message: '请选择评分', trigger: 'change' }]
}

const fetchRatings = async () => {
  loading.value = true
  try {
    const res = await request.get('/user/exercise-rating/list')
    if (res.data.code === 200) {
      ratingList.value = res.data.data || []
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('获取评分列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  form.id = null
  form.exerciseId = null
  form.exerciseScore = 5
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  isEdit.value = true
  form.id = row.id
  form.exerciseId = row.exerciseId
  form.exerciseScore = row.exerciseScore
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch { return }
  submitting.value = true
  try {
    let res
    if (isEdit.value) {
      res = await request.put(`/user/exercise-rating/update/${form.id}`, { exerciseScore: form.exerciseScore })
    } else {
      res = await request.post('/user/exercise-rating/add', { exerciseId: form.exerciseId, exerciseScore: form.exerciseScore })
    }
    if (res.data.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      fetchRatings()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteRating = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该评分吗？', '提示', { type: 'warning' })
    const res = await request.delete(`/user/exercise-rating/delete/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchRatings()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch { }
}

onMounted(() => {
  fetchRatings()
})
</script>

<style scoped>
.rating-page {
  max-width: 1000px;
  margin: 0 auto;
}
.rating-card {
  border-radius: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>