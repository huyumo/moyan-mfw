<!--
/**
 * @fileoverview 延迟实例 Tab
 * @description 延迟实例列表、搜索筛选、详情查看、取消实例
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
import { ElTag, ElMessageBox } from 'element-plus'
import { Close, View, RefreshRight } from '@element-plus/icons-vue'
import {
  MfwListPage,
  MfwDateFormat,
  MfwPopup,
  renderActionButtons,
} from 'moyan-mfw-base/frontend'
import type { MfwListPageInstance, TableColumnConfig, ActionColumnConfig } from 'moyan-mfw-base/frontend'
import { TaskInstanceStatusDict } from 'moyan-mfw-extension-scheduler/shared'
import TaskInstanceDetail from './TaskInstanceDetail.vue'
import { ApiSchedulerListInstances, ApiSchedulerCancelInstance, ApiSchedulerRetryInstance } from '../../apis/scheduler'
import {
  instanceStatusTagType, instanceStatusLabel,
  taskTypeTagType, taskTypeLabel,
  triggerTypeLabel,
  renderCopyableText,
} from './shared'

defineOptions({ name: 'MfwTaskInstanceTab' })

const listPageRef = ref<MfwListPageInstance>()

const searchTemplate = [
  { key: 'taskCode', label: '任务编码', type: 'input' as const, testId: 'instance-search-code', placeholder: '请输入任务编码' },
  { key: 'status', label: '状态', type: 'select' as const, testId: 'instance-search-status', placeholder: '请选择状态', elProps: { options: [
    { label: '待执行', value: TaskInstanceStatusDict.PENDING },
    { label: '执行中', value: TaskInstanceStatusDict.RUNNING },
    { label: '已成功', value: TaskInstanceStatusDict.SUCCESS },
    { label: '已失败', value: TaskInstanceStatusDict.FAILED },
    { label: '已取消', value: TaskInstanceStatusDict.CANCELLED },
    { label: '已超时', value: TaskInstanceStatusDict.TIMEOUT },
  ] } },
  { key: 'startTime', label: '开始时间', type: 'date-picker' as const, testId: 'instance-search-start', placeholder: '请选择', elProps: { type: 'datetime', format: 'YYYY-MM-DD HH:mm:ss', valueFormat: 'YYYY-MM-DD HH:mm:ss' } },
  { key: 'endTime', label: '结束时间', type: 'date-picker' as const, testId: 'instance-search-end', placeholder: '请选择', elProps: { type: 'datetime', format: 'YYYY-MM-DD HH:mm:ss', valueFormat: 'YYYY-MM-DD HH:mm:ss' } },
]

const columns: TableColumnConfig[] = [
  { prop: 'id', label: '实例ID', minWidth: 340, render: ({ row }) => renderCopyableText(row.id) },
  { prop: 'taskName', label: '任务名称', minWidth: 200 },
  { prop: 'taskCode', label: '任务编码', minWidth: 180, render: ({ row }) => renderCopyableText(row.taskCode) },
  // {
  //   prop: 'taskType', label: '任务类型', width: 90, align: 'center' as const,
  //   render: ({ row }) => row.taskType
  //     ? h(ElTag, { type: taskTypeTagType[row.taskType] as any, size: 'small' }, () => taskTypeLabel[row.taskType] || '-')
  //     : '-',
  // },
  // {
  //   prop: 'triggerType', label: '触发方式', width: 80, align: 'center' as const,
  //   render: ({ row }) => row.triggerType
  //     ? h(ElTag, { type: row.triggerType === 2 ? 'primary' : 'info', size: 'small' }, () => triggerTypeLabel[row.triggerType] || '-')
  //     : '-',
  // },
  {
    prop: 'delayInfo', label: '执行方式', width: 90, align: 'center' as const,
    render: ({ row }) => {
      if (!row.createdAt || !row.executeAt) return '-'
      const delayMs = new Date(row.executeAt).getTime() - new Date(row.createdAt).getTime()
      if (delayMs <= 2000) return h(ElTag, { type: 'success', size: 'small' }, () => '立即')
      const sec = Math.round(delayMs / 1000)
      const text = sec < 60 ? `${sec}秒后` : sec < 3600 ? `${Math.round(sec / 60)}分钟后` : `${(sec / 3600).toFixed(1)}小时后`
      return h(ElTag, { type: 'warning', size: 'small' }, () => text)
    },
  },
  { prop: 'entityId', label: '实体ID', minWidth: 160, render: ({ row }) => renderCopyableText(row.entityId) },
  {
    prop: 'executeAt', label: '应执行时间', width: 170,
    render: ({ row }) => h(MfwDateFormat, { value: row.executeAt }),
  },
  {
    prop: 'status', label: '状态', width: 90, align: 'center' as const,
    render: ({ row }) => h(ElTag, { type: instanceStatusTagType[row.status] as any, size: 'small' }, () => instanceStatusLabel[row.status] || '-'),
  },
  { prop: 'retryCount', label: '重试', width: 60, align: 'center' as const },
]

const actionColumn: ActionColumnConfig = {
  label: '操作', width: 200, fixed: 'right' as const,
  render: ({ row }) => renderActionButtons([
    { label: '详情', type: 'primary', icon: View, onClick: handleView, testId: 'instance-detail-btn' },
    {
      label: '取消', type: 'danger', icon: Close, onClick: handleCancel, permission: ['编辑'], testId: 'instance-cancel-btn',
      visible: (row: any) => row.status === TaskInstanceStatusDict.PENDING,
    },
    {
      label: '重跑', type: 'warning', icon: RefreshRight, onClick: handleRetry, permission: ['执行'], testId: 'instance-retry-btn',
      visible: (row: any) => [TaskInstanceStatusDict.FAILED, TaskInstanceStatusDict.TIMEOUT, TaskInstanceStatusDict.TIMEOUT_ORPHAN].includes(row.status),
    },
  ], { maxVisible: 3 }, row),
}

const loadData = async (params: Record<string, unknown>) => {
  const result = await new ApiSchedulerListInstances({
    query: {
      page: params.page as number,
      pageSize: params.pageSize as number,
      taskCode: params.taskCode as string,
      status: params.status as number,
      startTime: params.startTime as string,
      endTime: params.endTime as string,
    },
  })
  return result as any
}

const handleView = (row: any) => {
  MfwPopup.open({
    title: '延迟实例详情',
    type: 'dialog',
    component: TaskInstanceDetail,
    elProps: { detail: row },
    popupProps: { width: 700 },
  })
}

const handleCancel = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定取消实例「${row.id}」吗？`, '确认取消', { type: 'warning' })
  } catch { return }
  await new ApiSchedulerCancelInstance({ params: { id: row.id } }, { hintSuccess: true } as any)
  listPageRef.value?.refresh()
}

const handleRetry = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定重跑实例「${row.id}」吗？\n将保留原始业务数据，重试次数 +1，立即重新执行。`,
      '确认重跑',
      { type: 'warning' },
    )
  } catch { return }
  await new ApiSchedulerRetryInstance({ params: { id: row.id } }, { hintSuccess: true } as any)
  listPageRef.value?.refresh()
}

/** 供父组件调用 */
function refresh() {
  listPageRef.value?.refresh()
}
defineExpose({ refresh })
</script>
