<!--
/**
 * @fileoverview 定时任务管理页面
 * @description 三视图：任务定义 / 延迟实例 / 执行日志
 */
-->
<template>
  <MfwPageWrapper>
    <el-tabs v-model="activeTab" class="scheduler-tabs">
      <!-- 任务定义 -->
      <el-tab-pane label="任务定义" name="tasks">
        <MfwListPage
          ref="taskListPage"
          :search-template="taskSearchTemplate"
          :columns="taskColumns"
          :action-column="taskActionColumn"
          :load-data="loadTasks"
          :show-search="true"
        />
      </el-tab-pane>

      <!-- 延迟实例 -->
      <el-tab-pane label="延迟实例" name="instances">
        <MfwListPage
          ref="instanceListPage"
          :search-template="instanceSearchTemplate"
          :columns="instanceColumns"
          :action-column="instanceActionColumn"
          :load-data="loadInstances"
          :show-search="true"
        />
      </el-tab-pane>

      <!-- 执行日志 -->
      <el-tab-pane label="执行日志" name="logs">
        <MfwListPage
          ref="logListPage"
          :search-template="logSearchTemplate"
          :columns="logColumns"
          :action-column="logActionColumn"
          :load-data="loadLogs"
          :show-search="true"
        />
      </el-tab-pane>
    </el-tabs>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { ElTag, ElSwitch, ElMessageBox } from 'element-plus'
import { Edit, VideoPlay, Close, View } from '@element-plus/icons-vue'
import {
  MfwPageWrapper,
  MfwListPage,
  MfwDateFormat,
  MfwPopup,
  renderActionButtons,
} from 'moyan-mfw-base/frontend'
import type { MfwListPageInstance, TableColumnConfig, ActionColumnConfig } from 'moyan-mfw-base/frontend'
import {
  TaskTypeDict,
  TaskInstanceStatusDict,
  TaskRunStatusDict,
  TaskTriggerTypeDict,
} from 'moyan-mfw-extension-scheduler/shared'
import TaskConfigForm from './TaskConfigForm.vue'
import TaskLogDetail from './TaskLogDetail.vue'
import {
  ApiSchedulerListTasks,
  ApiSchedulerTriggerTask,
  ApiSchedulerListInstances,
  ApiSchedulerCancelInstance,
  ApiSchedulerListLogs,
  ApiSchedulerGetLog,
  ApiSchedulerUpdateTask,
} from '../../apis/scheduler'

defineOptions({ name: 'MfwScheduledTaskPage' })

const activeTab = ref('tasks')
const taskListPage = ref<MfwListPageInstance>()
const instanceListPage = ref<MfwListPageInstance>()
const logListPage = ref<MfwListPageInstance>()

// ── 任务类型标签映射 ──
const taskTypeTagType: Record<number, string> = {
  [TaskTypeDict.CRON]: 'info',
  [TaskTypeDict.DELAY]: 'warning',
}
const taskTypeLabel: Record<number, string> = {
  [TaskTypeDict.CRON]: 'Cron定时',
  [TaskTypeDict.DELAY]: '延迟任务',
}

// ── 实例状态标签映射 ──
const instanceStatusTagType: Record<number, string> = {
  [TaskInstanceStatusDict.PENDING]: 'warning',
  [TaskInstanceStatusDict.RUNNING]: 'info',
  [TaskInstanceStatusDict.SUCCESS]: 'success',
  [TaskInstanceStatusDict.FAILED]: 'danger',
  [TaskInstanceStatusDict.CANCELLED]: 'info',
  [TaskInstanceStatusDict.TIMEOUT]: 'danger',
  [TaskInstanceStatusDict.TIMEOUT_ORPHAN]: 'danger',
}
const instanceStatusLabel: Record<number, string> = {
  [TaskInstanceStatusDict.PENDING]: '待执行',
  [TaskInstanceStatusDict.RUNNING]: '执行中',
  [TaskInstanceStatusDict.SUCCESS]: '已成功',
  [TaskInstanceStatusDict.FAILED]: '已失败',
  [TaskInstanceStatusDict.CANCELLED]: '已取消',
  [TaskInstanceStatusDict.TIMEOUT]: '已超时',
  [TaskInstanceStatusDict.TIMEOUT_ORPHAN]: '未归档',
}

// ── 执行状态标签映射 ──
const runStatusTagType: Record<number, string> = {
  [TaskRunStatusDict.RUNNING]: 'info',
  [TaskRunStatusDict.SUCCESS]: 'success',
  [TaskRunStatusDict.FAILED]: 'danger',
  [TaskRunStatusDict.TIMEOUT]: 'danger',
  [TaskRunStatusDict.SKIPPED]: 'info',
}
const runStatusLabel: Record<number, string> = {
  [TaskRunStatusDict.RUNNING]: '执行中',
  [TaskRunStatusDict.SUCCESS]: '成功',
  [TaskRunStatusDict.FAILED]: '失败',
  [TaskRunStatusDict.TIMEOUT]: '超时',
  [TaskRunStatusDict.SKIPPED]: '跳过',
}

// ── 触发方式标签映射 ──
const triggerTypeLabel: Record<number, string> = {
  [TaskTriggerTypeDict.AUTO]: '自动',
  [TaskTriggerTypeDict.MANUAL]: '手动',
}

// ═══════════════════════════════════════════════════
// 任务定义 Tab
// ═══════════════════════════════════════════════════

const taskSearchTemplate = [
  { key: 'taskName', label: '任务名称', type: 'input' as const, testId: 'task-search-name', placeholder: '请输入任务名称' },
  { key: 'taskType', label: '任务类型', type: 'select' as const, testId: 'task-search-type', placeholder: '请选择类型', elProps: { options: [
    { label: 'Cron定时', value: TaskTypeDict.CRON },
    { label: '延迟任务', value: TaskTypeDict.DELAY },
  ] } },
]

const taskColumns: TableColumnConfig[] = [
  { prop: 'taskName', label: '任务名称', minWidth: 120 },
  { prop: 'taskCode', label: '任务编码', minWidth: 140 },
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
    render: ({ row }) => row.lastRunStatus ? h(ElTag, { type: runStatusTagType[row.lastRunStatus] as any, size: 'small' }, () => runStatusLabel[row.lastRunStatus] || '-') : h(ElTag, { type: 'info', size: 'small' }, () => '未执行'),
  },
]

const taskActionColumn: ActionColumnConfig = {
  label: '操作', width: 160, fixed: 'right' as const,
  render: ({ row }) => renderActionButtons([
    { label: '配置', type: 'primary', icon: Edit, onClick: handleEditTask, permission: ['编辑'], testId: 'task-edit-btn' },
    { label: '执行', type: 'success', icon: VideoPlay, onClick: handleTriggerTask, permission: ['执行'], testId: 'task-trigger-btn' },
  ], { maxVisible: 2 }, row),
}

const loadTasks = async (_params: Record<string, unknown>) => {
  // 任务定义列表不分页，直接返回全部
  const result = await new ApiSchedulerListTasks({})
  return { list: (result as any).data ?? result, total: Array.isArray(result) ? result.length : 0 }
}

const handleEditTask = (row: any) => {
  MfwPopup.open({
    title: '配置任务',
    type: 'dialog',
    component: TaskConfigForm,
    elProps: { ...row },
    popupProps: { width: 600 },
    on: { confirm: () => taskListPage.value?.refresh() },
  })
}

const handleTriggerTask = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定手动触发任务「${row.taskName}」吗？`, '确认执行', { type: 'warning' })
  } catch { return }
  await new ApiSchedulerTriggerTask({ params: { taskCode: row.taskCode } }, { hintSuccess: true } as any)
  instanceListPage.value?.refresh()
}

// ═══════════════════════════════════════════════════
// 延迟实例 Tab
// ═══════════════════════════════════════════════════

const instanceSearchTemplate = [
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

const instanceColumns: TableColumnConfig[] = [
  { prop: 'taskCode', label: '任务编码', minWidth: 140 },
  { prop: 'entityId', label: '实体ID', minWidth: 120 },
  {
    prop: 'executeAt', label: '应执行时间', width: 180,
    render: ({ row }) => h(MfwDateFormat, { value: row.executeAt }),
  },
  {
    prop: 'status', label: '状态', width: 90, align: 'center' as const,
    render: ({ row }) => h(ElTag, { type: instanceStatusTagType[row.status] as any, size: 'small' }, () => instanceStatusLabel[row.status] || '-'),
  },
  { prop: 'retryCount', label: '重试', width: 60, align: 'center' as const },
  {
    prop: 'startedAt', label: '开始时间', width: 180,
    render: ({ row }) => row.startedAt ? h(MfwDateFormat, { value: row.startedAt }) : '-',
  },
  {
    prop: 'finishedAt', label: '完成时间', width: 180,
    render: ({ row }) => row.finishedAt ? h(MfwDateFormat, { value: row.finishedAt }) : '-',
  },
]

const instanceActionColumn: ActionColumnConfig = {
  label: '操作', width: 90, fixed: 'right' as const,
  render: ({ row }) => renderActionButtons([
    {
      label: '取消', type: 'danger', icon: Close, onClick: handleCancelInstance, permission: ['编辑'], testId: 'instance-cancel-btn',
      visible: (row: any) => row.status === TaskInstanceStatusDict.PENDING,
    },
  ], {}, row),
}

const loadInstances = async (params: Record<string, unknown>) => {
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

const handleCancelInstance = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定取消实例「${row.id}」吗？`, '确认取消', { type: 'warning' })
  } catch { return }
  await new ApiSchedulerCancelInstance({ params: { id: row.id } }, { hintSuccess: true } as any)
  instanceListPage.value?.refresh()
}

// ═══════════════════════════════════════════════════
// 执行日志 Tab
// ═══════════════════════════════════════════════════

const logSearchTemplate = [
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

const logColumns: TableColumnConfig[] = [
  { prop: 'taskName', label: '任务名称', minWidth: 120 },
  { prop: 'taskCode', label: '任务编码', minWidth: 140 },
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

const logActionColumn: ActionColumnConfig = {
  label: '操作', width: 80, fixed: 'right' as const,
  render: ({ row }) => renderActionButtons([
    { label: '详情', type: 'primary', icon: View, onClick: handleViewLogDetail, testId: 'log-detail-btn' },
  ], {}, row),
}

const loadLogs = async (params: Record<string, unknown>) => {
  const result = await new ApiSchedulerListLogs({
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

const handleViewLogDetail = async (row: any) => {
  const detail = await new ApiSchedulerGetLog({ params: { id: row.id } })
  MfwPopup.open({
    title: '日志详情',
    type: 'drawer',
    component: TaskLogDetail,
    elProps: (detail as any).data ?? detail,
    popupProps: { size: 700 },
  })
}
</script>

<style scoped>
.scheduler-tabs {
  height: 100%;
}
</style>
