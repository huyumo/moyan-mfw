<!--
/**
 * @fileoverview 任务执行日志详情
 * @description 展示日志结构化字段 + 结果 JSON + 错误信息/堆栈
 */
-->
<template>
  <el-descriptions :column="2" border>
    <el-descriptions-item label="任务编码">{{ detail.taskCode || '-' }}</el-descriptions-item>
    <el-descriptions-item label="任务名称">{{ detail.taskName || '-' }}</el-descriptions-item>
    <el-descriptions-item label="实例ID">{{ detail.instanceId || '-' }}</el-descriptions-item>
    <el-descriptions-item label="执行状态">
      <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="触发方式">{{ triggerTypeLabel }}</el-descriptions-item>
    <el-descriptions-item label="执行实例">{{ detail.executor || '-' }}</el-descriptions-item>
    <el-descriptions-item label="开始时间">{{ formatDate(detail.startedAt) }}</el-descriptions-item>
    <el-descriptions-item label="完成时间">{{ formatDate(detail.finishedAt) }}</el-descriptions-item>
    <el-descriptions-item label="耗时">{{ detail.durationMs ? detail.durationMs + ' ms' : '-' }}</el-descriptions-item>
    <el-descriptions-item label="结果摘要" :span="2">
      <pre v-if="detail.result" class="json-block">{{ JSON.stringify(detail.result, null, 2) }}</pre>
      <span v-else>-</span>
    </el-descriptions-item>
    <el-descriptions-item v-if="detail.errorMessage" label="错误信息" :span="2">
      <div class="error-text">{{ detail.errorMessage }}</div>
    </el-descriptions-item>
    <el-descriptions-item v-if="detail.errorStack" label="错误堆栈" :span="2">
      <pre class="error-block">{{ detail.errorStack }}</pre>
    </el-descriptions-item>
  </el-descriptions>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  TaskRunStatusDict,
  TaskTriggerTypeDict,
} from 'moyan-mfw-extension-scheduler/shared'

const props = defineProps<{
  detail: Record<string, any>
}>()
defineOptions({ name: 'MfwTaskLogDetail' })

const detail = computed(() => props.detail || {})

const statusTagType = computed(() => {
  const map: Record<number, string> = {
    [TaskRunStatusDict.RUNNING]: 'info',
    [TaskRunStatusDict.SUCCESS]: 'success',
    [TaskRunStatusDict.FAILED]: 'danger',
    [TaskRunStatusDict.TIMEOUT]: 'danger',
    [TaskRunStatusDict.SKIPPED]: 'info',
  }
  return (map[detail.value.status] || 'info') as any
})

const statusLabel = computed(() => {
  const map: Record<number, string> = {
    [TaskRunStatusDict.RUNNING]: '执行中',
    [TaskRunStatusDict.SUCCESS]: '成功',
    [TaskRunStatusDict.FAILED]: '失败',
    [TaskRunStatusDict.TIMEOUT]: '超时',
    [TaskRunStatusDict.SKIPPED]: '跳过',
  }
  return map[detail.value.status] || '-'
})

const triggerTypeLabel = computed(() => {
  const map: Record<number, string> = {
    [TaskTriggerTypeDict.AUTO]: '自动',
    [TaskTriggerTypeDict.MANUAL]: '手动',
  }
  return map[detail.value.triggerType] || '-'
})

const formatDate = (val: any) => {
  if (!val) return '-'
  const d = new Date(val)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN')
}
</script>

<style scoped>
.json-block {
  background: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  max-height: 200px;
  overflow: auto;
  margin: 0;
}
.error-text {
  color: var(--el-color-danger);
  font-size: 13px;
}
.error-block {
  background: var(--el-color-danger-light-9);
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 300px;
  overflow: auto;
  margin: 0;
  color: var(--el-color-danger);
}
</style>
