<template>
  <div class="table-list-demo">
    <el-card class="demo-card">
      <template #header>
        <span>示例 1: 基础表格</span>
      </template>
      <MfwTableList
        :data="tableData1"
        :columns="columns1"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 2: 带边框和斑马纹</span>
      </template>
      <MfwTableList
        :data="tableData2"
        :columns="columns2"
        :border="true"
        :stripe="true"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 3: 多选表格</span>
      </template>
      <MfwTableList
        ref="tableRef3"
        :data="tableData3"
        :columns="columns3"
        :selection="true"
        @selection-change="handleSelectionChange3"
      />
      <div class="demo-actions">
        <el-button @click="clearSelection3">清空选中</el-button>
        <el-button @click="toggleAllSelection3">全选/取消全选</el-button>
        <el-tag v-if="selectedRows3.length > 0">已选择 {{ selectedRows3.length }} 行</el-tag>
      </div>
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 4: 带操作列</span>
      </template>
      <MfwTableList
        :data="tableData4"
        :columns="columns4"
        :action-column="actionColumn4"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 5: 带序号列</span>
      </template>
      <MfwTableList
        :data="tableData5"
        :columns="columns5"
        :index="true"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 6: 分组列</span>
      </template>
      <MfwTableList
        :data="tableData6"
        :columns="columns6"
      />
    </el-card>

    <el-card class="demo-card">
      <template #header>
        <span>示例 7: 加载状态</span>
      </template>
      <MfwTableList
        :data="tableData7"
        :columns="columns7"
        :loading="loading7"
      />
      <div class="demo-actions">
        <el-button @click="toggleLoading7">切换加载状态</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { ElTag, ElButton, ElMessage } from 'element-plus'
import { MfwTableList } from 'moyan-mfw-base-frontend'
import type { TableColumnConfig } from 'moyan-mfw-base-frontend'

// Action column type for MfwTableList (different from page-scene's ActionColumn)
interface TableListActionColumn {
  label?: string
  width?: number | string
  fixed?: boolean | 'left' | 'right'
  render: (scope: { row: any; $index: number }) => any
}

// ==================== 示例 1: 基础表格 ====================
const tableData1 = [
  { id: 1, name: '张三', age: 28, email: 'zhangsan@example.com' },
  { id: 2, name: '李四', age: 32, email: 'lisi@example.com' },
  { id: 3, name: '王五', age: 25, email: 'wangwu@example.com' },
  { id: 4, name: '赵六', age: 30, email: 'zhaoliu@example.com' },
  { id: 5, name: '孙七', age: 27, email: 'sunqi@example.com' }
]

const columns1: TableColumnConfig[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '姓名', minWidth: 120 },
  { prop: 'age', label: '年龄', width: 80 },
  { prop: 'email', label: '邮箱', minWidth: 180 }
]

// ==================== 示例 2: 带边框和斑马纹 ====================
const tableData2 = [
  { id: 1, product: 'iPhone 15 Pro', price: 7999, stock: 100 },
  { id: 2, product: 'MacBook Pro', price: 12999, stock: 50 },
  { id: 3, product: 'iPad Pro', price: 8999, stock: 80 },
  { id: 4, product: 'AirPods Pro', price: 1899, stock: 200 },
  { id: 5, product: 'Apple Watch', price: 2999, stock: 150 }
]

const columns2: TableColumnConfig[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'product', label: '产品名称', minWidth: 150 },
  { prop: 'price', label: '价格', width: 100 },
  { prop: 'stock', label: '库存', width: 80 }
]

// ==================== 示例 3: 多选表格 ====================
const tableRef3 = ref<any>()
const selectedRows3 = ref<any[]>([])

const tableData3 = [
  { id: 1, orderNo: 'ORD001', amount: 299, status: 1 },
  { id: 2, orderNo: 'ORD002', amount: 599, status: 0 },
  { id: 3, orderNo: 'ORD003', amount: 899, status: 1 },
  { id: 4, orderNo: 'ORD004', amount: 1299, status: 2 },
  { id: 5, orderNo: 'ORD005', amount: 2599, status: 1 }
]

const columns3: TableColumnConfig[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'orderNo', label: '订单号', minWidth: 120 },
  { prop: 'amount', label: '金额', width: 100 },
  {
    prop: 'status',
    label: '状态',
    width: 100,
    render: (scope: any) => {
      const statusMap: Record<number, { type: string; text: string }> = {
        0: { type: 'info', text: '待支付' },
        1: { type: 'success', text: '已完成' },
        2: { type: 'warning', text: '已取消' }
      }
      const status = statusMap[scope.row.status] || { type: '', text: '未知' }
      return h(ElTag, { type: status.type as any }, () => status.text)
    }
  }
]

const handleSelectionChange3 = (selection: any[]) => {
  selectedRows3.value = selection
}

const clearSelection3 = () => {
  tableRef3.value?.clearSelection()
}

const toggleAllSelection3 = () => {
  tableRef3.value?.toggleAllSelection()
}

// ==================== 示例 4: 带操作列 ====================
const tableData4 = [
  { id: 1, name: '张三', phone: '13800138000', city: '北京' },
  { id: 2, name: '李四', phone: '13900139000', city: '上海' },
  { id: 3, name: '王五', phone: '13700137000', city: '广州' },
  { id: 4, name: '赵六', phone: '13600136000', city: '深圳' }
]

const columns4: TableColumnConfig[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '姓名', minWidth: 100 },
  { prop: 'phone', label: '电话', width: 130 },
  { prop: 'city', label: '城市', minWidth: 100 }
]

const actionColumn4: TableListActionColumn = {
  label: '操作',
  width: 220,
  fixed: 'right',
  render: (scope: { row: any; $index: number }) =>
    h('div', { style: 'display: flex; gap: 8px; justify-content: center;' }, [
      h(ElButton, { size: 'small', type: 'primary', link: true, onClick: () => ElMessage.info(`查看：${scope.row.name}`) }, () => '查看'),
      h(ElButton, { size: 'small', type: 'primary', link: true, onClick: () => ElMessage.info(`编辑：${scope.row.name}`) }, () => '编辑'),
      h(ElButton, { size: 'small', type: 'danger', link: true, onClick: () => ElMessage.info(`删除：${scope.row.name}`) }, () => '删除')
    ])
}

// ==================== 示例 5: 带序号列 ====================
const tableData5 = [
  { rank: 1, team: '中国队', gold: 9, silver: 4, bronze: 2 },
  { rank: 2, team: '美国队', gold: 8, silver: 6, bronze: 3 },
  { rank: 3, team: '日本队', gold: 5, silver: 7, bronze: 5 },
  { rank: 4, team: '韩国队', gold: 4, silver: 5, bronze: 6 },
  { rank: 5, team: '英国队', gold: 3, silver: 4, bronze: 7 }
]

const columns5: TableColumnConfig[] = [
  { prop: 'rank', label: '排名', width: 80 },
  { prop: 'team', label: '代表队', minWidth: 120 },
  { prop: 'gold', label: '金牌', width: 80 },
  { prop: 'silver', label: '银牌', width: 80 },
  { prop: 'bronze', label: '铜牌', width: 80 }
]

// ==================== 示例 6: 分组列 ====================
const tableData6 = [
  { id: 1, name: '张三', chinese: 95, math: 88, english: 92 },
  { id: 2, name: '李四', chinese: 88, math: 95, english: 85 },
  { id: 3, name: '王五', chinese: 92, math: 90, english: 89 }
]

const columns6: TableColumnConfig[] = [
  { prop: 'id', label: '学号', width: 80 },
  { prop: 'name', label: '姓名', width: 100 },
  {
    prop: 'score',
    label: '成绩',
    children: [
      { prop: 'chinese', label: '语文', width: 80 },
      { prop: 'math', label: '数学', width: 80 },
      { prop: 'english', label: '英语', width: 80 }
    ]
  }
]

// ==================== 示例 7: 加载状态 ====================
const loading7 = ref(false)
const tableData7 = [
  { id: 1, task: '需求分析', progress: 100, assignee: '张三' },
  { id: 2, task: 'UI 设计', progress: 80, assignee: '李四' },
  { id: 3, task: '前端开发', progress: 60, assignee: '王五' },
  { id: 4, task: '后端开发', progress: 40, assignee: '赵六' },
  { id: 5, task: '测试', progress: 0, assignee: '孙七' }
]

const columns7: TableColumnConfig[] = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'task', label: '任务', minWidth: 150 },
  {
    prop: 'progress',
    label: '进度',
    width: 150,
    render: (scope: any) =>
      h('div', { style: 'display: flex; align-items: center; gap: 8px;' }, [
        h('div', {
          style: 'flex: 1; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden;'
        }, [
          h('div', {
            style: `width: ${scope.row.progress}%; height: 100%; background: linear-gradient(90deg, #409EFF, #67c23a); border-radius: 5px;`
          })
        ]),
        h('span', { style: 'font-size: 12px; color: #909399;' }, `${scope.row.progress}%`)
      ])
  },
  { prop: 'assignee', label: '负责人', width: 100 }
]

const toggleLoading7 = () => {
  loading7.value = !loading7.value
}
</script>

<style scoped lang="scss">
.table-list-demo {
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
