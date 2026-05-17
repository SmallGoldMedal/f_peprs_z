<template>
  <div class="data-table">
    <div class="toolbar">
      <el-button v-if="addApi" type="primary" @click="openAddDialog">新增</el-button>
      <el-button @click="fetchData">刷新</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe border>
      <el-table-column
          v-for="col in columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
      />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button v-if="updateApi" link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button v-if="deleteApi" link type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchData"
        @current-change="fetchData"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item
            v-for="field in formFields"
            :key="field.prop"
            :label="field.label"
            :prop="field.prop"
            :required="field.required"
        >
          <el-input v-if="field.type === 'input'" v-model="form[field.prop]" />
          <el-input-number v-else-if="field.type === 'number'" v-model="form[field.prop]" />
          <el-input v-else-if="field.type === 'textarea'" type="textarea" v-model="form[field.prop]" />
          <el-date-picker
              v-else-if="field.type === 'date'"
              v-model="form[field.prop]"
              type="date"
              value-format="YYYY-MM-DD"
          />
          <el-date-picker
              v-else-if="field.type === 'datetime'"
              v-model="form[field.prop]"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
          />
          <el-select v-else-if="field.type === 'select'" v-model="form[field.prop]" :options="field.options" />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const props = defineProps({
  columns: { type: Array, required: true },
  formFields: { type: Array, default: () => [] },
  defaultForm: { type: Object, default: () => ({}) },
  addApi: { type: String, default: '' },
  updateApi: { type: String, default: '' },
  deleteApi: { type: String, default: '' },
  listApi: { type: String, required: true },
  isSearchPost: { type: Boolean, default: false },
  extraParams: { type: Object, default: () => ({}) }
})

const list = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(10)

const fetchData = async () => {
  loading.value = true
  try {
    let params = { page: page.value, size: size.value, ...props.extraParams }
    let res
    if (props.isSearchPost) {
      res = await request.post(props.listApi, params)
    } else {
      res = await request.get(props.listApi, { params })
    }
    if (res.data.code === 200) {
      const data = res.data.data
      list.value = data.records || data || []
      total.value = data.total || list.value.length
    } else {
      ElMessage.error(res.data.message || '加载失败')
    }
  } catch (err) {
    ElMessage.error('请求失败')
  } finally {
    loading.value = false
  }
}

// 表单相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const form = reactive({ ...props.defaultForm })
const formRef = ref(null)
const submitting = ref(false)

const rules = computed(() => {
  const rulesObj = {}
  props.formFields.forEach(f => {
    if (f.required) {
      rulesObj[f.prop] = [{ required: true, message: `请输入${f.label}`, trigger: 'blur' }]
    }
  })
  return rulesObj
})

const openAddDialog = () => {
  if (!props.addApi) return
  isEdit.value = false
  Object.keys(form).forEach(k => delete form[k])
  Object.assign(form, props.defaultForm)
  dialogTitle.value = '新增'
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  if (!props.updateApi) return
  isEdit.value = true
  Object.assign(form, row)
  dialogTitle.value = '编辑'
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch { return }

  submitting.value = true
  try {
    let url = isEdit.value ? `${props.updateApi}/${form.id}` : props.addApi
    let method = isEdit.value ? 'put' : 'post'
    let payload = { ...form }
    if (isEdit.value) delete payload.id

    const res = await request[method](url, payload)
    if (res.data.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '新增成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.data.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!props.deleteApi) return
  try {
    await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
    const res = await request.delete(`${props.deleteApi}/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchData()
    } else {
      ElMessage.error(res.data.message || '删除失败')
    }
  } catch { /* 取消操作 */
  }
}

onMounted(() => {
  fetchData()
})

defineExpose({fetchData})
</script>