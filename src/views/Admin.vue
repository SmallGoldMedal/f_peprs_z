<template>
  <div class="admin-container">
    <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
      <el-button type="primary" @click="goBackToUserView">返回用户视角</el-button>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="数据统计" name="stats">
        <div class="stats-container">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>用户增长趋势（近7天）</template>
                <div ref="userChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>方案生成趋势（近7天）</template>
                <div ref="planChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>运动记录完成率（近30天）</template>
                <div ref="completionChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>运动项目评分分布</template>
                <div ref="ratingChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <el-tab-pane label="运动项目管理" name="exercises">
        <el-card shadow="never" style="margin-bottom: 16px;">
          <div ref="categoryChartRef" style="height: 280px;"></div>
        </el-card>
        <div class="toolbar">
          <el-button type="primary" @click="openExerciseDialog()">新增运动</el-button>
        </div>
        <el-table :data="exerciseList" border stripe v-loading="loadingExercises">
          <el-table-column prop="exerciseName" label="名称" min-width="120" />
          <el-table-column label="类别" width="100">
            <template #default="{ row }">{{ getCategoryName(row.categoryMask) }}</template>
          </el-table-column>
          <el-table-column prop="difficulty" label="难度" width="80" />
          <el-table-column prop="targetMuscle" label="主要肌群" width="120" />
          <el-table-column label="适宜环境" width="100">
            <template #default="{ row }">{{ getEnvName(row.suitableEnvMask) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openExerciseDialog(row)">编辑</el-button>
              <el-button type="danger" link @click="deleteExercise(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
            v-model:current-page="exerciseQuery.page"
            v-model:page-size="exerciseQuery.size"
            :total="exerciseTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchExercises"
            @current-change="fetchExercises"
        />
      </el-tab-pane>

      <el-tab-pane label="伤病禁忌规则" name="exclusions">
        <div class="toolbar">
          <el-button type="primary" @click="openExclusionDialog()">新增规则</el-button>
        </div>
        <el-table :data="exclusionList" border stripe v-loading="loadingExclusions">
          <el-table-column prop="injuryKeyword" label="伤病关键词" width="150" />
          <el-table-column prop="exerciseId" label="运动项目ID" width="100" />
          <el-table-column label="运动名称" width="150">
            <template #default="{ row }">{{ getExerciseName(row.exerciseId) }}</template>
          </el-table-column>
          <el-table-column prop="severityLimit" label="严重程度限制" width="120" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="primary" link @click="openExclusionDialog(row)">编辑</el-button>
              <el-button type="danger" link @click="deleteExclusion(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
            v-model:current-page="exclusionQuery.page"
            v-model:page-size="exclusionQuery.size"
            :total="exclusionTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchExclusions"
            @current-change="fetchExclusions"
        />
      </el-tab-pane>

      <el-tab-pane label="用户管理" name="users">
        <div class="toolbar">
          <el-input v-model="userQuery.username" placeholder="用户名" style="width: 150px; margin-right: 10px" />
          <el-input v-model="userQuery.nickname" placeholder="昵称" style="width: 150px; margin-right: 10px" />
          <el-select v-model="userQuery.role" placeholder="角色" clearable style="width: 100px; margin-right: 10px">
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
          </el-select>
          <el-select v-model="userQuery.status" placeholder="状态" clearable style="width: 100px; margin-right: 10px">
            <el-option label="正常" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
          <el-button type="primary" @click="fetchUsers">查询</el-button>
          <el-button @click="resetUserQuery">重置</el-button>
          <el-button type="success" @click="openAddUserDialog">新增用户</el-button>
        </div>
        <el-table :data="userList" border stripe v-loading="loadingUsers">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="nickname" label="昵称" width="100" />
          <el-table-column prop="role" label="角色" width="80">
            <template #default="{ row }">{{ row.role === 1 ? '管理员' : '普通用户' }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'success' : 'danger'">{{ row.status === 0 ? '正常' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="registerTime" label="注册时间" width="160" />
          <el-table-column prop="lastLoginTime" label="最后登录" width="160" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 0" type="danger" link @click="updateUserStatus(row.id, 1)">禁用</el-button>
              <el-button v-else type="success" link @click="updateUserStatus(row.id, 0)">启用</el-button>
              <el-button type="warning" link @click="openResetPasswordDialog(row.id)">重置密码</el-button>
              <el-button type="danger" link @click="hardDeleteUser(row.id)">硬删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
            v-model:current-page="userQuery.page"
            v-model:page-size="userQuery.size"
            :total="userTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchUsers"
            @current-change="fetchUsers"
        />
      </el-tab-pane>

      <el-tab-pane label="方案管理" name="plans">
        <el-card shadow="never" style="margin-bottom: 16px;">
          <div ref="planStatusChartRef" style="height: 280px;"></div>
        </el-card>
        <div class="toolbar">
          <el-input v-model="planQuery.planName" placeholder="方案名称" style="width: 150px; margin-right: 10px" />
          <el-input v-model="planQuery.userId" placeholder="用户ID" style="width: 100px; margin-right: 10px" />
          <el-select v-model="planQuery.status" placeholder="状态" clearable style="width: 100px; margin-right: 10px">
            <el-option label="已推荐" :value="0" />
            <el-option label="已采纳" :value="1" />
            <el-option label="进行中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="未完成" :value="4" />
          </el-select>
          <el-button type="primary" @click="fetchPlans">查询</el-button>
          <el-button @click="resetPlanQuery">重置</el-button>
        </div>
        <el-table :data="planList" border stripe v-loading="loadingPlans">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="planName" label="方案名称" min-width="150" />
          <el-table-column prop="userId" label="用户ID" width="80" />
          <el-table-column prop="startDate" label="开始日期" width="100" />
          <el-table-column prop="endDate" label="结束日期" width="100" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              {{ row.status === 0 ? '已推荐' : row.status === 1 ? '已采纳' : row.status === 2 ? '进行中' : row.status === 3 ? '已完成' : '未完成' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button type="danger" link @click="deletePlan(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
            v-model:current-page="planQuery.page"
            v-model:page-size="planQuery.size"
            :total="planTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchPlans"
            @current-change="fetchPlans"
        />
      </el-tab-pane>

      <el-tab-pane label="伤病记录管理" name="injuries">
        <div class="toolbar">
          <el-input v-model="injuryQuery.injuryLocation" placeholder="伤病部位" style="width: 150px; margin-right: 10px" />
          <el-input v-model="injuryQuery.userId" placeholder="用户ID" style="width: 100px; margin-right: 10px" />
          <el-select v-model="injuryQuery.severity" placeholder="严重程度" clearable style="width: 100px; margin-right: 10px">
            <el-option label="轻度" :value="0" />
            <el-option label="中度" :value="1" />
            <el-option label="重度" :value="2" />
          </el-select>
          <el-select v-model="injuryQuery.status" placeholder="状态" clearable style="width: 100px; margin-right: 10px">
            <el-option label="治疗中" :value="0" />
            <el-option label="康复中" :value="1" />
            <el-option label="已痊愈" :value="2" />
          </el-select>
          <el-button type="primary" @click="fetchInjuries">查询</el-button>
          <el-button @click="resetInjuryQuery">重置</el-button>
        </div>
        <el-table :data="injuryList" border stripe v-loading="loadingInjuries">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="userId" label="用户ID" width="80" />
          <el-table-column prop="injuryLocation" label="伤病部位" min-width="120" />
          <el-table-column prop="severity" label="严重程度" width="80">
            <template #default="{ row }">
              <el-tag :type="row.severity === 0 ? 'info' : row.severity === 1 ? 'warning' : 'danger'">
                {{ row.severity === 0 ? '轻度' : row.severity === 1 ? '中度' : '重度' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">{{ formatInjuryStatus(row.status) }}</template>
          </el-table-column>
          <el-table-column prop="injuredDate" label="受伤日期" width="100" />
          <el-table-column prop="recoveredDate" label="痊愈日期" width="100" />
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button type="danger" link @click="deleteInjury(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
            v-model:current-page="injuryQuery.page"
            v-model:page-size="injuryQuery.size"
            :total="injuryTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchInjuries"
            @current-change="fetchInjuries"
        />
      </el-tab-pane>

      <el-tab-pane label="运动记录管理" name="workouts">
        <div class="toolbar">
          <el-input v-model="workoutQuery.userId" placeholder="用户ID" style="width: 100px; margin-right: 10px" />
          <el-input v-model="workoutQuery.planId" placeholder="方案ID" style="width: 100px; margin-right: 10px" />
          <el-date-picker v-model="workoutQuery.completionDate" type="date" placeholder="完成日期" value-format="YYYY-MM-DD" style="width: 130px; margin-right: 10px" />
          <el-select v-model="workoutQuery.workoutRecordStatus" placeholder="状态" clearable style="width: 100px; margin-right: 10px">
            <el-option label="已完成" :value="0" />
            <el-option label="未完成" :value="1" />
          </el-select>
          <el-select v-model="workoutQuery.discomfortFlag" placeholder="不适" clearable style="width: 100px; margin-right: 10px">
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
          <el-button type="primary" @click="fetchWorkoutRecords">查询</el-button>
          <el-button @click="resetWorkoutQuery">重置</el-button>
        </div>
        <el-table :data="workoutList" border stripe v-loading="loadingWorkouts">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="userId" label="用户ID" width="80" />
          <el-table-column prop="planId" label="方案ID" width="80" />
          <el-table-column prop="completionDate" label="完成日期" width="100" />
          <el-table-column prop="workoutRecordStatus" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.workoutRecordStatus === 0 ? 'success' : 'info'">
                {{ row.workoutRecordStatus === 0 ? '已完成' : '未完成' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="actualDuration" label="时长(分)" width="80" />
          <el-table-column prop="actualCalories" label="消耗(千卡)" width="100" />
          <el-table-column prop="discomfortFlag" label="不适" width="60">
            <template #default="{ row }">{{ row.discomfortFlag ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button type="danger" link @click="deleteWorkoutRecord(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
            v-model:current-page="workoutQuery.page"
            v-model:page-size="workoutQuery.size"
            :total="workoutTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchWorkoutRecords"
            @current-change="fetchWorkoutRecords"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 运动项目对话框 -->
    <el-dialog v-model="exerciseDialogVisible" :title="exerciseDialogTitle" width="600px" destroy-on-close>
      <el-form :model="exerciseForm" :rules="exerciseRules" ref="exerciseFormRef" label-width="100px">
        <el-form-item label="名称" prop="exerciseName">
          <el-input v-model="exerciseForm.exerciseName" />
        </el-form-item>
        <el-form-item label="类别" prop="categoryMask">
          <el-select v-model="exerciseForm.categoryMask">
            <el-option label="有氧" :value="1" />
            <el-option label="力量" :value="2" />
            <el-option label="柔韧" :value="4" />
            <el-option label="平衡" :value="8" />
            <el-option label="热身" :value="16" />
            <el-option label="放松" :value="32" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="exerciseForm.difficulty">
            <el-option label="入门" :value="0" />
            <el-option label="初级" :value="1" />
            <el-option label="中级" :value="2" />
            <el-option label="高级" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="强度" prop="intensity">
          <el-select v-model="exerciseForm.intensity">
            <el-option label="低" :value="0" />
            <el-option label="中" :value="1" />
            <el-option label="高" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="主要肌群" prop="targetMuscle">
          <el-input v-model="exerciseForm.targetMuscle" />
        </el-form-item>
        <el-form-item label="次要肌群" prop="secondaryMuscle">
          <el-input v-model="exerciseForm.secondaryMuscle" />
        </el-form-item>
        <el-form-item label="时长(分)" prop="durationMin">
          <el-input-number v-model="exerciseForm.durationMin" :min="1" />
        </el-form-item>
        <el-form-item label="组数" prop="sets">
          <el-input-number v-model="exerciseForm.sets" :min="1" />
        </el-form-item>
        <el-form-item label="每组次数" prop="reps">
          <el-input-number v-model="exerciseForm.reps" :min="1" />
        </el-form-item>
        <el-form-item label="距离(km)" prop="distance">
          <el-input-number v-model="exerciseForm.distance" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="频率" prop="frequency">
          <el-input-number v-model="exerciseForm.frequency" :min="1" />
        </el-form-item>
        <el-form-item label="适宜环境" prop="suitableEnvMask">
          <el-select v-model="exerciseForm.suitableEnvMask" multiple>
            <el-option label="居家" :value="1" />
            <el-option label="健身房" :value="2" />
            <el-option label="户外" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="所需器械" prop="requiredEquipment">
          <el-input v-model="exerciseForm.requiredEquipment" />
        </el-form-item>
        <el-form-item label="注意事项" prop="cautions">
          <el-input type="textarea" v-model="exerciseForm.cautions" />
        </el-form-item>
        <el-form-item label="MET值" prop="metValue">
          <el-input-number v-model="exerciseForm.metValue" :min="0" :precision="2" :step="0.1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exerciseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExercise" :loading="exerciseSubmitLoading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 伤病禁忌规则对话框 -->
    <el-dialog v-model="exclusionDialogVisible" :title="exclusionDialogTitle" width="500px" destroy-on-close>
      <el-form :model="exclusionForm" :rules="exclusionRules" ref="exclusionFormRef" label-width="120px">
        <el-form-item label="伤病关键词" prop="injuryKeyword">
          <el-input v-model="exclusionForm.injuryKeyword" />
        </el-form-item>
        <el-form-item label="关联运动" prop="exerciseId">
          <el-select v-model="exclusionForm.exerciseId" filterable>
            <el-option v-for="ex in exerciseList" :key="ex.id" :label="ex.exerciseName" :value="ex.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度限制" prop="severityLimit">
          <el-select v-model="exclusionForm.severityLimit" clearable>
            <el-option label="轻度" :value="0" />
            <el-option label="中度" :value="1" />
            <el-option label="重度" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exclusionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExclusion" :loading="exclusionSubmitLoading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增用户对话框 -->
    <el-dialog v-model="addUserDialogVisible" title="新增用户" width="500px" destroy-on-close>
      <el-form :model="addUserForm" :rules="addUserRules" ref="addUserFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addUserForm.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="addUserForm.password" placeholder="默认123456" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="addUserForm.nickname" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="addUserForm.role">
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="addUserForm.status">
            <el-option label="正常" :value="0" />
            <el-option label="禁用" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addUserDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAddUser" :loading="addUserLoading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPwdDialogVisible" title="重置密码" width="400px" destroy-on-close>
      <el-form :model="resetPwdForm" :rules="resetPwdRules" ref="resetPwdFormRef" label-width="100px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input type="password" v-model="resetPwdForm.newPassword" placeholder="至少6位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResetPassword" :loading="resetPwdLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, onMounted, reactive, nextTick} from 'vue'
import {useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import request from '@/utils/request'
import * as echarts from 'echarts'

const router = useRouter()
const activeTab = ref('exercises')

let userChart, planChart, completionChart, ratingChart, categoryChart, planStatusChart
const userChartRef = ref(null)
const planChartRef = ref(null)
const completionChartRef = ref(null)
const ratingChartRef = ref(null)
const categoryChartRef = ref(null)
const planStatusChartRef = ref(null)

// ========== 运动项目管理 ==========
const exerciseList = ref([])
const loadingExercises = ref(false)
const exerciseTotal = ref(0)
const exerciseQuery = reactive({
  page: 1,
  size: 10,
  exerciseName: '',
  categoryMask: null,
  difficulty: null,
  intensity: null,
  targetMuscle: null,
  suitableEnvMask: null
})

const exerciseDialogVisible = ref(false)
const exerciseDialogTitle = ref('新增运动')
const exerciseSubmitLoading = ref(false)
const exerciseFormRef = ref(null)
const exerciseForm = ref({
  id: null, exerciseName: '', categoryMask: null, difficulty: null, intensity: null,
  targetMuscle: '', secondaryMuscle: '', durationMin: null, sets: null, reps: null,
  distance: null, frequency: null, suitableEnvMask: [], requiredEquipment: '',
  cautions: '', metValue: null
})
const exerciseRules = {
  exerciseName: [{required: true, message: '请输入运动名称', trigger: 'blur'}],
  categoryMask: [{required: true, message: '请选择类别', trigger: 'change'}]
}

const getCategoryName = (mask) => {
  const map = {1: '有氧', 2: '力量', 4: '柔韧', 8: '平衡', 16: '热身', 32: '放松'}
  if (!mask) return '其他'
  for (const [val, name] of Object.entries(map)) if (mask & parseInt(val)) return name
  return '其他'
}
const getEnvName = (mask) => {
  const map = {1: '居家', 2: '健身房', 4: '户外'}
  if (!mask) return '其他'
  const parts = []
  for (const [val, name] of Object.entries(map)) if (mask & parseInt(val)) parts.push(name)
  return parts.join('、') || '其他'
}

const fetchExercises = async () => {
  loadingExercises.value = true
  try {
    const res = await request.post('/admin/exercise/search', exerciseQuery)
    if (res.data.code === 200) {
      exerciseList.value = res.data.data.records || []
      exerciseTotal.value = res.data.data.total || 0
      exerciseList.value.forEach(ex => {
        if (ex.suitableEnvMask) {
          const masks = []
          if (ex.suitableEnvMask & 1) masks.push(1)
          if (ex.suitableEnvMask & 2) masks.push(2)
          if (ex.suitableEnvMask & 4) masks.push(4)
          ex.suitableEnvMaskArr = masks
        }
      })
      renderCategoryChart()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('获取运动项目失败')
  } finally {
    loadingExercises.value = false
  }
}

const renderCategoryChart = () => {
  if (!categoryChartRef.value) return
  const categories = {1: '有氧', 2: '力量', 4: '柔韧', 8: '平衡', 16: '热身', 32: '放松'}
  const counts = {1: 0, 2: 0, 4: 0, 8: 0, 16: 0, 32: 0}
  exerciseList.value.forEach(ex => {
    if (ex.categoryMask) {
      for (const [mask, name] of Object.entries(categories)) if (ex.categoryMask & parseInt(mask)) counts[mask]++
    }
  })
  const data = Object.entries(counts).map(([mask, count]) => ({
    name: categories[mask],
    value: count
  })).filter(d => d.value > 0)
  if (categoryChart) categoryChart.dispose()
  categoryChart = echarts.init(categoryChartRef.value)
  categoryChart.setOption({
    title: {text: '运动项目类别分布', left: 'center'},
    tooltip: {trigger: 'item'},
    series: [{type: 'pie', radius: '50%', data, label: {show: true}}]
  })
}

const openExerciseDialog = (row = null) => {
  if (row) {
    exerciseDialogTitle.value = '编辑运动'
    exerciseForm.value = {
      id: row.id, exerciseName: row.exerciseName, categoryMask: row.categoryMask,
      difficulty: row.difficulty, intensity: row.intensity, targetMuscle: row.targetMuscle || '',
      secondaryMuscle: row.secondaryMuscle || '', durationMin: row.durationMin,
      sets: row.sets, reps: row.reps, distance: row.distance, frequency: row.frequency,
      suitableEnvMask: row.suitableEnvMaskArr || [], requiredEquipment: row.requiredEquipment || '',
      cautions: row.cautions || '', metValue: row.metValue
    }
  } else {
    exerciseDialogTitle.value = '新增运动'
    exerciseForm.value = {
      id: null, exerciseName: '', categoryMask: null, difficulty: null, intensity: null,
      targetMuscle: '', secondaryMuscle: '', durationMin: null, sets: null, reps: null,
      distance: null, frequency: null, suitableEnvMask: [], requiredEquipment: '',
      cautions: '', metValue: null
    }
  }
  exerciseDialogVisible.value = true
}

const submitExercise = async () => {
  try {
    await exerciseFormRef.value.validate()
  } catch {
    return
  }
  exerciseSubmitLoading.value = true
  try {
    let envMask = 0
    if (exerciseForm.value.suitableEnvMask && exerciseForm.value.suitableEnvMask.length) {
      exerciseForm.value.suitableEnvMask.forEach(v => envMask |= v)
    }
    const payload = {
      exerciseName: exerciseForm.value.exerciseName,
      categoryMask: exerciseForm.value.categoryMask,
      difficulty: exerciseForm.value.difficulty,
      intensity: exerciseForm.value.intensity,
      targetMuscle: exerciseForm.value.targetMuscle,
      secondaryMuscle: exerciseForm.value.secondaryMuscle,
      durationMin: exerciseForm.value.durationMin,
      sets: exerciseForm.value.sets,
      reps: exerciseForm.value.reps,
      distance: exerciseForm.value.distance,
      frequency: exerciseForm.value.frequency,
      suitableEnvMask: envMask,
      requiredEquipment: exerciseForm.value.requiredEquipment,
      cautions: exerciseForm.value.cautions,
      metValue: exerciseForm.value.metValue
    }
    let res
    if (exerciseForm.value.id) {
      res = await request.put('/admin/exercise/update', {...payload, id: exerciseForm.value.id})
    } else {
      res = await request.post('/admin/exercise/add', payload)
    }
    if (res.data.code === 200) {
      ElMessage.success(exerciseForm.value.id ? '更新成功' : '新增成功')
      exerciseDialogVisible.value = false
      await fetchExercises()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    exerciseSubmitLoading.value = false
  }
}

const deleteExercise = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该运动项目吗？', '提示', {type: 'warning'})
    const res = await request.delete(`/admin/exercise/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功');
      await fetchExercises()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

// ========== 伤病禁忌规则管理 ==========
const exclusionList = ref([])
const loadingExclusions = ref(false)
const exclusionTotal = ref(0)
const exclusionQuery = reactive({page: 1, size: 10, injuryKeyword: '', exerciseId: null, severityLimit: null})

const exclusionDialogVisible = ref(false)
const exclusionDialogTitle = ref('新增规则')
const exclusionSubmitLoading = ref(false)
const exclusionFormRef = ref(null)
const exclusionForm = ref({id: null, injuryKeyword: '', exerciseId: null, severityLimit: null})
const exclusionRules = {
  injuryKeyword: [{required: true, message: '请输入伤病关键词', trigger: 'blur'}],
  exerciseId: [{required: true, message: '请选择运动项目', trigger: 'change'}]
}

const fetchExclusions = async () => {
  loadingExclusions.value = true
  try {
    const res = await request.post('/admin/exclusion/search', exclusionQuery)
    if (res.data.code === 200) {
      exclusionList.value = res.data.data.records || []
      exclusionTotal.value = res.data.data.total || 0
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('获取禁忌规则失败')
  } finally {
    loadingExclusions.value = false
  }
}

const getExerciseName = (exerciseId) => {
  const ex = exerciseList.value.find(e => e.id === exerciseId)
  return ex ? ex.exerciseName : '未知'
}

const openExclusionDialog = (row = null) => {
  if (row) {
    exclusionDialogTitle.value = '编辑规则'
    exclusionForm.value = {
      id: row.id,
      injuryKeyword: row.injuryKeyword,
      exerciseId: row.exerciseId,
      severityLimit: row.severityLimit
    }
  } else {
    exclusionDialogTitle.value = '新增规则'
    exclusionForm.value = {id: null, injuryKeyword: '', exerciseId: null, severityLimit: null}
  }
  exclusionDialogVisible.value = true
}

const submitExclusion = async () => {
  try {
    await exclusionFormRef.value.validate()
  } catch {
    return
  }
  exclusionSubmitLoading.value = true
  try {
    let res
    if (exclusionForm.value.id) {
      res = await request.put('/admin/exclusion/update', exclusionForm.value)
    } else {
      res = await request.post('/admin/exclusion/add', exclusionForm.value)
    }
    if (res.data.code === 200) {
      ElMessage.success(exclusionForm.value.id ? '更新成功' : '新增成功')
      exclusionDialogVisible.value = false
      await fetchExclusions()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    exclusionSubmitLoading.value = false
  }
}

const deleteExclusion = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该规则吗？', '提示', {type: 'warning'})
    const res = await request.delete(`/admin/exclusion/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功');
      await fetchExclusions()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

// ========== 用户管理 ==========
const userList = ref([])
const loadingUsers = ref(false)
const userTotal = ref(0)
const userQuery = reactive({page: 1, size: 10, username: '', nickname: '', role: null, status: null})

const addUserDialogVisible = ref(false)
const addUserLoading = ref(false)
const addUserFormRef = ref(null)
const addUserForm = reactive({username: '', password: '', nickname: '', role: 0, status: 0})
const addUserRules = {
  username: [{required: true, message: '请输入用户名', trigger: 'blur'}],
  password: [{min: 6, message: '密码至少6位', trigger: 'blur'}]
}

const resetPwdDialogVisible = ref(false)
const resetPwdLoading = ref(false)
const resetPwdFormRef = ref(null)
const resetPwdForm = reactive({userId: null, newPassword: ''})
const resetPwdRules = {
  newPassword: [{required: true, min: 6, message: '密码至少6位', trigger: 'blur'}]
}

const fetchUsers = async () => {
  loadingUsers.value = true
  try {
    const res = await request.post('/admin/user/search', userQuery)
    if (res.data.code === 200) {
      userList.value = res.data.data.records || []
      userTotal.value = res.data.data.total || 0
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loadingUsers.value = false
  }
}

const resetUserQuery = () => {
  userQuery.username = ''
  userQuery.nickname = ''
  userQuery.role = null
  userQuery.status = null
  userQuery.page = 1
  fetchUsers()
}

const updateUserStatus = async (userId, status) => {
  try {
    const res = await request.put(`/admin/user/${userId}/status`, null, {params: {status}})
    if (res.data.code === 200) {
      ElMessage.success('状态更新成功');
      fetchUsers()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const openAddUserDialog = () => {
  addUserForm.username = ''
  addUserForm.password = ''
  addUserForm.nickname = ''
  addUserForm.role = 0
  addUserForm.status = 0
  addUserDialogVisible.value = true
}

const submitAddUser = async () => {
  try {
    await addUserFormRef.value.validate()
  } catch {
    return
  }
  addUserLoading.value = true
  try {
    const res = await request.post('/admin/user/add', addUserForm)
    if (res.data.code === 200) {
      ElMessage.success('新增用户成功')
      addUserDialogVisible.value = false
      await fetchUsers()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    addUserLoading.value = false
  }
}

const openResetPasswordDialog = (userId) => {
  resetPwdForm.userId = userId
  resetPwdForm.newPassword = ''
  resetPwdDialogVisible.value = true
}

const submitResetPassword = async () => {
  try {
    await resetPwdFormRef.value.validate()
  } catch {
    return
  }
  resetPwdLoading.value = true
  try {
    const res = await request.put(`/admin/user/${resetPwdForm.userId}/reset-password`, null, {params: {newPassword: resetPwdForm.newPassword}})
    if (res.data.code === 200) {
      ElMessage.success('密码重置成功')
      resetPwdDialogVisible.value = false
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    resetPwdLoading.value = false
  }
}

const hardDeleteUser = async (userId) => {
  try {
    await ElMessageBox.confirm('确定硬删除该用户吗？所有关联数据将被删除！', '警告', {type: 'warning'})
    const res = await request.delete(`/admin/user/${userId}/hard`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功');
      fetchUsers()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

// ========== 方案管理 ==========
const planList = ref([])
const loadingPlans = ref(false)
const planTotal = ref(0)
const planQuery = reactive({page: 1, size: 10, planName: '', userId: null, status: null})

const fetchPlans = async () => {
  loadingPlans.value = true
  try {
    const res = await request.post('/admin/plan/search', planQuery)
    if (res.data.code === 200) {
      planList.value = res.data.data.records || []
      planTotal.value = res.data.data.total || 0
      renderPlanStatusChart()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('获取方案列表失败')
  } finally {
    loadingPlans.value = false
  }
}

const renderPlanStatusChart = () => {
  if (!planStatusChartRef.value) return
  const statuses = {0: '已推荐', 1: '已采纳', 2: '进行中', 3: '已完成', 4: '未完成'}
  const counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}
  planList.value.forEach(plan => {
    if (plan.status !== undefined) counts[plan.status]++
  })
  const data = Object.entries(counts).map(([status, count]) => ({
    name: statuses[status],
    value: count
  })).filter(d => d.value > 0)
  if (planStatusChart) planStatusChart.dispose()
  planStatusChart = echarts.init(planStatusChartRef.value)
  planStatusChart.setOption({
    title: {text: '方案状态分布', left: 'center'},
    tooltip: {trigger: 'item'},
    series: [{type: 'pie', radius: '50%', data, label: {show: true}}]
  })
}

const resetPlanQuery = () => {
  planQuery.planName = ''
  planQuery.userId = null
  planQuery.status = null
  planQuery.page = 1
  fetchPlans()
}

const deletePlan = async (planId) => {
  try {
    await ElMessageBox.confirm('确定删除该方案吗？', '提示', {type: 'warning'})
    const res = await request.delete(`/admin/plan/${planId}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功');
      fetchPlans()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

// ========== 伤病记录管理 ==========
const injuryList = ref([])
const loadingInjuries = ref(false)
const injuryTotal = ref(0)
const injuryQuery = reactive({page: 1, size: 10, injuryLocation: '', userId: null, severity: null, status: null})

const formatInjuryStatus = (status) => {
  if (status === 0) return '治疗中'
  if (status === 1) return '康复中'
  return '已痊愈'
}

const fetchInjuries = async () => {
  loadingInjuries.value = true
  try {
    const res = await request.post('/admin/injury/search', injuryQuery)
    if (res.data.code === 200) {
      injuryList.value = res.data.data.records || []
      injuryTotal.value = res.data.data.total || 0
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('获取伤病记录失败')
  } finally {
    loadingInjuries.value = false
  }
}

const resetInjuryQuery = () => {
  injuryQuery.injuryLocation = ''
  injuryQuery.userId = null
  injuryQuery.severity = null
  injuryQuery.status = null
  injuryQuery.page = 1
  fetchInjuries()
}

const deleteInjury = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该伤病记录吗？', '提示', {type: 'warning'})
    const res = await request.delete(`/admin/injury/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功');
      fetchInjuries()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

// ========== 运动记录管理 ==========
const workoutList = ref([])
const loadingWorkouts = ref(false)
const workoutTotal = ref(0)
const workoutQuery = reactive({
  page: 1,
  size: 10,
  userId: null,
  planId: null,
  completionDate: null,
  workoutRecordStatus: null,
  discomfortFlag: null
})

const fetchWorkoutRecords = async () => {
  loadingWorkouts.value = true
  try {
    const res = await request.post('/admin/record/search', workoutQuery)
    if (res.data.code === 200) {
      workoutList.value = res.data.data.records || []
      workoutTotal.value = res.data.data.total || 0
    } else ElMessage.error(res.data.message)
  } catch (error) {
    ElMessage.error('获取运动记录失败')
  } finally {
    loadingWorkouts.value = false
  }
}

const resetWorkoutQuery = () => {
  workoutQuery.userId = null
  workoutQuery.planId = null
  workoutQuery.completionDate = null
  workoutQuery.workoutRecordStatus = null
  workoutQuery.discomfortFlag = null
  workoutQuery.page = 1
  fetchWorkoutRecords()
}

const deleteWorkoutRecord = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该运动记录吗？', '提示', {type: 'warning'})
    const res = await request.delete(`/admin/record/${id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功');
      fetchWorkoutRecords()
    } else ElMessage.error(res.data.message)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const goBackToUserView = () => router.push('/home')

// 统计图表（未修改，保持原样）
const fetchStats = async () => {
  try {
    const userRes = await request.get('/admin/stats/user-growth')
    if (userRes.data.code === 200) {
      const data = userRes.data.data
      if (userChartRef.value) {
        if (userChart) userChart.dispose()
        userChart = echarts.init(userChartRef.value)
        userChart.setOption({
          tooltip: {trigger: 'axis'},
          xAxis: {type: 'category', data: data.dates},
          yAxis: {type: 'value', name: '注册人数'},
          series: [{type: 'line', data: data.counts, smooth: true, areaStyle: {}}]
        })
      }
    }
    const planRes = await request.get('/admin/stats/plan-growth')
    if (planRes.data.code === 200) {
      const data = planRes.data.data
      if (planChartRef.value) {
        if (planChart) planChart.dispose()
        planChart = echarts.init(planChartRef.value)
        planChart.setOption({
          tooltip: {trigger: 'axis'},
          xAxis: {type: 'category', data: data.dates},
          yAxis: {type: 'value', name: '方案数'},
          series: [{type: 'line', data: data.counts, smooth: true, areaStyle: {}}]
        })
      }
    }
    const completionRes = await request.get('/admin/stats/completion-rate')
    if (completionRes.data.code === 200) {
      const data = completionRes.data.data
      if (completionChartRef.value) {
        if (completionChart) completionChart.dispose()
        completionChart = echarts.init(completionChartRef.value)
        completionChart.setOption({
          tooltip: {trigger: 'item'},
          series: [{
            type: 'gauge', center: ['50%', '50%'], radius: '70%',
            progress: {show: true, width: 18, itemStyle: {color: '#409eff'}},
            axisLine: {lineStyle: {width: 18, color: [[data.rate / 100, '#409eff'], [1, '#e6e6e6']]}},
            pointer: {show: false}, detail: {valueAnimation: true, fontSize: 24, offsetCenter: [0, 0]},
            title: {show: true, offsetCenter: [0, 30], fontSize: 14},
            data: [{value: data.rate, name: '完成率%'}]
          }]
        })
      }
    }
    const ratingRes = await request.get('/admin/stats/rating-distribution')
    if (ratingRes.data.code === 200) {
      const data = ratingRes.data.data
      if (ratingChartRef.value) {
        if (ratingChart) ratingChart.dispose()
        ratingChart = echarts.init(ratingChartRef.value)
        ratingChart.setOption({
          tooltip: {trigger: 'axis', axisPointer: {type: 'shadow'}},
          xAxis: {type: 'category', data: data.scores, name: '评分'},
          yAxis: {type: 'value', name: '数量'},
          series: [{type: 'bar', data: data.counts, itemStyle: {borderRadius: [4, 4, 0, 0]}}]
        })
      }
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

onMounted(async () => {
  await fetchExercises()
  await fetchExclusions()
  await fetchUsers()
  await fetchPlans()
  await fetchInjuries()
  await fetchWorkoutRecords()
  await fetchStats()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
  background: #fff;
  border-radius: 16px;
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
</style>