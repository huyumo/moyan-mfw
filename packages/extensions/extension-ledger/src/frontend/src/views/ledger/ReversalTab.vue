<!--
/**
 * @fileoverview 冲正记录 Tab
 * @description MfwListPage 列表（审计入口）：冲正记录独立落表（不入交易单表），
 *   可按冲正单号/原单号/业务类型检索；行操作「详情」抽屉复用 ledger-reversal-detail 组件
 */
-->
<template>
  <MfwPageWrapper>
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
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { ElButton, ElTag } from 'element-plus'
import { MfwPageWrapper, MfwListPage, MfwPopup } from 'moyan-mfw-base/frontend'
import type { SearchTemplateItem, TableColumnConfig, ActionColumnConfig, LoadParams, TableData, MfwListPageInstance } from 'moyan-mfw-base/frontend'
import { ApiLedgerListReversals, type LedgerReversalItem } from '../../apis/ledger'
import { formatAmount, reversalStatusLabel, reversalStatusTagType } from './shared'
import LedgerReversalDetail from '../../components/ledger-reversal-detail/Index.vue'

defineOptions({ name: 'MfwLedgerReversalTab' })

const listPageRef = ref<MfwListPageInstance>()

const searchTemplate: SearchTemplateItem[] = [
  {
    key: 'reversalNo',
    label: '冲正单号',
    type: 'input' as const,
    placeholder: '冲正单号（R 前缀）',
    elProps: { clearable: true },
    testId: 'ledger-reversal-search-no',
  },
  {
    key: 'originalTransferNo',
    label: '原交易单号',
    type: 'input' as const,
    placeholder: '原交易单号',
    elProps: { clearable: true },
    testId: 'ledger-reversal-search-original',
  },
  {
    key: 'bizType',
    label: '业务类型',
    type: 'input' as const,
    placeholder: '冲正操作类型（如 reverse）',
    elProps: { clearable: true },
    testId: 'ledger-reversal-search-biz',
  },
]

const columns: TableColumnConfig[] = [
  { prop: 'reversalNo', label: '冲正单号', width: 260, cp: true },
  { prop: 'originalTransferNo', label: '原交易单号', width: 260, cp: true },
  { prop: 'bizType', label: '业务类型', width: 100 },
  {
    prop: 'status',
    label: '状态',
    width: 90,
    render: ({ row }) =>
      h(ElTag, { type: (reversalStatusTagType[(row as LedgerReversalItem).status] as any) ?? 'info', size: 'small' }, () => reversalStatusLabel[(row as LedgerReversalItem).status] ?? '-'),
  },
  {
    prop: 'amount',
    label: '冲正金额',
    width: 150,
    align: 'right',
    formatter: 'formatAmount',
  },
  { prop: 'fromAccountId', label: '原转出方', width: 260, cp: true },
  { prop: 'createdAt', label: '冲正时间', minWidth: 160, formatter: 'dateTime' },
]

/** 命名格式化方法表（金额按币种格式化） */
const formatters = {
  formatAmount: (value: string, row: LedgerReversalItem) => formatAmount(value, row.currency ?? 'CNY'),
}

/** 操作列：详情抽屉 */
const actionColumn: ActionColumnConfig = {
  label: '操作',
  width: 90,
  fixed: 'right',
  render: ({ row }: { row: LedgerReversalItem }) =>
    h(
      ElButton,
      { type: 'info', size: 'small', onClick: () => handleDetail(row) },
      { default: () => '详情' },
    ),
}

/** 冲正记录详情抽屉 */
function handleDetail(row: LedgerReversalItem): void {
  MfwPopup.open({
    title: `冲正记录 - ${row.reversalNo}`,
    type: 'drawer',
    position: 'rtl',
    component: LedgerReversalDetail,
    elProps: { detail: row },
    popupProps: { size: 800 },
  })
}

/** 列表加载 */
async function loadData(params: LoadParams): Promise<TableData> {
  const res = await new ApiLedgerListReversals({
    query: {
      reversalNo: (params.reversalNo as string) || undefined,
      originalTransferNo: (params.originalTransferNo as string) || undefined,
      bizType: (params.bizType as string) || undefined,
      page: params.page,
      pageSize: params.pageSize,
    },
  })
  return { list: res?.items ?? [], total: res?.total ?? 0 }
}

/** Tab 切换刷新 */
async function refresh(): Promise<void> {
  await listPageRef.value?.refresh()
}

defineExpose({ refresh })
</script>
