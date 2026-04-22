<template>
  <div>
    <el-button type="danger" plain @click="dialogVisible = true">注销账号</el-button>
    <el-dialog v-model="dialogVisible" title="注销账号" width="500px" destroy-on-close>
      <el-alert title="警告" type="warning" :closable="false" style="margin-bottom: 20px">
        注销后您的所有数据将被永久删除，且无法恢复。请谨慎操作。
      </el-alert>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="确认密码" prop="password">
          <el-input type="password" v-model="form.password" placeholder="请输入当前密码以确认身份" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submit" :loading="submitting">确认注销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request.js'

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  password: ''
})

const rules = {
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const submit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  // 二次确认弹窗
  await ElMessageBox.confirm('注销账号是不可逆的操作，确定要注销吗？', '最后确认', {
    type: 'warning',
    confirmButtonText: '确定注销',
    cancelButtonText: '取消'
  })
  submitting.value = true
  try {
    const res = await request.delete('/user/delete', { data: { password: form.password } })
    if (res.data.code === 200) {
      ElMessage.success('账号已注销，即将退出系统')
      await request.post('/auth/logout')
      localStorage.clear()
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    } else {
      ElMessage.error(res.data.message || '注销失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('注销失败，请检查密码或网络')
    }
  } finally {
    submitting.value = false
    dialogVisible.value = false
  }
}
</script>