<!--
/**
 * @fileoverview 执行日志 Tab
 * @description 执行日志列表、搜索筛选、详情查看
 *   独立组件，自带 MfwPageWrapper
 */
-->
<template>
  <MfwListPage
    ref="listPageRef"
    :search-template="searchTemplate"
    :columns="columns"
    :action-column="actionColumn"
    :load-data="loadData"
    :show-search="true"
  />
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { ElTag } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import {
  MfwListPage,
  MfwDateFormat,
  MfwPopup,
  renderActionButtons,
} from 'moyan-mfw-base/frontend'
import type { MfwListPageInstance, TableColumnConfig, ActionColumnConfig } from 'moyan-mfw-base/frontend'
import { TaskRunStatusDict } from 'moyan-mfw-extension-scheduler/shared'
import TaskLogDetail from './TaskLogDetail.vue'
import { ApiSchedulerListLogs, ApiSchedulerGetLog } from '../../apis/scheduler'
import {
  runStatusTagType, runStatusLabel,
  triggerTypeLabel,
  renderCopyableText,
} from './shared'

defineOptions({ name: 'MfwTaskLogTab' })

const listPageRef = ref<MfwListPageInstance>()

const searchTemplate = [
  { key: 'instanceId', label: '实例ID', type: 'input' as const, testId: 'log-search-instance', placeholder: '请输入实例ID' },
  { key: 'taskCode', label: '任务编码', type: 'input' as const, testId: 'log-search-code', placeholder: '请输入任务编码' },
  { key: 'status', label: '状态', type: 'select' as const, testId: 'log-search-status', placeholder: '请选择状态', elProps: { options: [
    { label: '执行中', value: TaskRunStatusDict.RUNNING },
    { label: '成功', value: TaskRunStatusDict.SUCCESS },
    { label: '失败', value: TaskRunStatusDict.FAILED },
    { label: '超时', value: TaskRunStatusDict.TIMEOUT },
    { label: '跳过', value: TaskRunStatusDict.SKIPPED },
  ] } },
  { key: 'startTime', label: '开始时间', type: 'date-picker' as const, testId: 'log-search-start', placeholder: '请选择', elProps: { type: 'datetime', format: 'YYYY-MM-DD HH:mm:ss', valueFormat: 'YYYY-MM-DD HH:mm:ss' } },
  { key: 'endTime', label: '结束时间', type: 'date-picker' as const, testId: 'log-search-end', placeholder: '请选择', elProps: { type: 'datetime', format: 'YYYY-MM-DD HH:mm:ss', valueFormat: 'YYYY-MM-DD HH:mm:ss' } },
]

const columns: TableColumnConfig[] = [
  { prop: 'id', label: '日志ID', minWidth: 340, render: ({ row }) => renderCopyableText(row.id) },
  {
    prop: 'instanceId', label: '实例ID', minWidth: 340,
    render: ({ row }) => (row.instanceId ? renderCopyableText(row.instanceId) : '-'),
  },
  { prop: 'taskName', label: '任务名称', minWidth: 220 },
  { prop: 'taskCode', label: '任务编码', minWidth: 200, render: ({ row }) => renderCopyableText(row.taskCode) },
  {
    prop: 'triggerType', label: '触发方式', width: 80, align: 'center' as const,
    render: ({ row }) => triggerTypeLabel[row.triggerType] || '-',
  },
  {
    prop: 'status', label: '状态', width: 80, align: 'center' as const,
    render: ({ row }) => h(ElTag, { type: runStatusTagType[row.status] as any, size: 'small' }, () => runStatusLabel[row.status] || '-'),
  },
  {
    prop: 'startedAt', label: '开始时间', width: 180,
    render: ({ row }) => h(MfwDateFormat, { value: row.startedAt }),
  },
  { prop: 'durationMs', label: '耗时(ms)', width: 100, align: 'right' as const },
  {
    prop: 'errorMessage', label: '错误信息', minWidth: 200,
    render: ({ row }) => row.errorMessage ? h(ElTag, { type: 'danger', size: 'small' }, () => row.errorMessage.substring(0, 50)) : '-',
  },
]

const actionColumn: ActionColumnConfig = {
  label: '操作', width: 80, fixed: 'right' as const,
  render: ({ row }) => renderActionButtons([
    { label: '详情', type: 'primary', icon: View, onClick: handleView, testId: 'log-detail-btn' },
  ], {}, row),
}

const loadData = async (params: Record<string, unknown>) => {
  const result = await new ApiSchedulerListLogs({
    query: {
      page: params.page as number,
      pageSize: params.pageSize as number,
      instanceId: params.instanceId as string,
      taskCode: params.taskCode as string,
      status: params.status as number,
      startTime: params.startTime as string,
      endTime: params.endTime as string,
    },
  })
  return result as any
}

const handleView = async (row: any) => {
  const detail = await new ApiSchedulerGetLog({ params: { id: row.id } })
  const log = detail ? ((detail as any).data ?? detail) : null
  MfwPopup.open({
    title: '日志详情',
    type: 'dialog',
    component: TaskLogDetail,
    elProps: { detail: log ?? {} },
    popupProps: { width: 700 },
  })
}

/** 供父组件调用 */
function refresh() {
  listPageRef.value?.refresh()
}
defineExpose({ refresh })
</script>
