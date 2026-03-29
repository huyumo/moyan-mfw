<template>
  <div class="page-scene-demo">
    <el-card class="demo-card">
      <template #header>
        <span>示例 1: 基础用法 - 搜索面板 + 表格一体化</span>
      </template>
      <MfwPageScene
        :search-template="searchTemplate1"
        :columns="columns1"
        :load-data="loadData1"
        :show-search="true"
        :show-refresh="true"
        @search="handleSearch"
        @reset="handleReset"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 2: 带行选择的表格</span>
      </template>
      <MfwPageScene
        ref="pageSceneRef2"
        :search-template="[]"
        :columns="columns2"
        :load-data="loadData2"
        :row-selection="true"
        :show-search="false"
        @selection-change="handleSelectionChange"
      />
      <div class="demo-actions">
        <el-button @click="getSelection">获取选中行</el-button>
        <el-button @click="clearSelection">清空选中</el-button>
        <el-tag v-if="selectedRows.length > 0">已选择 {{ selectedRows.length }} 行</el-tag>
      </div>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 3: 自定义列渲染 - 操作列</span>
      </template>
      <MfwPageScene
        :search-template="[]"
        :columns="columns3"
        :action-column="actionColumn3"
        :load-data="loadData3"
        :show-search="false"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 4: 带排序的表格</span>
      </template>
      <MfwPageScene
        :search-template="[]"
        :columns="columns4"
        :load-data="loadData4"
        :show-search="false"
        @sort-change="handleSortChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { ElTag, ElButton, ElMessage } from 'element-plus'
import { MfwPageScene } from 'moyan-mfw-base-frontend'
import type { SearchTemplateItem, TableColumn, ActionColumn } from 'moyan-mfw-base-frontend'

// ==================== 示例 1: 基础用法 ====================
const searchTemplate1: SearchTemplateItem[] = [
  {
    key: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '请输入用户名或邮箱'
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    placeholder: '请选择状态',
    elProps: {
      options: [
        { label: '启用', value: 1 },
        { label: '禁用', value: 0 }
      ]
    }
  },
  {
    key: 'date',
    label: '日期',
    type: 'date-picker',
    placeholder: '选择日期'
  }
]

const columns1: TableColumn[] = [
  { prop: 'name', label: '姓名', minWidth: 120 },
  { prop: 'email', label: '邮箱', minWidth: 180 },
  {
    prop: 'status',
    label: '状态',
    width: 100,
    render: (scope: any) =>
      h(ElTag, { type: scope.row.status === 1 ? 'success' : 'danger' }, () =>
        scope.row.status === 1 ? '启用' : '禁用'
      )
  },
  { prop: 'createTime', label: '创建时间', minWidth: 160 }
]

const loadData1 = async (params: any) => {
  console.log('示例 1 加载数据，参数:', params)
  return {
    list: [
      { id: 1, name: '张三', email: 'zhangsan@example.com', status: 1, createTime: '2024-01-01 10:00:00' },
      { id: 2, name: '李四', email: 'lisi@example.com', status: 0, createTime: '2024-01-02 11:00:00' },
      { id: 3, name: '王五', email: 'wangwu@example.com', status: 1, createTime: '2024-01-03 12:00:00' },
      { id: 4, name: '赵六', email: 'zhaoliu@example.com', status: 1, createTime: '2024-01-04 13:00:00' },
      { id: 5, name: '孙七', email: 'sunqi@example.com', status: 0, createTime: '2024-01-05 14:00:00' }
    ],
    total: 5
  }
}

// ==================== 示例 2: 带行选择的表格 ====================
const pageSceneRef2 = ref<any>()
const selectedRows = ref<any[]>([])

const columns2: TableColumn[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'productName', label: '产品名称', minWidth: 150 },
  { prop: 'price', label: '价格', width: 100 },
  { prop: 'stock', label: '库存', width: 100 }
]

const loadData2 = async (params: any) => {
  console.log('示例 2 加载数据，参数:', params)
  return {
    list: [
      { id: 1, productName: 'iPhone 15 Pro', price: 7999, stock: 100 },
      { id: 2, productName: 'MacBook Pro 14"', price: 12999, stock: 50 },
      { id: 3, productName: 'iPad Pro 12.9"', price: 8999, stock: 80 },
      { id: 4, productName: 'AirPods Pro 2', price: 1899, stock: 200 },
      { id: 5, productName: 'Apple Watch S9', price: 2999, stock: 150 }
    ],
    total: 5
  }
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

const getSelection = () => {
  ElMessage.info(`选中了 ${selectedRows.value.length} 行`)
  console.log('选中的行:', selectedRows.value)
}

const clearSelection = () => {
  pageSceneRef2.value?.clearSelection()
}

// ==================== 示例 3: 自定义列渲染 ====================
const columns3: TableColumn[] = [
  { prop: 'orderNo', label: '订单号', minWidth: 150 },
  { prop: 'amount', label: '金额', width: 100 },
  {
    prop: 'orderStatus',
    label: '状态',
    width: 100,
    render: (scope: any) => {
      const statusMap: Record<number, { type: string; text: string }> = {
        0: { type: 'info', text: '待支付' },
        1: { type: 'warning', text: '待发货' },
        2: { type: 'success', text: '已完成' },
        3: { type: 'danger', text: '已取消' }
      }
      const status = statusMap[scope.row.orderStatus] || { type: '', text: '未知' }
      return h(ElTag, { type: status.type as any }, () => status.text)
    }
  },
  { prop: 'orderTime', label: '下单时间', minWidth: 160 }
]

const actionColumn3: ActionColumn = {
  prop: 'action',
  label: '操作',
  width: 200,
  fixed: 'right',
  render: (scope: any) =>
    h('div', { style: 'display: flex; gap: 8px; justify-content: center;' }, [
      h(ElButton, { size: 'small', onClick: () => ElMessage.info(`查看订单：${scope.row.orderNo}`) }, () => '查看'),
      h(ElButton, { size: 'small', type: 'primary', onClick: () => ElMessage.info(`编辑订单：${scope.row.orderNo}`) }, () => '编辑'),
      h(ElButton, { size: 'small', type: 'danger', onClick: () => ElMessage.info(`删除订单：${scope.row.orderNo}`) }, () => '删除')
    ])
}

const loadData3 = async (params: any) => {
  console.log('示例 3 加载数据，参数:', params)
  return {
    list: [
      { orderNo: 'ORD202401010001', amount: 7999, orderStatus: 1, orderTime: '2024-01-01 10:30:00' },
      { orderNo: 'ORD202401020002', amount: 12999, orderStatus: 2, orderTime: '2024-01-02 11:30:00' },
      { orderNo: 'ORD202401030003', amount: 1899, orderStatus: 0, orderTime: '2024-01-03 12:30:00' },
      { orderNo: 'ORD202401040004', amount: 2999, orderStatus: 3, orderTime: '2024-01-04 13:30:00' }
    ],
    total: 4
  }
}

// ==================== 示例 4: 带排序的表格 ====================
const columns4: TableColumn[] = [
  { prop: 'name', label: '姓名', minWidth: 120, sortable: true },
  { prop: 'age', label: '年龄', width: 80, sortable: true },
  { prop: 'score', label: '分数', width: 100, sortable: true },
  { prop: 'department', label: '部门', minWidth: 150 }
]

const loadData4 = async (params: any) => {
  console.log('示例 4 加载数据，参数:', params)
  let data = [
    { name: '张三', age: 28, score: 95, department: '技术部' },
    { name: '李四', age: 32, score: 88, department: '产品部' },
    { name: '王五', age: 25, score: 92, department: '设计部' },
    { name: '赵六', age: 30, score: 85, department: '运营部' },
    { name: '孙七', age: 27, score: 98, department: '技术部' }
  ]

  if (params.sortProp && params.sortOrder) {
    const prop = params.sortProp as keyof typeof data[0]
    data = data.sort((a, b) => {
      const aVal = a[prop]
      const bVal = b[prop]
      if (params.sortOrder === 'ascending') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }

  return {
    list: data,
    total: 5
  }
}

// ==================== 事件处理 ====================
const handleSearch = (searchForm: any) => {
  console.log('搜索事件，表单值:', searchForm)
  ElMessage.info('执行搜索')
}

const handleReset = () => {
  console.log('重置事件')
  ElMessage.info('已重置搜索条件')
}

const handleSortChange = (sort: { prop: string; order: 'ascending' | 'descending' | null }) => {
  console.log('排序变化:', sort)
  ElMessage.info(`按 ${sort.prop} ${sort.order === 'ascending' ? '升序' : '降序'} 排序`)
}
</script>

<style scoped lang="scss">
.page-scene-demo {
  padding: 24px;
}

.demo-card {
  margin-bottom: 20px;
}

.demo-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
