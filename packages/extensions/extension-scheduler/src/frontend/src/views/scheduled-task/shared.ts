/**
 * @fileoverview 定时任务管理 — 共享常量与工具函数
 * @description 供 TaskDefinitionTab / TaskInstanceTab / TaskLogTab 复用
 */

import { h } from 'vue'
import { ElIcon, ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import {
  TaskTypeDict,
  TaskInstanceStatusDict,
  TaskRunStatusDict,
  TaskTriggerTypeDict,
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

// ── 工具函数 ──

/** 复制文本到剪贴板（兼容非 HTTPS 环境） */
export function copyToClipboard(text: string): void {
  const label = text.length > 30 ? text.substring(0, 30) + '...' : text

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success(`已复制: ${label}`)
    }).catch(() => {
      fallbackCopy(text, label)
    })
  } else {
    fallbackCopy(text, label)
  }
}

function fallbackCopy(text: string, label: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    // 降级方案：非 HTTPS 环境下 navigator.clipboard 不可用
    // execCommand 虽已弃用，但在无 Clipboard API 的环境下仍为唯一可用手段
    document.execCommand('copy')
    ElMessage.success(`已复制: ${label}`)
  } catch {
    ElMessage.error('复制失败')
  }
  document.body.removeChild(textarea)
}

/** 渲染可复制文本（值 + 复制图标），不换行不裁剪 */
export function renderCopyableText(text: string | null | undefined) {
  if (!text) return '-'
  return h('span', {
    style: 'display: inline-flex; align-items: center; gap: 4px; cursor: pointer;',
    onClick: (e: Event) => { e.stopPropagation(); copyToClipboard(text) },
  }, [
    h('span', {
      style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
      title: text,
    }, text),
    h(ElIcon, {
      size: 14,
      style: 'color: var(--el-color-primary); flex-shrink: 0;',
      title: '点击复制',
    }, () => h(CopyDocument)),
  ])
}

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
