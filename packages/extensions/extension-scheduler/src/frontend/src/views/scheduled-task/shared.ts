/**
 * @fileoverview 定时任务管理 — 共享常量与工具函数
 * @description 供 TaskDefinitionTab / TaskInstanceTab / TaskLogTab 复用
 *   复制能力统一由 moyan-mfw-base/frontend 提供（copyToClipboard / renderCopyableText）
 */

import {
  TaskTypeDict,
  TaskInstanceStatusDict,
  TaskRunStatusDict,
  TaskTriggerTypeDict,
  CrashRecoveryStrategyDict,
} from 'moyan-mfw-extension-scheduler/shared'

// ── 任务类型 ──

export const taskTypeTagType: Record<number, string> = {
  [TaskTypeDict.CRON]: 'info',
  [TaskTypeDict.DELAY]: 'warning',
}

export const taskTypeLabel: Record<number, string> = {
  [TaskTypeDict.CRON]: 'Cron定时',
  [TaskTypeDict.DELAY]: '延迟任务',
}

// ── 实例状态 ──

export const instanceStatusTagType: Record<number, string> = {
  [TaskInstanceStatusDict.PENDING]: 'warning',
  [TaskInstanceStatusDict.RUNNING]: 'info',
  [TaskInstanceStatusDict.SUCCESS]: 'success',
  [TaskInstanceStatusDict.FAILED]: 'danger',
  [TaskInstanceStatusDict.CANCELLED]: 'info',
  [TaskInstanceStatusDict.TIMEOUT]: 'danger',
  [TaskInstanceStatusDict.TIMEOUT_ORPHAN]: 'danger',
}

export const instanceStatusLabel: Record<number, string> = {
  [TaskInstanceStatusDict.PENDING]: '待执行',
  [TaskInstanceStatusDict.RUNNING]: '执行中',
  [TaskInstanceStatusDict.SUCCESS]: '已成功',
  [TaskInstanceStatusDict.FAILED]: '已失败',
  [TaskInstanceStatusDict.CANCELLED]: '已取消',
  [TaskInstanceStatusDict.TIMEOUT]: '已超时',
  [TaskInstanceStatusDict.TIMEOUT_ORPHAN]: '未归档',
}

// ── 执行状态 ──

export const runStatusTagType: Record<number, string> = {
  [TaskRunStatusDict.RUNNING]: 'info',
  [TaskRunStatusDict.SUCCESS]: 'success',
  [TaskRunStatusDict.FAILED]: 'danger',
  [TaskRunStatusDict.TIMEOUT]: 'danger',
  [TaskRunStatusDict.SKIPPED]: 'info',
}

export const runStatusLabel: Record<number, string> = {
  [TaskRunStatusDict.RUNNING]: '执行中',
  [TaskRunStatusDict.SUCCESS]: '成功',
  [TaskRunStatusDict.FAILED]: '失败',
  [TaskRunStatusDict.TIMEOUT]: '超时',
  [TaskRunStatusDict.SKIPPED]: '跳过',
}

// ── 触发方式 ──

export const triggerTypeLabel: Record<number, string> = {
  [TaskTriggerTypeDict.AUTO]: '自动',
  [TaskTriggerTypeDict.MANUAL]: '手动',
}

// ── 崩溃恢复策略 ──

export const crashRecoveryTagType: Record<number, string> = {
  [CrashRecoveryStrategyDict.REQUEUE]: 'warning',
  [CrashRecoveryStrategyDict.MARK_FAILED]: 'danger',
  [CrashRecoveryStrategyDict.MARK_TIMEOUT_ORPHAN]: 'info',
}

export const crashRecoveryLabel: Record<number, string> = {
  [CrashRecoveryStrategyDict.REQUEUE]: '重新入队',
  [CrashRecoveryStrategyDict.MARK_FAILED]: '标记失败',
  [CrashRecoveryStrategyDict.MARK_TIMEOUT_ORPHAN]: '标记未归档',
}

// ── 复制工具（统一由 moyan-mfw-base/frontend 提供） ──
export { copyToClipboard, renderCopyableText } from 'moyan-mfw-base/frontend'

/** 格式化日期 */
export function formatDate(val: any): string {
  if (!val) return '-'
  const d = new Date(val)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN')
}

/** 格式化 JSON */
export function formatJson(obj: Record<string, any>): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}
