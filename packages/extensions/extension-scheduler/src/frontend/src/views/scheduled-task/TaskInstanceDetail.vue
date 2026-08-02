<!--
/**
 * @fileoverview 延迟实例详情
 * @description 展示延迟实例的全部字段，业务数据(payload)以 JSON 格式独占一行展示
 *   采用项目统一的 detail-section + info-grid 风格
 */
-->
<template>
  <div class="task-instance-detail" v-if="detail">
    <!-- 基本信息 -->
    <section class="detail-section">
      <h4 class="section-title">基本信息</h4>
      <div class="info-grid">
        <div class="info-row full">
          <span class="info-label">实例ID</span>
          <span class="info-value mono copyable" @click="copyText(detail.id)">{{ detail.id }}<el-icon class="copy-icon"><CopyDocument /></el-icon></span>
        </div>
        <div class="info-row">
          <span class="info-label">任务名称</span>
          <span class="info-value">{{ detail.taskName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">任务编码</span>
          <span class="info-value mono copyable" @click="copyText(detail.taskCode)">{{ detail.taskCode }}<el-icon class="copy-icon"><CopyDocument /></el-icon></span>
        </div>
        <div class="info-row full">
          <span class="info-label">实体ID</span>
          <span class="info-value mono copyable" @click="copyText(detail.entityId)">{{ detail.entityId || '-' }}<el-icon v-if="detail.entityId" class="copy-icon"><CopyDocument /></el-icon></span>
        </div>
        <div class="info-row">
          <span class="info-label">状态</span>
          <span class="info-value">
            <el-tag :type="statusTagType" size="small">{{ statusLabel }}</el-tag>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">重试次数</span>
          <span class="info-value">{{ detail.retryCount ?? 0 }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">应执行时间</span>
          <span class="info-value">{{ formatDate(detail.executeAt) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">开始时间</span>
          <span class="info-value">{{ formatDate(detail.startedAt) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">完成时间</span>
          <span class="info-value">{{ formatDate(detail.finishedAt) }}</span>
        </div>
        <div class="info-row" v-if="detail.executor">
          <span class="info-label">执行实例</span>
          <span class="info-value copyable" @click="copyText(detail.executor)" >
            {{ detail.executor || '-' }}
            <el-icon  class="copy-icon"><CopyDocument /></el-icon>
          </span>
        </div>
      </div>
    </section>

    <!-- 业务数据 -->
    <section class="detail-section" v-if="detail.payload">
      <h4 class="section-title">
        业务数据
        <el-icon class="copy-icon title-copy" @click="copyText(formatJson(detail.payload))"><CopyDocument /></el-icon>
      </h4>
      <pre class="json-block">{{ formatJson(detail.payload) }}</pre>
    </section>

    <!-- 错误信息 -->
    <section class="detail-section" v-if="detail.errorMessage">
      <h4 class="section-title">
        错误信息
        <el-icon class="copy-icon title-copy" @click="copyText(detail.errorMessage)"><CopyDocument /></el-icon>
      </h4>
      <div class="error-message">{{ detail.errorMessage }}</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import { TaskInstanceStatusDict } from 'moyan-mfw-extension-scheduler/shared'

const props = defineProps<{
  detail: Record<string, any>
}>()
defineOptions({ name: 'MfwTaskInstanceDetail' })

const detail = computed(() => props.detail || {})

function copyText(text: string | null | undefined): void {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(`已复制: ${text.length > 30 ? text.substring(0, 30) + '...' : text}`)
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const statusTagType = computed(() => {
  const map: Record<number, string> = {
    [TaskInstanceStatusDict.PENDING]: 'warning',
    [TaskInstanceStatusDict.RUNNING]: 'info',
    [TaskInstanceStatusDict.SUCCESS]: 'success',
    [TaskInstanceStatusDict.FAILED]: 'danger',
    [TaskInstanceStatusDict.CANCELLED]: 'info',
    [TaskInstanceStatusDict.TIMEOUT]: 'danger',
    [TaskInstanceStatusDict.TIMEOUT_ORPHAN]: 'danger',
  }
  return (map[detail.value.status] || 'info') as any
})

const statusLabel = computed(() => {
  const map: Record<number, string> = {
    [TaskInstanceStatusDict.PENDING]: '待执行',
    [TaskInstanceStatusDict.RUNNING]: '执行中',
    [TaskInstanceStatusDict.SUCCESS]: '已成功',
    [TaskInstanceStatusDict.FAILED]: '已失败',
    [TaskInstanceStatusDict.CANCELLED]: '已取消',
    [TaskInstanceStatusDict.TIMEOUT]: '已超时',
    [TaskInstanceStatusDict.TIMEOUT_ORPHAN]: '未归档',
  }
  return map[detail.value.status] || '-'
})

function formatDate(val: any): string {
  if (!val) return '-'
  const d = new Date(val)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN')
}

function formatJson(obj: Record<string, any>): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}
</script>

<style scoped lang="scss">
.task-instance-detail {
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
    display: inline-flex;
    align-items: center;
    gap: 4px;

    &:hover .copy-icon {
      color: var(--el-color-primary);
    }
  }
}

.copy-icon {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
  transition: color 0.2s;

  &.title-copy {
    margin-left: 8px;
    font-size: 16px;
  }
}

// ── JSON 块 ──
.json-block {
  background: #f5f7fa;
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
</style>
