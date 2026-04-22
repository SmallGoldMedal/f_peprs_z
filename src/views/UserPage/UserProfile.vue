// 文件位置：C:\Users\12243\Desktop\f_peprs_z\src\views\UserProfile\test.vue
<template>
  <div class="user-profile">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
          <el-button
              type="primary"
              @click="handleUpdate"
              :loading="submitting"
              :disabled="!isFormDirty"
          >
            保存修改
          </el-button>
        </div>
      </template>

      <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="160px"
          label-position="right"
          v-loading="loading"
      >
        <!-- 账号信息（只读输入框） -->
        <el-divider content-position="left">账号信息</el-divider>
        <el-form-item label="用户名">
          <el-input v-model="readonly.username" disabled />
        </el-form-item>
        <el-form-item label="注册时间">
          <el-input v-model="readonly.registerTime" disabled />
        </el-form-item>
        <el-form-item label="最近更新">
          <el-input v-model="readonly.updateTime" disabled />
        </el-form-item>

        <el-divider content-position="left">基本资料</el-divider>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-select v-model="form.gender" placeholder="请选择性别">
            <el-option label="保密" :value="0" />
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="年龄" prop="age">
          <el-input
              v-model="form.age"
              type="text"
              placeholder="请输入年龄"
              @input="validateNumber('age')"
          />
        </el-form-item>

        <el-form-item label="身高(cm)" prop="height">
          <el-input
              v-model="form.height"
              type="text"
              placeholder="请输入身高"
              @input="validateNumber('height')"
          />
        </el-form-item>

        <el-form-item label="体重(kg)" prop="weight">
          <el-input
              v-model="form.weight"
              type="text"
              placeholder="请输入体重"
              @input="validateNumber('weight')"
          />
        </el-form-item>

        <el-form-item label="体脂率(%)" prop="bodyFatRate">
          <el-input
              v-model="form.bodyFatRate"
              type="text"
              placeholder="请输入体脂率"
              @input="validateNumber('bodyFatRate')"
          />
        </el-form-item>

        <el-divider content-position="left">健康信息</el-divider>

        <el-form-item label="日常活动频率" prop="activityLevel">
          <el-select v-model="form.activityLevel" placeholder="请选择日常活动频率">
            <el-option label="基本不活动" :value="0" />
            <el-option label="很少活动" :value="1" />
            <el-option label="时不时活动" :value="2" />
            <el-option label="经常活动" :value="3" />
          </el-select>
        </el-form-item>

        <!-- 是否有慢性病？开关 -->
        <el-form-item label="是否有慢性病？">
          <el-switch v-model="showChronicDisease" />
        </el-form-item>

        <!-- 慢性病标签选择区域（条件显示） -->
        <el-form-item v-if="showChronicDisease" label=" " prop="chronicDiseaseMask">
          <div class="tag-switch-list">
            <div
                v-for="disease in diseaseList"
                :key="disease.value"
                :class="['switch-tag', { 'selected': isDiseaseSelected(disease.value) }]"
                @click="toggleDisease(disease)"
            >
              {{ disease.label }}
            </div>
          </div>
        </el-form-item>

        <!-- 近期是否做过手术？开关 -->
        <el-form-item label="近期是否做过手术？">
          <el-switch v-model="form.surgeryAffectedFlag" />
          <span>{{ form.surgeryAffectedFlag ? '是' : '否' }}</span>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request.js'

// 慢性病列表
const allDiseases = [
  { value: 1, label: '高血压' },
  { value: 2, label: '糖尿病' },
  { value: 4, label: '心脏病' },
  { value: 8, label: '关节炎' },
  { value: 16, label: '哮喘' },
  { value: 32, label: '骨质疏松' }
]

// 原始数据备份
const originalForm = reactive({
  nickname: '',
  gender: 0,
  age: null,
  height: null,
  weight: null,
  bodyFatRate: null,
  chronicDiseaseMask: 0,
  activityLevel: null,
  surgeryAffected: null
})

// 表单数据
const form = reactive({
  nickname: '',
  gender: 0,
  age: '',
  height: '',
  weight: '',
  bodyFatRate: '',
  chronicDiseaseMask: 0,
  activityLevel: null,
  surgeryAffectedFlag: false   // 开关绑定值，true=是(1), false=否(0)
})

// 只读信息（增加最近更新）
const readonly = reactive({
  username: '',
  registerTime: '',
  updateTime: ''
})

// 慢性病开关
const showChronicDisease = ref(false)

// 疾病标签列表（选中的在前）
const diseaseList = ref([])

// 初始化疾病列表（根据掩码排序）
const initDiseaseList = (mask) => {
  const selected = []
  const unselected = []
  allDiseases.forEach(d => {
    if (mask & d.value) {
      selected.push(d)
    } else {
      unselected.push(d)
    }
  })
  diseaseList.value = [...selected, ...unselected]
}

// 判断某个疾病是否被选中
const isDiseaseSelected = (value) => {
  return (form.chronicDiseaseMask & value) !== 0
}

// 切换疾病选中状态
const toggleDisease = (disease) => {
  let newMask = form.chronicDiseaseMask
  if (newMask & disease.value) {
    newMask &= ~disease.value
  } else {
    newMask |= disease.value
  }
  form.chronicDiseaseMask = newMask
  // 重新排序列表
  const selected = []
  const unselected = []
  allDiseases.forEach(d => {
    if (newMask & d.value) {
      selected.push(d)
    } else {
      unselected.push(d)
    }
  })
  diseaseList.value = [...selected, ...unselected]
}

// 数字输入校验
const validateNumber = (field) => {
  let value = form[field]
  if (value === '' || value === null || value === undefined) return
  let cleaned = value.toString().replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('')
  if (parts.length === 2 && parts[1].length > 2) cleaned = parts[0] + '.' + parts[1].substring(0, 2)
  form[field] = cleaned
}

// 计算表单是否被修改
const isFormDirty = computed(() => {
  const ageNum = form.age === '' ? null : Number(form.age)
  const heightNum = form.height === '' ? null : Number(form.height)
  const weightNum = form.weight === '' ? null : Number(form.weight)
  const bodyFatNum = form.bodyFatRate === '' ? null : Number(form.bodyFatRate)
  const surgeryVal = form.surgeryAffectedFlag ? 1 : 0
  return (
      form.nickname !== originalForm.nickname ||
      form.gender !== originalForm.gender ||
      ageNum !== originalForm.age ||
      heightNum !== originalForm.height ||
      weightNum !== originalForm.weight ||
      bodyFatNum !== originalForm.bodyFatRate ||
      form.chronicDiseaseMask !== originalForm.chronicDiseaseMask ||
      form.activityLevel !== originalForm.activityLevel ||
      surgeryVal !== originalForm.surgeryAffected
  )
})

// 表单校验规则
const rules = {
  nickname: [{ max: 50, message: '昵称不能超过50个字符', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { validator: (rule, value, callback) => {
        if (value === '' || value === null) callback(new Error('请输入年龄'))
        else {
          const num = Number(value)
          if (isNaN(num)) callback(new Error('年龄必须为数字'))
          else if (num < 0 || num > 120) callback(new Error('年龄范围为0-120岁'))
          else callback()
        }
      }, trigger: 'blur' }
  ],
  height: [
    { required: true, message: '请输入身高', trigger: 'blur' },
    { validator: (rule, value, callback) => {
        if (value === '' || value === null) callback(new Error('请输入身高'))
        else {
          const num = Number(value)
          if (isNaN(num)) callback(new Error('身高必须为数字'))
          else if (num < 0 || num > 300) callback(new Error('身高范围为0-300cm'))
          else callback()
        }
      }, trigger: 'blur' }
  ],
  weight: [
    { required: true, message: '请输入体重', trigger: 'blur' },
    { validator: (rule, value, callback) => {
        if (value === '' || value === null) callback(new Error('请输入体重'))
        else {
          const num = Number(value)
          if (isNaN(num)) callback(new Error('体重必须为数字'))
          else if (num < 0 || num > 500) callback(new Error('体重范围为0-500kg'))
          else callback()
        }
      }, trigger: 'blur' }
  ],
  bodyFatRate: [
    { required: true, message: '请输入体脂率', trigger: 'blur' },
    { validator: (rule, value, callback) => {
        if (value === '' || value === null) callback(new Error('请输入体脂率'))
        else {
          const num = Number(value)
          if (isNaN(num)) callback(new Error('体脂率必须为数字'))
          else if (num < 0 || num > 100) callback(new Error('体脂率范围为0-100%'))
          else callback()
        }
      }, trigger: 'blur' }
  ],
  activityLevel: [{ required: true, message: '请选择日常活动频率', trigger: 'change' }]
}

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)

// 加载用户信息
const fetchUserInfo = async () => {
  loading.value = true
  try {
    const res = await request.get('/user/info')
    if (res.data.code === 200) {
      const data = res.data.data
      readonly.username = data.username || ''
      readonly.registerTime = data.registerTime || ''
      readonly.updateTime = data.updateTime || ''
      form.nickname = data.nickname || ''
      form.gender = data.gender ?? 0
      form.age = data.age !== null ? String(data.age) : ''
      form.height = data.height !== null ? String(data.height) : ''
      form.weight = data.weight !== null ? String(data.weight) : ''
      form.bodyFatRate = data.bodyFatRate !== null ? String(data.bodyFatRate) : ''
      form.chronicDiseaseMask = data.chronicDiseaseMask || 0
      form.activityLevel = data.activityLevel
      form.surgeryAffectedFlag = (data.surgeryAffected === 1)

      // 保存原始数据
      originalForm.nickname = form.nickname
      originalForm.gender = form.gender
      originalForm.age = data.age
      originalForm.height = data.height
      originalForm.weight = data.weight
      originalForm.bodyFatRate = data.bodyFatRate
      originalForm.chronicDiseaseMask = form.chronicDiseaseMask
      originalForm.activityLevel = data.activityLevel
      originalForm.surgeryAffected = data.surgeryAffected

      // 如果有慢性病数据，则自动打开开关
      if (form.chronicDiseaseMask !== 0) {
        showChronicDisease.value = true
      }
      // 初始化疾病标签顺序
      initDiseaseList(form.chronicDiseaseMask)
    } else {
      ElMessage.error(res.data.message || '获取用户信息失败')
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 提交更新
const handleUpdate = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const payload = {
      nickname: form.nickname,
      gender: form.gender,
      age: form.age === '' ? null : Number(form.age),
      height: form.height === '' ? null : Number(form.height),
      weight: form.weight === '' ? null : Number(form.weight),
      bodyFatRate: form.bodyFatRate === '' ? null : Number(form.bodyFatRate),
      chronicDiseaseMask: form.chronicDiseaseMask,
      activityLevel: form.activityLevel,
      surgeryAffected: form.surgeryAffectedFlag ? 1 : 0
    }
    const res = await request.put('/user/profile', payload)
    if (res.data.code === 200) {
      ElMessage.success('个人信息更新成功')
      await fetchUserInfo()
    } else {
      ElMessage.error(res.data.message || '更新失败')
    }
  } catch (error) {
    ElMessage.error('更新失败，请检查网络')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.user-profile {
  max-width: 750px;
  margin: 0 auto;
}

.profile-card {
  border-radius: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 18px;
}

/* 标签切换列表样式 */
.tag-switch-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.switch-tag {
  display: inline-block;
  padding: 6px 16px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 24px;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.switch-tag.selected {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}
.switch-tag:hover {
  opacity: 0.8;
}

/* 隐藏数字输入框的加减按钮 */
:deep(input[type="number"]) {
  -moz-appearance: textfield;
}
:deep(input[type="number"]::-webkit-inner-spin-button),
:deep(input[type="number"]::-webkit-outer-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

/* 禁用输入框样式 */
:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #f5f7fa;
}
</style>