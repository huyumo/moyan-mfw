/**
 * @fileoverview 剪贴板复制工具
 * @description 统一提供复制文本与可复制文本渲染能力
 *
 * 设计要点：
 *   - copyToClipboard：优先 Clipboard API，非 HTTPS/不可用时降级 execCommand（textarea 方案）
 *   - renderCopyableText：渲染「点击即复制」文本（不渲染图标，避免占用列表列宽）；
 *     带省略号 + 悬浮 title，hover 变色提示可复制
 */

import { h, type VNode } from 'vue'
import { ElMessage } from 'element-plus'

/** 复制文本到剪贴板（兼容非 HTTPS 环境：Clipboard API 不可用时降级 execCommand） */
export function copyToClipboard(text: string): void {
  const label = text.length > 30 ? `${text.substring(0, 30)}...` : text
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

/** 降级复制（非 HTTPS / 无 Clipboard API） */
function fallbackCopy(text: string, label: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    ElMessage.success(`已复制: ${label}`)
  } catch {
    ElMessage.error('复制失败')
  }
  document.body.removeChild(textarea)
}

/**
 * 渲染可复制文本（点击即复制，不显示图标）
 * @param text 文本内容；空值（null/undefined/空串）返回 '-'
 * @returns VNode 或 '-' 字符串
 *
 * @example
 * ```ts
 * // 列表列配置（推荐：cp: true 自动渲染，无需手写 render）
 * { prop: 'id', label: 'ID', width: 300, cp: true }
 *
 * // 或手动调用
 * { prop: 'id', label: 'ID', render: ({ row }) => renderCopyableText(row.id) }
 * ```
 */
export function renderCopyableText(text: string | number | null | undefined): VNode | string {
  if (text === null || text === undefined || text === '') return '-'
  const value = String(text)
  return h('span', {
    class: 'mfw-copyable-text',
    title: '点击复制',
    onClick: (e: Event) => { e.stopPropagation(); copyToClipboard(value) },
  }, value)
}
