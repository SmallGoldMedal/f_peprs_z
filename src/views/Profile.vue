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
        <el-descriptions-item label="账号名">{{ accountname }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ userInfo.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ displayGender }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ userInfo.age ? userInfo.age + '岁' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="身高">{{ userInfo.height ? userInfo.height + 'cm' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="体重">{{ userInfo.weight ? userInfo.weight + 'kg' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="运动目标">{{ displayTarget }}</el-descriptions-item>
        <el-descriptions-item label="运动环境">{{ displayEnvironment }}</el-descriptions-item>
        <el-descriptions-item label="运动经验">{{ displayExperience }}</el-descriptions-item>
        <el-descriptions-item label="BMI">{{ bmi }} {{ bmiStatus }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-dialog v-model="editInfoDialogVisible" title="编辑个人资料" width="450px" destroy-on-close>
      <el-form :model="editForm" :rules="infoRules" ref="infoFormRef" label-width="90px" size="small">
        <el-form-item label="昵称" prop="username">
          <el-input v-model="editForm.username" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="editForm.gender" placeholder="请选择性别">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
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
        <el-form-item label="运动目标" prop="userTarget">
          <el-select v-model="editForm.userTarget" multiple placeholder="请选择运动目标">
            <el-option label="有氧" :value="1" />
            <el-option label="力量" :value="2" />
            <el-option label="柔韧" :value="4" />
            <el-option label="平衡" :value="8" />
          </el-select>
        </el-form-item>
        <el-form-item label="运动环境" prop="userEnvironment">
          <el-select v-model="editForm.userEnvironment" multiple placeholder="请选择运动环境">
            <el-option label="居家" :value="1" />
            <el-option label="健身房" :value="2" />
            <el-option label="户外" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="运动经验" prop="experience">
          <el-select v-model="editForm.experience" placeholder="请选择运动经验">
            <el-option label="入门" :value="0" />
            <el-option label="初级" :value="1" />
            <el-option label="中级" :value="2" />
            <el-option label="高级" :value="3" />
          </el-select>
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
const accountname = computed(() => userStore.accountname)

const userInfo = reactive({
  username: '',
  gender: null,
  age: null,
  height: null,
  weight: null,
  userTarget: null,
  userEnvironment: null,
  experience: null
})

const displayGender = computed(() => {
  if (userInfo.gender === 1) return '男'
  if (userInfo.gender === 2) return '女'
  return '-'
})

const displayTarget = computed(() => {
  const mask = userInfo.userTarget
  if (!mask) return '未指定'
  const map = { 1: '有氧', 2: '力量', 4: '柔韧', 8: '平衡' }
  const parts = []
  for (const [val, name] of Object.entries(map)) {
    if (mask & parseInt(val)) parts.push(name)
  }
  return parts.join('、') || '未指定'
})

const displayEnvironment = computed(() => {
  const mask = userInfo.userEnvironment
  if (!mask) return '未指定'
  const map = { 1: '居家', 2: '健身房', 4: '户外' }
  const parts = []
  for (const [val, name] of Object.entries(map)) {
    if (mask & parseInt(val)) parts.push(name)
  }
  return parts.join('、') || '未指定'
})

const displayExperience = computed(() => {
  if (userInfo.experience === 0) return '入门'
  if (userInfo.experience === 1) return '初级'
  if (userInfo.experience === 2) return '中级'
  if (userInfo.experience === 3) return '高级'
  return '入门'
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
  username: '',
  gender: '',
  age: null,
  height: null,
  weight: null,
  userTarget: [],
  userEnvironment: [],
  experience: null
})

const infoRules = {
  username: [{ required: false, message: '昵称不能为空', trigger: 'blur' }],
  age: [{ type: 'number', min: 0, max: 120, message: '年龄范围为0-120', trigger: 'blur' }],
  height: [{ type: 'number', min: 50, max: 300, message: '身高范围为50-300cm', trigger: 'blur' }],
  weight: [{ type: 'number', min: 20, max: 500, message: '体重范围为20-500kg', trigger: 'blur' }],
  experience: [{ required: false, message: '请选择运动经验', trigger: 'change' }]
}

const fetchUserInfo = async () => {
  try {
    const res = await request.get('/user/info')
    if (res.data.code === 200) {
      const data = res.data.data
      userInfo.username = data.username || ''
      userInfo.gender = data.gender
      userInfo.age = data.age || null
      userInfo.height = data.height || null
      userInfo.weight = data.weight || null
      userInfo.userTarget = data.userTarget || null
      userInfo.userEnvironment = data.userEnvironment || null
      userInfo.experience = data.experience !== undefined ? data.experience : null
      userStore.updateNickname(userInfo.username)
    } else {
      ElMessage.error(res.data.message || '获取用户信息失败')
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
}

// 掩码转数组
const maskToArray = (mask, options) => {
  if (!mask) return []
  const result = []
  for (const opt of options) {
    if (mask & opt.value) result.push(opt.value)
  }
  return result
}

const openEditDialog = () => {
  editForm.username = userInfo.username || ''
  if (userInfo.gender === 1) editForm.gender = '男'
  else if (userInfo.gender === 2) editForm.gender = '女'
  else editForm.gender = ''
  editForm.age = userInfo.age
  editForm.height = userInfo.height
  editForm.weight = userInfo.weight
  // 运动目标数组
  const targetOptions = [{ value: 1 }, { value: 2 }, { value: 4 }, { value: 8 }]
  editForm.userTarget = maskToArray(userInfo.userTarget, targetOptions)
  // 运动环境数组
  const envOptions = [{ value: 1 }, { value: 2 }, { value: 4 }]
  editForm.userEnvironment = maskToArray(userInfo.userEnvironment, envOptions)
  editForm.experience = userInfo.experience !== null ? userInfo.experience : 0
  editInfoDialogVisible.value = true
}

const submitEditInfo = async () => {
  try {
    await infoFormRef.value.validate()
  } catch {
    return
  }
  submitLoading.value = true
  try {
    let genderNum = null
    if (editForm.gender === '男') genderNum = 1
    else if (editForm.gender === '女') genderNum = 2

    // 掩码转换
    let targetMask = 0
    if (editForm.userTarget && editForm.userTarget.length) {
      for (const v of editForm.userTarget) targetMask |= v
    }
    let envMask = 0
    if (editForm.userEnvironment && editForm.userEnvironment.length) {
      for (const v of editForm.userEnvironment) envMask |= v
    }

    const payload = {
      username: editForm.username,
      gender: genderNum,
      age: editForm.age,
      height: editForm.height,
      weight: editForm.weight,
      userTarget: targetMask || null,
      userEnvironment: envMask || null,
      experience: editForm.experience
    }
    const res = await request.put('/user/info', payload)
    if (res.data.code === 200) {
      ElMessage.success('资料更新成功')
      editInfoDialogVisible.value = false
      await fetchUserInfo()
      userStore.updateNickname(editForm.username)
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