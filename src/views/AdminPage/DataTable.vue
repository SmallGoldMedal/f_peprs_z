// 文件位置：C:\Users\12243\Desktop\f_peprs_z\src\views\AdminPage\components\DataTable.vue
<template>
  <div class="data-table">
    <div class="toolbar">
      <el-button type="primary" @click="openAddDialog" v-if="addApi">新增</el-button>
      <el-button @click="fetchData">刷新</el-button>
    </div>
    <el-table :data="list" v-loading="loading" stripe border>
      <el-table-column v-for="col in columns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width" :min-width="col.minWidth" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)" v-if="updateApi">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row.id)" v-if="deleteApi">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item v-for="field in formFields" :key="field.prop" :label="field.label" :prop="field.prop" :required="field.required">
          <el-input v-if="field.type === 'input'" v-model="form[field.prop]" />
          <el-input-number v-else-if="field.type === 'number'" v-model="form[field.prop]" />
          <el-input v-else-if="field.type === 'textarea'" type="textarea" v-model="form[field.prop]" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const props = defineProps({
  columns: Array,
  formFields: Array,
  defaultForm: Object,
  addApi: String,
  updateApi: String,
  deleteApi: String,
  listApi: String,
  isSearchPost: Boolean,
  extraParams: Object
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
      let records = res.data.data.records || res.data.data || []
      list.value = records
      total.value = res.data.data.total || records.length
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (err) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const form = reactive({ ...props.defaultForm })
const formRef = ref(null)
const submitting = ref(false)
const rules = computedRules()

function computedRules() {
  let rulesObj = {}
  props.formFields.forEach(f => {
    if (f.required) {
      rulesObj[f.prop] = [{ required: true, message: `请输入${f.label}`, trigger: 'blur' }]
    }
  })
  return rulesObj
}

function openAddDialog() {
  isEdit.value = false
  Object.keys(form).forEach(k => delete form[k])
  Object.assign(form, props.defaultForm)
  dialogTitle.value = '新增'
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  Object.assign(form, row)
  dialogTitle.value = '编辑'
  dialogVisible.value = true
}

async function submitForm() {
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
      ElMessage.error(res.data.message)
    }
  } catch (err) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
    const res = await request.delete(`${props.deleteApi}/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchData()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch {}
}

onMounted(() => {
  fetchData()
})

defineExpose({ fetchData })
</script>