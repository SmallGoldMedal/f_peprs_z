<template>
  <div class="settings-container">
    <!-- 账号信息 -->
    <el-card class="setting-card" shadow="hover">
      <template #header>
        <div class="card-header">账号信息</div>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="账号名">{{ userStore.accountname }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ accountTimes.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后登录时间">{{ accountTimes.lastLoginTime || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 密码修改 -->
    <el-card class="setting-card" shadow="hover">
      <template #header>
        <div class="card-header">密码修改</div>
      </template>
      <div class="setting-item">
        <el-button type="primary" @click="changePwdDialogVisible = true">修改密码</el-button>
      </div>
    </el-card>

    <!-- 注销账号 -->
    <el-card class="setting-card" shadow="hover">
      <template #header>
        <div class="card-header">注销账号</div>
      </template>
      <div class="setting-item">
        <el-button type="danger" @click="confirmFirstStep">注销账号</el-button>
      </div>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="changePwdDialogVisible" title="修改密码" width="400px" destroy-on-close>
      <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input type="password" v-model="pwdForm.oldPassword" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input type="password" v-model="pwdForm.newPassword" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input type="password" v-model="pwdForm.confirmPassword" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changePwdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitChangePassword" :loading="pwdLoading">提交</el-button>
      </template>
    </el-dialog>

    <!-- 注销账号第二步：输入账号密码 -->
    <el-dialog v-model="deleteConfirmDialogVisible" title="账号注销验证" width="400px" destroy-on-close>
      <el-alert title="警告" type="error" description="注销后所有数据将永久删除，无法恢复！" show-icon :closable="false" style="margin-bottom: 20px" />
      <el-form :model="deleteForm" :rules="deleteRules" ref="deleteFormRef" label-width="100px">
        <el-form-item label="账号名" prop="accountname">
          <el-input v-model="deleteForm.accountname" placeholder="请输入账号名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="deleteForm.password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deleteConfirmDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitDeleteAccount" :loading="deleteLoading">确认注销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

// 账号时间信息
const accountTimes = ref({ createTime: '', lastLoginTime: '' })

const fetchAccountTimes = async () => {
  try {
    const res = await request.get('/user/account-times')
    if (res.data.code === 200) {
      accountTimes.value = res.data.data
    }
  } catch (error) {
    console.error('获取账号时间失败', error)
  }
}

// 修改密码
const changePwdDialogVisible = ref(false)
const pwdLoading = ref(false)
const pwdFormRef = ref(null)
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPassword) callback(new Error('两次密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}
const submitChangePassword = async () => {
  try {
    await pwdFormRef.value.validate()
  } catch { return }
  pwdLoading.value = true
  try {
    const res = await request.post('/auth/change-password', {
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    if (res.data.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      changePwdDialogVisible.value = false
      userStore.clearAuth()
      router.push('/')
    } else {
      ElMessage.error(res.data.message || '修改失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '修改失败')
  } finally {
    pwdLoading.value = false
  }
}

// 注销账号两步确认
const deleteConfirmDialogVisible = ref(false)
const deleteLoading = ref(false)
const deleteFormRef = ref(null)
const deleteForm = reactive({
  accountname: '',
  password: ''
})
const deleteRules = {
  accountname: [{ required: true, message: '请输入账号名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}
const confirmFirstStep = async () => {
  try {
    await ElMessageBox.confirm('确定要注销账号吗？若注销则无法恢复账号信息', '警告', {
      confirmButtonText: '确定注销',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
    deleteForm.accountname = userStore.accountname
    deleteForm.password = ''
    deleteConfirmDialogVisible.value = true
  } catch { }
}
const submitDeleteAccount = async () => {
  try {
    await deleteFormRef.value.validate()
  } catch { return }
  if (deleteForm.accountname !== userStore.accountname) {
    ElMessage.error('账号名错误')
    return
  }
  deleteLoading.value = true
  try {
    const res = await request.delete('/user/account')
    if (res.data.code === 200) {
      ElMessage.success('账号已注销')
      userStore.clearAuth()
      router.push('/')
    } else {
      ElMessage.error(res.data.message || '注销失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '注销失败')
  } finally {
    deleteLoading.value = false
    deleteConfirmDialogVisible.value = false
  }
}

onMounted(() => {
  if (!userStore.isGuest) {
    fetchAccountTimes()
  }
})
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
}
.setting-card {
  margin-bottom: 24px;
  border-radius: 16px;
}
.card-header {
  font-size: 18px;
  font-weight: 600;
  color: #2c5a7a;
}
.setting-item {
  padding: 8px 0;
}
</style>