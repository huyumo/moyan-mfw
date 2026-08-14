<!--
/**
 * @fileoverview 分录流水 Tab
 * @description MfwListPage 列表（账户ID 必填单分区裁剪）；借贷方向筛选；导出（31 天限时）
 *   账户ID 直接输入查询（避免大账户量下拉加载问题）；行操作「详情」抽屉
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button test-id="ledger-entry-export" @click="handleExport">导出(31天内)</el-button>
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
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { ElButton, ElMessage, ElTag } from 'element-plus'
import { MfwPageWrapper, MfwListPage, MfwPopup } from 'moyan-mfw-base/frontend'
import type { SearchTemplateItem, TableColumnConfig, ActionColumnConfig, LoadParams, TableData, MfwListPageInstance } from 'moyan-mfw-base/frontend'
import { ApiLedgerListEntries, ApiLedgerExportEntries, type LedgerEntryItem } from '../../apis/ledger'
import { formatAmount, directionLabel, directionTagType } from './shared'
import LedgerEntryDetail from '../../components/ledger-entry-detail/Index.vue'

defineOptions({ name: 'MfwLedgerEntryTab' })

const listPageRef = ref<MfwListPageInstance>()

const searchTemplate: SearchTemplateItem[] = [
  {
    key: 'accountId',
    label: '账户ID',
    type: 'input' as const,
    placeholder: '必填（单分区裁剪）',
    required: true,
    componentWidth: 340, // UUID 较长，加宽输入框保证显示完整
    elProps: { clearable: true },
    testId: 'ledger-entry-search-account',
  },
  {
    key: 'transferNo',
    label: '交易单号',
    type: 'input' as const,
    placeholder: '交易单号',
    elProps: { clearable: true },
    testId: 'ledger-entry-search-transfer',
  },
  {
    key: 'direction',
    label: '借贷方向',
    type: 'select' as const,
    placeholder: '全部',
    elProps: { clearable: true, options: Object.entries(directionLabel).map(([value, label]) => ({ value: Number(value), label })) },
    testId: 'ledger-entry-search-direction',
  },
]

const columns: TableColumnConfig[] = [
  { prop: 'entryNo', label: '分录单号', width: 300, cp: true },
  { prop: 'transferNo', label: '交易单号', width: 300, cp: true },
  { prop: 'accountId', label: '账户ID', width: 300, cp: true },
  {
    prop: 'direction',
    label: '方向',
    width: 70,
    render: ({ row }) =>
      h(ElTag, { type: (directionTagType[(row as LedgerEntryItem).direction] as any) ?? 'info', size: 'small' }, () => directionLabel[(row as LedgerEntryItem).direction] ?? '-'),
  },
  {
    prop: 'signedAmount',
    label: '符号金额',
    width: 150,
    align: 'right',
    formatter: 'formatAmount',
  },
  {
    prop: 'balanceBefore',
    label: '变更前',
    width: 140,
    align: 'right',
    formatter: 'formatAmount',
  },
  {
    prop: 'balanceAfter',
    label: '变更后',
    width: 140,
    align: 'right',
    formatter: 'formatAmount',
  },
  { prop: 'createdAt', label: '时间', minWidth: 170, formatter: 'dateTime' },
]

/** 命名格式化方法表（MfwListPage 注入，列配置 formatter 按名查找；formatter 契约为 (value, row)）
 * 金额按分录币种格式化（ITG 0 位小数 / CNY 2 位小数；历史数据无币种回退 CNY） */
const formatters = {
  formatAmount: (value: string, row: LedgerEntryItem) => formatAmount(value, row.currency ?? 'CNY'),
}

/** 操作列：详情抽屉 */
const actionColumn: ActionColumnConfig = {
  label: '操作',
  width: 90,
  fixed: 'right',
  render: ({ row }: { row: LedgerEntryItem }) =>
    h(
      ElButton,
      { type: 'info', size: 'small', onClick: () => handleDetail(row) },
      { default: () => '详情' },
    ),
}

/** 分录详情抽屉 */
function handleDetail(row: LedgerEntryItem): void {
  MfwPopup.open({
    title: `分录详情 - ${row.entryNo}`,
    type: 'drawer',
    position: 'rtl',
    component: LedgerEntryDetail,
    elProps: { detail: row },
    popupProps: { size: 800 },
  })
}

/** 列表加载：accountId 必填校验（未填返回空） */
async function loadData(params: LoadParams): Promise<TableData> {
  if (!params.accountId) {
    return { list: [], total: 0 }
  }
  const res = await new ApiLedgerListEntries({
    query: {
      accountId: params.accountId as string,
      transferNo: (params.transferNo as string) || undefined,
      direction: params.direction !== undefined && params.direction !== null && params.direction !== '' ? Number(params.direction) : undefined,
      page: params.page,
      pageSize: params.pageSize,
    },
  })
  return { list: res?.items ?? [], total: res?.total ?? 0 }
}

/** 导出（强制近 31 天） */
async function handleExport(): Promise<void> {
  const accountId = listPageRef.value?.getSearchParams()?.accountId as string | undefined
  if (!accountId) {
    ElMessage.warning('导出必须指定账户ID')
    return
  }
  const end = new Date()
  const start = new Date(Date.now() - 31 * 24 * 3600 * 1000)
  try {
    const res = await new ApiLedgerExportEntries({
      query: {
        accountId,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      },
    })
    ElMessage.success(`导出 ${res?.total ?? 0} 条（近31天）`)
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
