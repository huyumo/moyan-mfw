<template>
  <div class="user-picker-demo">
    <el-card class="demo-card">
      <template #header>
        <span>示例 1: 基础用法</span>
      </template>
      <MfwUserPicker
        v-model="selectedUser1"
        placeholder="请选择用户"
        :load-user-list="loadUserList"
        @change="handleChange1"
      />
      <div class="demo-data">
        <strong>选中用户:</strong>
        <pre>{{ selectedUser1 ? JSON.stringify(selectedUser1, null, 2) : '未选择' }}</pre>
      </div>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 2: 禁用状态</span>
      </template>
      <MfwUserPicker
        v-model="selectedUser2"
        placeholder="请选择用户"
        :disabled="true"
        :load-user-list="loadUserList"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 3: 带部门树过滤</span>
      </template>
      <MfwUserPicker
        v-model="selectedUser3"
        placeholder="请选择用户"
        :load-user-list="loadUserList"
        :department-data="departmentData"
        :show-department-filter="true"
        @department-change="handleDepartmentChange"
      />
      <div class="demo-data">
        <strong>选中用户:</strong>
        <pre>{{ selectedUser3 ? JSON.stringify(selectedUser3, null, 2) : '未选择' }}</pre>
      </div>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 4: 带默认值</span>
      </template>
      <MfwUserPicker
        v-model="selectedUser4"
        placeholder="请选择用户"
        :load-user-list="loadUserList"
      />
      <div class="demo-actions">
        <el-button @click="setDefaultValue">设置默认值</el-button>
        <el-button @click="clearValue">清空值</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { MfwUserPicker } from 'moyan-mfw-base-frontend'
import type { UserInfo, DepartmentInfo } from 'moyan-mfw-base-frontend'

// ==================== 示例 1: 基础用法 ====================
const selectedUser1 = ref<UserInfo | undefined>(undefined)

const handleChange1 = (user: UserInfo | undefined) => {
  console.log('用户变化:', user)
  if (user) {
    ElMessage.success(`选中用户：${user.name}`)
  }
}

// ==================== 示例 2: 禁用状态 ====================
const selectedUser2 = ref<UserInfo | undefined>({
  id: 99,
  name: '禁用用户',
  avatar: '',
  phone: '13800138000',
  email: 'disabled@example.com',
  departmentId: 1
})

// ==================== 示例 3: 带部门树过滤 ====================
const selectedUser3 = ref<UserInfo | undefined>(undefined)

// 部门数据
const departmentData: DepartmentInfo[] = [
  {
    id: 1,
    name: '技术部',
    children: [
      { id: 11, name: '前端组', children: [] },
      { id: 12, name: '后端组', children: [] }
    ]
  },
  {
    id: 2,
    name: '产品部',
    children: [
      { id: 21, name: '产品组', children: [] },
      { id: 22, name: '设计组', children: [] }
    ]
  },
  {
    id: 3,
    name: '运营部',
    children: []
  }
]

const handleDepartmentChange = (department: DepartmentInfo | null) => {
  if (department) {
    ElMessage.info(`切换到部门：${department.name}`)
  }
}

// ==================== 示例 4: 带默认值 ====================
const selectedUser4 = ref<UserInfo | undefined>(undefined)

const setDefaultValue = () => {
  selectedUser4.value = {
    id: 1,
    name: '张三',
    avatar: '',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    departmentId: 1
  }
  ElMessage.success('已设置默认值')
}

const clearValue = () => {
  selectedUser4.value = undefined
  ElMessage.info('已清空值')
}

// ==================== 模拟用户数据加载 ====================
// 模拟用户数据
const mockUsers: UserInfo[] = [
  {
    id: 1,
    name: '张三',
    avatar: '',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    departmentId: 1
  },
  {
    id: 2,
    name: '李四',
    avatar: '',
    phone: '13800138001',
    email: 'lisi@example.com',
    departmentId: 1
  },
  {
    id: 3,
    name: '王五',
    avatar: '',
    phone: '13800138002',
    email: 'wangwu@example.com',
    departmentId: 2
  },
  {
    id: 4,
    name: '赵六',
    avatar: '',
    phone: '13800138003',
    email: 'zhaoliu@example.com',
    departmentId: 2
  },
  {
    id: 5,
    name: '孙七',
    avatar: '',
    phone: '13800138004',
    email: 'sunqi@example.com',
    departmentId: 3
  }
]

// 加载用户列表函数
const loadUserList = async (params?: {
  keyword?: string
  departmentId?: string | number
  page?: number
  pageSize?: number
}): Promise<{ list: UserInfo[]; total: number }> => {
  console.log('加载用户列表:', params)

  let filtered = [...mockUsers]

  // 按关键词过滤
  if (params?.keyword) {
    const keyword = params.keyword.toLowerCase()
    filtered = filtered.filter(
      user =>
        user.name.toLowerCase().includes(keyword) ||
        (user.email || '').toLowerCase().includes(keyword)
    )
  }

  // 按部门过滤
  if (params?.departmentId) {
    filtered = filtered.filter(user => user.departmentId === params.departmentId)
  }

  // 分页
  const page = params?.page || 1
  const pageSize = params?.pageSize || 50
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginated = filtered.slice(start, end)

  return {
    list: paginated,
    total: filtered.length
  }
}
</script>

<style scoped lang="scss">
.user-picker-demo {
  padding: 24px;
}

.demo-card {
  margin-bottom: 20px;
}

.demo-data {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.demo-data pre {
  margin: 8px 0 0;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
}

.demo-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}
</style>
