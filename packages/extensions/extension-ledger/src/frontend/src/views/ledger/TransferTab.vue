<!--
/**
 * @fileoverview 交易单 Tab
 * @description MfwListPage 列表 + renderActionButtons 操作列（审核/冲正/详情/重推/取消）
 *   弹窗：制单 MfwFormCard、审核 MfwFormCard、详情 drawer（info-grid）
 *   危险操作 ElMessageBox.confirm + try/catch 后 return
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="success" v-permission="{ value: ['添加'] }" test-id="ledger-transfer-create" @click="handleCreate">
        制单
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
      @search="handleSearch"
    />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { ElCascader, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { renderActionButtons } from 'moyan-mfw-base/frontend'
import { MfwPageWrapper, MfwListPage, MfwPopup } from 'moyan-mfw-base/frontend'
import type { SearchTemplateItem, TableColumnConfig, ActionColumnConfig, LoadParams, TableData, MfwListPageInstance } from 'moyan-mfw-base/frontend'
import {
  ApiLedgerListTransfers,
  ApiLedgerReverseTransfer,
  ApiLedgerRepostTransfer,
  ApiLedgerCancelTransfer,
  type LedgerTransferItem,
} from '../../apis/ledger'
import {
  formatAmount,
  auditStatusLabel,
  auditStatusTagType,
  postStatusLabel,
  postStatusTagType,
  holdTypeLabel,
  bizTypeExtMeta,
  getSearchOptionLoader,
  type SelectOptionItem,
} from './shared'
import LedgerTransferForm from '../../components/ledger-transfer-form/Index.vue'
import LedgerAuditForm from '../../components/ledger-audit-form/Index.vue'
import LedgerTransferDetail from '../../components/ledger-transfer-detail/Index.vue'

defineOptions({ name: 'MfwLedgerTransferTab' })

const listPageRef = ref<MfwListPageInstance>()

/** 当前选中的业务类型（驱动扩展搜索项/列动态切换） */
const selectedBizType = ref<string>()

/** 搜索提交回调：记录 bizType 用于动态渲染扩展字段 */
function handleSearch(formData: Record<string, any>): void {
  selectedBizType.value = (formData.bizType as string) || undefined
}

/** 基础搜索项 + 当前 bizType 的扩展搜索项（bizType 保留选中值，防 MfwSearchPanel 重置）
 * 扩展搜索项支持 input / select / cascader（静态 options 或动态 optionsSource 加载） */
const searchTemplate = computed<SearchTemplateItem[]>(() => {
  const meta = selectedBizType.value ? bizTypeExtMeta[selectedBizType.value] : undefined
  const extItems: SearchTemplateItem[] = (meta?.search ?? []).map((item) => {
    const dynamicOptions = dynamicOptionsMap.value[`${selectedBizType.value}:${item.key}`]
    const options =
      item.options ?? // 静态选项（服务端配置）
      (item.optionsSource ? dynamicOptions : undefined) // 动态选项（前端加载器，异步加载）
    if (item.type === 'select') {
      return {
        key: item.key,
        label: item.label,
        type: 'select' as const,
        placeholder: item.label,
        elProps: { clearable: true, options: options ?? [] },
        testId: `ledger-transfer-search-${item.key}`,
      }
    }
    if (item.type === 'cascader') {
      // 级联筛选（如省市区）：自定义组件 ElCascader，选项为树形
      return {
        key: item.key,
        label: item.label,
        type: 'custom' as const,
        component: ElCascader,
        elProps: {
          clearable: true,
          filterable: true,
          options: options ?? [],
          props: { checkStrictly: true }, // 允许选任意级（省/市/区均可作为筛选值）
        },
        testId: `ledger-transfer-search-${item.key}`,
      }
    }
    return {
      key: item.key,
      label: item.label,
      type: 'input' as const,
      placeholder: item.label,
      elProps: { clearable: true },
      testId: `ledger-transfer-search-${item.key}`,
    }
  })
  return [
    {
      key: 'postStatus',
      label: '入账状态',
      type: 'select' as const,
      placeholder: '全部状态',
      elProps: { clearable: true, options: Object.entries(postStatusLabel).map(([value, label]) => ({ value: Number(value), label })) },
      testId: 'ledger-transfer-search-status',
    },
    {
      key: 'bizType',
      label: '业务类型',
      type: 'select' as const,
      placeholder: '选择业务类型（切换显示扩展字段）',
      defaultValue: selectedBizType.value,
      elProps: {
        clearable: true,
        filterable: true,
        options: Object.entries(bizTypeExtMeta).map(([value, meta]) => ({ value, label: meta.label })),
      },
      testId: 'ledger-transfer-search-biz',
    },
    ...extItems,
  ]
})

/** 动态下拉选项缓存（key = bizType:字段key；选中 bizType 时异步加载） */
const dynamicOptionsMap = ref<Record<string, SelectOptionItem[]>>({})

/** 加载选中 bizType 的扩展 select/cascader 动态选项（optionsSource 未注册时告警） */
watch(
  () => selectedBizType.value,
  async (bizType) => {
    if (!bizType) return
    const meta = bizTypeExtMeta[bizType]
    for (const item of meta?.search ?? []) {
      if ((item.type !== 'select' && item.type !== 'cascader') || !item.optionsSource) continue
      const cacheKey = `${bizType}:${item.key}`
      if (dynamicOptionsMap.value[cacheKey]) continue // 已加载
      const loader = getSearchOptionLoader(item.optionsSource)
      if (!loader) {
        console.warn(`扩展筛选动态选项加载器未注册: ${item.optionsSource}（registerSearchOptionLoader）`)
        continue
      }
      try {
        const options = await loader()
        dynamicOptionsMap.value = { ...dynamicOptionsMap.value, [cacheKey]: options }
      } catch (err) {
        console.error(`扩展筛选动态选项加载失败: ${item.optionsSource}`, err)
      }
    }
  },
)

/** 基础列 + 当前 bizType 的扩展列（值取 row.extFields 语义对象，无值显示 '-'） */
const columns = computed<TableColumnConfig[]>(() => {
  const base: TableColumnConfig[] = [
    { prop: 'transferNo', label: '交易单号', width: 270, cp: true },
    { prop: 'bizRef', label: '业务幂等键', width: 200, cp: true },
    { prop: 'bizType', label: '业务类型', width: 120 },
    { prop: 'fromAccountId', label: '转出方', width: 300, cp: true },
    {
      prop: 'amount',
      label: '金额',
      width: 130,
      align: 'right',
      formatter: 'transferAmount',
    },
    {
      prop: 'auditStatus',
      label: '审核',
      width: 100,
      render: ({ row }) =>
        h(ElTag, { type: (auditStatusTagType[(row as LedgerTransferItem).auditStatus] as any) ?? 'info', size: 'small' }, () => auditStatusLabel[(row as LedgerTransferItem).auditStatus] ?? '-'),
    },
    {
      prop: 'postStatus',
      label: '入账状态',
      width: 110,
      render: ({ row }) =>
        h(ElTag, { type: (postStatusTagType[(row as LedgerTransferItem).postStatus] as any) ?? 'info', size: 'small' }, () => postStatusLabel[(row as LedgerTransferItem).postStatus] ?? '-'),
    },
    {
      prop: 'holdType',
      label: '占用',
      width: 100,
      formatter: 'holdType',
    },
    { prop: 'createdAt', label: '制单时间', minWidth: 170, formatter: 'dateTime' },
  ]
  // 扩展列：从 row.extFields 取语义值（后端把预留索引位翻译回字段名）
  const meta = selectedBizType.value ? bizTypeExtMeta[selectedBizType.value] : undefined
  const extColumns: TableColumnConfig[] = (meta?.columns ?? []).map((col) => ({
    prop: col.prop,
    label: col.label,
    width: col.width,
    cp: col.cp,
    render: ({ row }) => {
      const v = (row as LedgerTransferItem).extFields?.[col.prop]
      return v ?? '-'
    },
  }))
  return [...base, ...extColumns]
})

/** 命名格式化方法表（MfwListPage 注入，列配置 formatter 按名查找） */
const formatters = {
  transferAmount: (value: string, row: LedgerTransferItem) => `${formatAmount(value, row.currency)} ${row.currency}`,
  holdType: (value: number) => holdTypeLabel[value] ?? '-',
}

/** 操作列：renderActionButtons（permission 与 shared 权限标签一致）
 * 注意：ActionColumnConfig.render 参数是 scope（{ row, $index }），须解构取 row
 */
const actionColumn: ActionColumnConfig = {
  label: '操作',
  width: 300,
  fixed: 'right',
  render: ({ row }: { row: LedgerTransferItem }) =>
    renderActionButtons(
      [
        {
          label: '详情',
          type: 'info',
          onClick: () => handleDetail(row),
        },
        {
          label: '通过',
          type: 'success',
          visible: (r) => r.auditStatus === 1,
          onClick: () => handleAudit(row, 1),
        },
        {
          label: '驳回',
          type: 'danger',
          visible: (r) => r.auditStatus === 1,
          onClick: () => handleAudit(row, 2),
        },
        {
          label: '冲正',
          type: 'warning',
          permission: ['冲正'],
          visible: (r) => r.postStatus === 4 && !r.reversedFromTransferNo,
          onClick: () => handleReverse(row),
        },
        {
          label: '重推',
          type: 'primary',
          permission: ['审核'],
          visible: (r) => r.postStatus === 5,
          onClick: () => handleRepost(row),
        },
        {
          label: '取消',
          type: 'danger',
          permission: ['审核'],
          visible: (r) => r.postStatus === 5,
          onClick: () => handleCancel(row),
        },
      ],
      { maxVisible: 3 },
      row,
    ),
}

/** 列表加载：bizType + 扩展字段（extFields 组合成 JSON 传给后端，走预留索引位） */
async function loadData(params: LoadParams): Promise<TableData> {
  const bizType = (params.bizType as string) || undefined
  // 收集当前 bizType 的扩展搜索字段（非空才传）
  const meta = bizType ? bizTypeExtMeta[bizType] : undefined
  const extFields: Record<string, string> = {}
  for (const item of meta?.search ?? []) {
    const v = params[item.key]
    if (v === undefined || v === null || v === '') continue
    if (item.type === 'cascader' && Array.isArray(v)) {
      // 级联选中值为数组：按 valueMode 取值（last=末级 / join=斜杠连接）
      extFields[item.key] = item.valueMode === 'join' ? (v as any[]).join('/') : String(v[v.length - 1])
    } else {
      extFields[item.key] = String(v)
    }
  }
  const res = await new ApiLedgerListTransfers({
    query: {
      postStatus: params.postStatus !== undefined && params.postStatus !== null && params.postStatus !== '' ? String(params.postStatus) : undefined,
      bizType,
      extFields: Object.keys(extFields).length > 0 ? JSON.stringify(extFields) : undefined,
      page: params.page,
      pageSize: params.pageSize,
    },
  })
  return { list: res?.items ?? [], total: res?.total ?? 0 }
}

/** 制单弹窗 */
function handleCreate(): void {
  MfwPopup.open({
    title: '制单',
    type: 'dialog',
    component: LedgerTransferForm,
    popupProps: { width: 800 },
    on: { confirm: () => listPageRef.value?.refresh() },
  })
}

/** 审核弹窗（通过/驳回共用，传 action） */
function handleAudit(row: LedgerTransferItem, action: 1 | 2): void {
  MfwPopup.open({
    title: action === 1 ? `审核通过 - ${row.transferNo}` : `驳回 - ${row.transferNo}`,
    type: 'dialog',
    component: LedgerAuditForm,
    elProps: { transferNo: row.transferNo, action },
    popupProps: { width: 600 },
    on: { confirm: () => listPageRef.value?.refresh() },
  })
}

/** 详情抽屉 */
function handleDetail(row: LedgerTransferItem): void {
  MfwPopup.open({
    title: `交易单详情 - ${row.transferNo}`,
    type: 'drawer',
    position: 'rtl',
    component: LedgerTransferDetail,
    elProps: { detail: row },
    popupProps: { size: 800 },
  })
}

/** 冲正（危险操作：confirm + try/catch） */
async function handleReverse(row: LedgerTransferItem): Promise<void> {
  try {
    const { value } = await ElMessageBox.prompt(
      `冲正 ${row.transferNo}（金额 ${formatAmount(row.amount, row.currency)}）`,
      '冲正确认',
      {
        inputPlaceholder: '冲正单业务幂等键',
        inputValidator: (v: string) => (v ? true : '必填'),
      },
    )
    await new ApiLedgerReverseTransfer({ body: { originalTransferNo: row.transferNo, bizRef: value, bizType: 'reverse' } }, { hintSuccess: true } as any)
    listPageRef.value?.refresh()
  } catch {
    return // 用户取消或失败
  }
}

/** 重推 */
async function handleRepost(row: LedgerTransferItem): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认重推 ${row.transferNo} 入队？`, '重推确认', { type: 'warning' })
    await new ApiLedgerRepostTransfer({ params: { transferNo: row.transferNo } }, { hintSuccess: true } as any)
    listPageRef.value?.refresh()
  } catch {
    return
  }
}

/** 取消（回滚预占） */
async function handleCancel(row: LedgerTransferItem): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认取消 ${row.transferNo}？预占资金将回滚`, '取消确认', { type: 'warning' })
    await new ApiLedgerCancelTransfer({ params: { transferNo: row.transferNo } }, { hintSuccess: true } as any)
    listPageRef.value?.refresh()
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
