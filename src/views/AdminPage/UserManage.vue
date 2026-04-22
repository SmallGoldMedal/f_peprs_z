// 文件位置：C:\Users\12243\Desktop\f_peprs_z\src\views\AdminPage\UserManage.vue
<template>
  <div class="user-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="openAddDialog">新增用户</el-button>
        </div>
      </template>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="模糊搜索" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="searchForm.nickname" placeholder="模糊搜索" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" clearable placeholder="全部">
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部">
            <el-option label="启用" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchUsers">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="userList" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="nickname" label="昵称" width="150" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">{{ row.role === 1 ? '管理员' : '普通用户' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'success' : 'danger'">{{ row.status === 0 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registerTime" label="注册时间" width="180" />
        <el-table-column prop="lastLoginTime" label="最后登录" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="warning" @click="toggleStatus(row)">{{ row.status === 0 ? '禁用' : '启用' }}</el-button>
            <el-button link type="success" @click="resetPassword(row)">重置密码</el-button>
            <el-button link type="danger" @click="hardDelete(row)">硬删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchUsers"
          @current-change="fetchUsers"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input type="password" v-model="form.password" show-password />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role">
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status">
            <el-option label="启用" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
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

const userList = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(10)

const searchForm = reactive({ username: '', nickname: '', role: null, status: null })

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await request.post('/admin/user/search', {
      page: page.value,
      size: size.value,
      ...searchForm
    })
    if (res.data.code === 200) {
      userList.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.username = ''
  searchForm.nickname = ''
  searchForm.role = null
  searchForm.status = null
  page.value = 1
  fetchUsers()
}

const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, username: '', password: '', nickname: '', role: 0, status: 0 })
const formRef = ref(null)
const submitting = ref(false)

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur', min: 6 }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }]
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = null
  form.username = ''
  form.password = ''
  form.nickname = ''
  form.role = 0
  form.status = 0
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  form.password = ''
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
      // 编辑暂只支持修改状态和角色，实际可扩展
      res = await request.put(`/admin/user/${form.id}/status`, null, { params: { status: form.status } })
      if (res.data.code === 200) ElMessage.success('状态更新成功')
    } else {
      res = await request.post('/admin/user/add', {
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        role: form.role,
        status: form.status
      })
      if (res.data.code === 200) ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchUsers()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (row) => {
  const newStatus = row.status === 0 ? 1 : 0
  const action = newStatus === 1 ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确认${action}用户 ${row.username} 吗？`, '提示', { type: 'warning' })
    const res = await request.put(`/admin/user/${row.id}/status`, null, { params: { status: newStatus } })
    if (res.data.code === 200) {
      ElMessage.success(`${action}成功`)
      fetchUsers()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {}
}

const resetPassword = async (row) => {
  const newPassword = prompt('请输入新密码（至少6位）', '123456')
  if (!newPassword || newPassword.length < 6) {
    ElMessage.warning('密码至少6位')
    return
  }
  try {
    const res = await request.put(`/admin/user/${row.id}/reset-password`, null, { params: { newPassword } })
    if (res.data.code === 200) {
      ElMessage.success('密码重置成功')
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {
    ElMessage.error('重置失败')
  }
}

const hardDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`永久删除用户 ${row.username} 及其所有关联数据？不可恢复！`, '危险操作', { type: 'error' })
    const res = await request.delete(`/admin/user/${row.id}/destroy`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchUsers()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {}
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.search-form { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>