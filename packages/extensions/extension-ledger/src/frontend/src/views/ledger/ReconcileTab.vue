<!--
/**
 * @fileoverview 对账报告 Tab
 * @description MfwListPage 报告列表（真实数据）；手动触发全量对账、单账户对账、增量修复
 *   定时对账由业务方对接 extension-scheduler
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" :loading="running" test-id="ledger-reconcile-run" @click="handleRunAll">手动触发对账</el-button>
    </template>
    <MfwListPage
      ref="listPageRef"
      :search-template="searchTemplate"
      :columns="columns"
      :formatters="formatters"
      :action-column="actionColumn"
      :load-data="loadData"
      :page-size="20"
      :stripe="true"
    />
    <!-- 单账户对账/修复工具条 -->
    <div class="toolbar">
      <el-input v-model="accountId" placeholder="单账户对账/修复（输入账户ID）" clearable style="width: 260px" />
      <el-button :disabled="!accountId" test-id="ledger-reconcile-account" @click="handleRunAccount">单账户对账</el-button>
      <el-button type="warning" :disabled="!accountId" test-id="ledger-reconcile-fix" @click="handleFix">增量修复</el-button>
    </div>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { ElButton, ElMessage, ElTag } from 'element-plus'
import { MfwPageWrapper, MfwListPage, MfwPopup } from 'moyan-mfw-base/frontend'
import type { SearchTemplateItem, TableColumnConfig, ActionColumnConfig, LoadParams, TableData, MfwListPageInstance } from 'moyan-mfw-base/frontend'
import {
  ApiLedgerRunReconcile,
  ApiLedgerRunAccountReconcile,
  ApiLedgerApplyFix,
  ApiLedgerListReconcileReports,
} from '../../apis/ledger'
import { formatAmount } from './shared'
import LedgerReconcileDetail from '../../components/ledger-reconcile-detail/Index.vue'

defineOptions({ name: 'MfwLedgerReconcileTab' })

const listPageRef = ref<MfwListPageInstance>()
const running = ref(false)
const accountId = ref('')

const searchTemplate: SearchTemplateItem[] = [
  {
    key: 'status',
    label: '状态',
    type: 'select' as const,
    placeholder: '全部状态',
    elProps: {
      clearable: true,
      options: [
        { value: 1, label: '差异待处理' },
        { value: 2, label: '已处理' },
      ],
    },
    testId: 'ledger-reconcile-search-status',
  },
]

const columns: TableColumnConfig[] = [
  { prop: 'id', label: '报告ID', width: 300, cp: true },
  {
    prop: 'triggerType',
    label: '触发方式',
    width: 100,
    formatter: 'triggerType',
  },
  { prop: 'totalAccounts', label: '检查账户', width: 100, align: 'right' },
  {
    prop: 'diffCount',
    label: '差异账户',
    width: 100,
    align: 'right',
    render: ({ row }) => h(ElTag, { type: (row as any).diffCount > 0 ? 'danger' : 'success', size: 'small' }, () => String((row as any).diffCount)),
  },
  {
    prop: 'status',
    label: '状态',
    width: 110,
    render: ({ row }) =>
      h(ElTag, { type: (row as any).status === 1 ? 'warning' : 'success', size: 'small' }, () => ((row as any).status === 1 ? '差异待处理' : '已处理')),
  },
  { prop: 'createdAt', label: '触发时间', width: 170, formatter: 'dateTime' },
  {
    prop: 'diffs',
    label: '差异明细',
    minWidth: 200,
    showOverflowTooltip: true,
    render: ({ row }) => {
      const diffs = (row as any).diffs
      if (!diffs?.length) return h('span', {}, '-')
      return h('span', {}, diffs.map((d: any) => `${d.accountId}:${formatAmount(d.diff)}`).join('; '))
    },
  },
]

/** 命名格式化方法表（MfwListPage 注入，列配置 formatter 按名查找） */
const formatters = {
  triggerType: (value: number) => (value === 1 ? '手动' : '外部调度'),
}

/** 操作列：报告详情抽屉 */
const actionColumn: ActionColumnConfig = {
  label: '操作',
  width: 90,
  fixed: 'right',
  render: ({ row }: { row: any }) =>
    h(
      ElButton,
      { type: 'info', size: 'small', onClick: () => handleDetail(row) },
      { default: () => '详情' },
    ),
}

/** 报告详情抽屉（差异明细完整表格） */
function handleDetail(row: any): void {
  MfwPopup.open({
    title: `对账报告详情 - ${row.id}`,
    type: 'drawer',
    position: 'rtl',
    component: LedgerReconcileDetail,
    elProps: { detail: row },
    popupProps: { size: 800 },
  })
}

/** 报告列表加载 */
async function loadData(params: LoadParams): Promise<TableData> {
  const res = await new ApiLedgerListReconcileReports({
    query: {
      status: params.status !== undefined && params.status !== null && params.status !== '' ? Number(params.status) : undefined,
      page: params.page,
      pageSize: params.pageSize,
    },
  })
  return { list: res?.items ?? [], total: res?.total ?? 0 }
}

/** 手动触发全量对账 */
async function handleRunAll(): Promise<void> {
  running.value = true
  try {
    const res = (await new ApiLedgerRunReconcile({}, { hintSuccess: true } as any)) as any
    ElMessage.success(
      res?.diffCount > 0
        ? `对账完成：${res?.totalAccounts} 个账户，${res?.diffCount} 个有差异`
        : `对账完成：${res?.totalAccounts} 个账户全部平衡`,
    )
    listPageRef.value?.refresh()
  } finally {
    running.value = false
  }
}

/** 单账户对账 */
async function handleRunAccount(): Promise<void> {
  try {
    const res = (await new ApiLedgerRunAccountReconcile({ params: { accountId: accountId.value } })) as any
    ElMessage.success(res?.balanced ? '账户平衡' : `账户有差异: ${formatAmount(res?.diff)}`)
  } catch {
    return
  }
}

/** 增量修复 */
async function handleFix(): Promise<void> {
  try {
    const res = (await new ApiLedgerApplyFix({ params: { accountId: accountId.value } }, { hintSuccess: true } as any)) as any
    if (res?.fixed) {
      ElMessage.success(`修复完成，diff=${formatAmount(res?.diff)}`)
    } else {
      ElMessage.error(`修复失败或需人工介入: diff=${formatAmount(res?.diff)}`)
    }
  } catch {
    return
  }
}

/** Tab 切换刷新 */
async function refresh(): Promise<void> {
  await listPageRef.value?.refresh()
}

defineExpose({ refresh })
</script>

<style scoped>
.toolbar {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
