<!--
/**
 * @fileoverview 任务执行日志详情
 * @description 展示日志结构化字段 + 调用参数 + 执行结果 + 错误信息/堆栈
 *   采用项目统一的 detail-section + info-grid 风格，大数据量字段独占一行
 */
-->
<template>
  <div class="task-log-detail" v-if="detail">
    <!-- 基本信息 -->
    <section class="detail-section">
      <h4 class="section-title">基本信息</h4>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">任务名称</span>
          <span class="info-value">{{ detail.taskName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">任务编码</span>
          <span class="info-value mono copyable" @click="copyToClipboard(detail.taskCode)">{{ detail.taskCode }}</span>
        </div>
        <div class="info-row full">
          <span class="info-label">实例ID</span>
          <span class="info-value mono copyable" @click="copyToClipboard(detail.instanceId)">{{ detail.instanceId || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">执行状态</span>
          <span class="info-value">
            <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">触发方式</span>
          <span class="info-value">{{ triggerTypeLabel }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">执行实例</span>
          <span class="info-value copyable" @click="copyToClipboard(detail.instanceId)" >{{ detail.executor || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">耗时</span>
          <span class="info-value">{{ detail.durationMs != null ? detail.durationMs + ' ms' : '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">开始时间</span>
          <span class="info-value">{{ formatDate(detail.startedAt) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">完成时间</span>
          <span class="info-value">{{ formatDate(detail.finishedAt) }}</span>
        </div>
      </div>
    </section>

    <!-- 关联延迟实例信息 -->
    <section class="detail-section" v-if="detail.instanceData?.entityId || detail.instanceData?.retryCount !== undefined">
      <h4 class="section-title">实例信息</h4>
      <div class="info-grid">
        <div class="info-row full" v-if="detail.instanceData?.entityId">
          <span class="info-label">业务实体ID</span>
          <span class="info-value mono copyable" @click="copyToClipboard(detail.instanceData.entityId)">
            {{ detail.instanceData.entityId }}
            
          </span>
        </div>
        <div class="info-row" v-if="detail.instanceData?.retryCount !== undefined">
          <span class="info-label">重试次数</span>
          <span class="info-value">{{ detail.instanceData.retryCount }}</span>
        </div>
      </div>
    </section>

    <!-- 调用参数 -->
    <section class="detail-section" v-if="detail.instanceData?.payload">
      <h4 class="section-title">
        调用参数
      </h4>
      <pre class="json-block copyable-json" title="点击复制" @click="copyToClipboard(formatJson(detail.instanceData.payload))">{{ formatJson(detail.instanceData.payload) }}</pre>
    </section>

    <!-- 执行结果 -->
    <section class="detail-section" v-if="detail.result">
      <h4 class="section-title">
        执行结果
      </h4>
      <pre class="json-block copyable-json" title="点击复制" @click="copyToClipboard(formatJson(detail.result))">{{ formatJson(detail.result) }}</pre>
    </section>

    <!-- 错误信息 -->
    <section class="detail-section" v-if="detail.errorMessage">
      <h4 class="section-title">
        错误信息
      </h4>
      <div class="error-message">{{ detail.errorMessage }}</div>
    </section>

    <!-- 错误堆栈 -->
    <section class="detail-section" v-if="detail.errorStack">
      <h4 class="section-title">
        错误堆栈
      </h4>
      <pre class="json-block error-stack">{{ detail.errorStack }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  TaskRunStatusDict,
  TaskTriggerTypeDict,
} from 'moyan-mfw-extension-scheduler/shared'
import { copyToClipboard, formatDate, formatJson } from './shared'

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
</script>

<style scoped lang="scss">
.task-log-detail {
  padding: 4px 0;
}

// ── 区块通用样式 ──
.detail-section {
  margin-bottom: 16px;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 12px 0;
    padding-left: 8px;
    border-left: 3px solid var(--el-color-primary);
    line-height: 1;
    display: flex;
    align-items: center;
  }
}

// ── 信息网格 ──
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.info-row {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &.full {
    grid-column: 1 / -1;
  }
}

.info-label {
  width: 90px;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  padding-right: 12px;
  line-height: 1.4;
}

.info-value {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
  word-break: break-all;

  &.mono {
    font-family: 'Courier New', monospace;
  }

  &.copyable {
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

// ── JSON 块 ──
.json-block {
  background: #f5f7fa;
  cursor: pointer;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

// ── 错误信息 ──
.error-message {
  color: #f56c6c;
  font-size: 13px;
  line-height: 1.6;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  padding: 12px;
  word-break: break-all;
}

// ── 错误堆栈 ──
.error-stack {
  background: #fef0f0;
  border-color: #fde2e2;
  color: #f56c6c;
}
</style>

.copyable-json:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary) !important;
}
