<!--
/**
 * @fileoverview 账本管理 Tab
 * @description MfwListPage 列表（开户按钮在 header-extra + v-permission）；开户弹窗 MfwPopup + MfwFormCard
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="success" v-permission="{ value: ['添加'] }" test-id="ledger-account-open" @click="handleOpenAccount">
        开户
      </el-button>
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
import { ElButton } from 'element-plus'
import { MfwPageWrapper, MfwListPage, MfwPopup } from 'moyan-mfw-base/frontend'
import type { SearchTemplateItem, TableColumnConfig, ActionColumnConfig, LoadParams, TableData, MfwListPageInstance } from 'moyan-mfw-base/frontend'
import { ApiLedgerListAccounts, type LedgerAccountItem } from '../../apis/ledger'
import { formatAmount } from './shared'
import LedgerAccountForm from '../../components/ledger-account-form/Index.vue'
import LedgerAccountDetail from '../../components/ledger-account-detail/Index.vue'

defineOptions({ name: 'MfwLedgerAccountTab' })

const listPageRef = ref<MfwListPageInstance>()

const searchTemplate: SearchTemplateItem[] = [
  {
    key: 'holderId',
    label: '持有者ID',
    type: 'input' as const,
    placeholder: '持有者ID',
    elProps: { clearable: true },
    testId: 'ledger-account-search-holder',
  },
  {
    key: 'tag',
    label: '标签',
    type: 'input' as const,
    placeholder: '账户标签',
    elProps: { clearable: true },
    testId: 'ledger-account-search-tag',
  },
]

const columns: TableColumnConfig[] = [
  { prop: 'id', label: '账户ID', width: 300, cp: true },
  { prop: 'holderId', label: '持有者', width: 260, cp: true },
  { prop: 'tag', label: '标签', width: 100 },
  { prop: 'currency', label: '币种', width: 70 },
  {
    prop: 'balance',
    label: '可用余额',
    width: 130,
    align: 'right',
    formatter: 'formatAmount',
  },
  {
    prop: 'frozen',
    label: '审核冻结',
    width: 130,
    align: 'right',
    formatter: 'formatAmount',
  },
  {
    prop: 'pendingOut',
    label: '在途预占',
    width: 130,
    align: 'right',
    formatter: 'formatAmount',
  },
  {
    prop: 'totalIncome',
    label: '累计转入',
    width: 130,
    align: 'right',
    formatter: 'formatAmount',
  },
  {
    prop: 'totalOutcome',
    label: '累计转出',
    width: 130,
    align: 'right',
    formatter: 'formatAmount',
  },
  {
    prop: 'extra',
    label: '扩展字段',
    minWidth: 180,
    showOverflowTooltip: true,
    render: ({ row }) => h('span', {}, (row as LedgerAccountItem).extra ? JSON.stringify((row as LedgerAccountItem).extra) : '-'),
  },
]

/** 命名格式化方法表（MfwListPage 注入，列配置 formatter 按名查找；formatter 契约为 (value, row)） */
const formatters = {
  formatAmount: (value: string, row: LedgerAccountItem) => formatAmount(value, row.currency),
}

/** 操作列：账户详情抽屉 */
const actionColumn: ActionColumnConfig = {
  label: '操作',
  width: 90,
  fixed: 'right',
  render: ({ row }: { row: LedgerAccountItem }) =>
    h(
      ElButton,
      { type: 'info', size: 'small', onClick: () => handleDetail(row) },
      { default: () => '详情' },
    ),
}

/** 账户详情抽屉 */
function handleDetail(row: LedgerAccountItem): void {
  MfwPopup.open({
    title: `账户详情 - ${row.holderId}`,
    type: 'drawer',
    position: 'rtl',
    component: LedgerAccountDetail,
    elProps: { detail: row },
    popupProps: { size: 800 },
  })
}

/** 列表加载：MfwListPage 自动注入 page/pageSize */
async function loadData(params: LoadParams): Promise<TableData> {
  const res = await new ApiLedgerListAccounts({
    query: {
      holderId: (params.holderId as string) || undefined,
      tag: (params.tag as string) || undefined,
      page: params.page,
      pageSize: params.pageSize,
    },
  })
  return { list: res?.items ?? [], total: res?.total ?? 0 }
}

/** 开户弹窗（MfwPopup + 表单组件，确认后刷新列表） */
function handleOpenAccount(): void {
  MfwPopup.open({
    title: '开户',
    type: 'dialog',
    component: LedgerAccountForm,
    popupProps: { width: 700 },
    on: { confirm: () => listPageRef.value?.refresh() },
  })
}

/** Tab 切换刷新（父组件调用） */
async function refresh(): Promise<void> {
  await listPageRef.value?.refresh()
}

defineExpose({ refresh })
</script>
