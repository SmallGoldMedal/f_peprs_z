<template>
  <div class="profile-container">
    <el-card class="info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <el-button type="primary" link @click="openEditDialog">编辑资料</el-button>
        </div>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="账号名">{{ userStore.username }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ userInfo.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ displayGender }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ userInfo.age ? userInfo.age + '岁' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="身高">{{ userInfo.height ? userInfo.height + 'cm' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="体重">{{ userInfo.weight ? userInfo.weight + 'kg' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="BMI">{{ bmi }} {{ bmiStatus }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-dialog v-model="editInfoDialogVisible" title="编辑个人资料" width="450px" destroy-on-close>
      <el-form :model="editForm" :rules="infoRules" ref="infoFormRef" label-width="90px" size="small">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="editForm.gender" placeholder="请选择性别">
            <el-option label="男" value="1" />
            <el-option label="女" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="editForm.age" :min="0" :max="120" :step="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="身高(cm)" prop="height">
          <el-input-number v-model="editForm.height" :min="50" :max="300" :step="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="体重(kg)" prop="weight">
          <el-input-number v-model="editForm.weight" :min="20" :max="500" :step="1" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="editInfoDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="submitEditInfo" :loading="submitLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const userInfo = reactive({
  nickname: '',
  gender: null,
  age: null,
  height: null,
  weight: null
})

const displayGender = computed(() => {
  if (userInfo.gender === 1) return '男'
  if (userInfo.gender === 2) return '女'
  return '-'
})

const bmi = computed(() => {
  const height = userInfo.height
  const weight = userInfo.weight
  if (height && weight && height > 0) {
    return (weight / ((height / 100) ** 2)).toFixed(1)
  }
  return '-'
})
const bmiStatus = computed(() => {
  const val = parseFloat(bmi.value)
  if (isNaN(val)) return ''
  if (val < 18.5) return '偏瘦'
  if (val < 24) return '正常'
  if (val < 28) return '偏胖'
  return '肥胖'
})

const editInfoDialogVisible = ref(false)
const submitLoading = ref(false)
const infoFormRef = ref(null)

const editForm = reactive({
  nickname: '',
  gender: '',
  age: null,
  height: null,
  weight: null
})

const infoRules = {
  nickname: [{ required: false, message: '昵称不能为空', trigger: 'blur' }],
  age: [{ type: 'number', min: 0, max: 120, message: '年龄范围为0-120', trigger: 'blur' }],
  height: [{ type: 'number', min: 50, max: 300, message: '身高范围为50-300cm', trigger: 'blur' }],
  weight: [{ type: 'number', min: 20, max: 500, message: '体重范围为20-500kg', trigger: 'blur' }]
}

const fetchUserInfo = async () => {
  try {
    const res = await request.get('/user/info')
    if (res.data.code === 200) {
      const data = res.data.data
      userInfo.nickname = data.nickname || ''
      userInfo.gender = data.gender
      userInfo.age = data.age || null
      userInfo.height = data.height || null
      userInfo.weight = data.weight || null
      userStore.updateNickname(userInfo.nickname)
    } else {
      ElMessage.error(res.data.message || '获取用户信息失败')
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
}

const openEditDialog = () => {
  editForm.nickname = userInfo.nickname || ''
  editForm.gender = userInfo.gender !== null ? userInfo.gender.toString() : ''
  editForm.age = userInfo.age
  editForm.height = userInfo.height
  editForm.weight = userInfo.weight
  editInfoDialogVisible.value = true
}

const submitEditInfo = async () => {
  try {
    await infoFormRef.value.validate()
  } catch { return }
  submitLoading.value = true
  try {
    const payload = {
      nickname: editForm.nickname,
      gender: editForm.gender ? parseInt(editForm.gender) : null,
      age: editForm.age,
      height: editForm.height,
      weight: editForm.weight
    }
    const res = await request.put('/user/info', payload)
    if (res.data.code === 200) {
      ElMessage.success('资料更新成功')
      editInfoDialogVisible.value = false
      await fetchUserInfo()
      userStore.updateNickname(editForm.nickname)
    } else {
      ElMessage.error(res.data.message || '更新失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '更新失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 0 auto;
}
.info-card {
  border-radius: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #2c5a7a;
}
:deep(.el-descriptions__label) {
  background-color: #f8f9fc;
}
</style>