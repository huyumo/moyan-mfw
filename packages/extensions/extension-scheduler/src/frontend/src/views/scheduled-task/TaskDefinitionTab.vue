<!--
/**
 * @fileoverview 任务定义 Tab
 * @description 任务定义列表、搜索筛选、配置编辑、手动触发
 *   独立组件，自带 MfwPageWrapper（解决 provide/inject 冲突）
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
import { ElTag, ElSwitch, ElMessageBox } from 'element-plus'
import { Edit, VideoPlay } from '@element-plus/icons-vue'
import {
  MfwListPage,
  MfwDateFormat,
  MfwPopup,
  renderActionButtons,
} from 'moyan-mfw-base/frontend'
import type { MfwListPageInstance, TableColumnConfig, ActionColumnConfig } from 'moyan-mfw-base/frontend'
import { TaskTypeDict } from 'moyan-mfw-extension-scheduler/shared'
import TaskConfigForm from './TaskConfigForm.vue'
import { ApiSchedulerListTasks, ApiSchedulerTriggerTask, ApiSchedulerCreateInstance } from '../../apis/scheduler'
import {
  taskTypeTagType, taskTypeLabel,
  runStatusTagType, runStatusLabel,
  renderCopyableText,
} from './shared'

defineOptions({ name: 'MfwTaskDefinitionTab' })

const emit = defineEmits<{
  triggered: []
}>()

const listPageRef = ref<MfwListPageInstance>()

const searchTemplate = [
  { key: 'taskName', label: '任务名称', type: 'input' as const, testId: 'task-search-name', placeholder: '请输入任务名称' },
  { key: 'taskType', label: '任务类型', type: 'select' as const, testId: 'task-search-type', placeholder: '请选择类型', elProps: { options: [
    { label: 'Cron定时', value: TaskTypeDict.CRON },
    { label: '延迟任务', value: TaskTypeDict.DELAY },
  ] } },
]

const columns: TableColumnConfig[] = [
  { prop: 'id', label: '任务ID', minWidth: 340, render: ({ row }) => renderCopyableText(row.id) },
  { prop: 'taskName', label: '任务名称', minWidth: 220 },
  { prop: 'taskCode', label: '任务编码', minWidth: 200, render: ({ row }) => renderCopyableText(row.taskCode) },
  {
    prop: 'taskType', label: '类型', width: 100, align: 'center' as const,
    render: ({ row }) => h(ElTag, { type: taskTypeTagType[row.taskType] as any, size: 'small' }, () => taskTypeLabel[row.taskType] || '-'),
  },
  {
    prop: 'schedule', label: '调度方式', minWidth: 150,
    render: ({ row }) => row.cronExpression || (row.intervalSeconds ? `每${row.intervalSeconds}秒` : '-'),
  },
  {
    prop: 'enabled', label: '启用', width: 80, align: 'center' as const,
    render: ({ row }) => h(ElSwitch, { modelValue: row.enabled, size: 'small' }),
  },
  {
    prop: 'lastRunAt', label: '上次执行', width: 180,
    render: ({ row }) => row.lastRunAt ? h(MfwDateFormat, { value: row.lastRunAt }) : '-',
  },
  {
    prop: 'nextRunAt', label: '下次执行', width: 180,
    render: ({ row }) => row.nextRunAt ? h(MfwDateFormat, { value: row.nextRunAt }) : '-',
  },
  {
    prop: 'lastRunStatus', label: '状态', width: 80, align: 'center' as const,
    render: ({ row }) => row.lastRunStatus
      ? h(ElTag, { type: runStatusTagType[row.lastRunStatus] as any, size: 'small' }, () => runStatusLabel[row.lastRunStatus] || '-')
      : h(ElTag, { type: 'info', size: 'small' }, () => '未执行'),
  },
]

const actionColumn: ActionColumnConfig = {
  label: '操作', width: 160, fixed: 'right' as const,
  render: ({ row }) => renderActionButtons([
    { label: '配置', type: 'primary', icon: Edit, onClick: handleEdit, permission: ['编辑'], testId: 'task-edit-btn' },
    {
      label: '执行', type: 'success', icon: VideoPlay, onClick: handleTrigger, permission: ['执行'], testId: 'task-trigger-btn',
      visible: (row: any) => row.taskType === TaskTypeDict.CRON,
    },
    {
      label: '创建实例', type: 'warning', icon: VideoPlay, onClick: handleCreateInstance, permission: ['执行'], testId: 'task-create-instance-btn',
      visible: (row: any) => row.taskType === TaskTypeDict.DELAY,
    },
  ], { maxVisible: 2 }, row),
}

const loadData = async (params: Record<string, unknown>) => {
  const result = await new ApiSchedulerListTasks({
    query: {
      taskName: params.taskName as string,
      taskType: params.taskType as number,
    },
  })
  const list = Array.isArray(result) ? result : []
  return { list, total: list.length }
}

const handleEdit = (row: any) => {
  MfwPopup.open({
    title: '配置任务',
    type: 'dialog',
    component: TaskConfigForm,
    elProps: { ...row },
    popupProps: { width: 600 },
    on: { confirm: () => listPageRef.value?.refresh() },
  })
}

/** 手动执行：确认后直接触发（不建实例，结果见执行日志） */
const handleTrigger = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定立即执行任务「${row.taskName}」吗？\n执行不创建实例，结果可在「执行日志」中查看。`,
      '手动执行',
      { type: 'warning', confirmButtonText: '执行' },
    )
  } catch { return }
  await new ApiSchedulerTriggerTask({ params: { taskCode: row.taskCode } }, { hintSuccess: true } as any)
  emit('triggered')
}

/** 创建延迟实例：弹出 payload 输入框，立即执行（delaySeconds=0） */
const handleCreateInstance = async (row: any) => {
  let payloadStr = '{}'
  try {
    const { value } = await ElMessageBox.prompt(
      `任务「${row.taskName}」\n请输入业务数据（JSON 格式），将创建实例并立即执行：`,
      '创建延迟实例',
      {
        confirmButtonText: '创建并执行',
        inputType: 'textarea',
        inputValue: '{}',
        inputPlaceholder: '{"key": "value"}',
        inputValidator: (val: string) => {
          try { JSON.parse(val); return true } catch { return '请输入有效的 JSON' }
        },
      },
    )
    payloadStr = value
  } catch { return }
  await new ApiSchedulerCreateInstance({
    body: {
      taskCode: row.taskCode,
      delaySeconds: 0,
      payload: JSON.parse(payloadStr),
    },
  }, { hintSuccess: true } as any)
  emit('triggered')
}

/** 供父组件调用 */
function refresh() {
  listPageRef.value?.refresh()
}
defineExpose({ refresh })
</script>
