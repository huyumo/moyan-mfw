/**
 * @fileoverview Element Plus 组件实例类型定义
 * @description 补充 Element Plus 组件的实例类型
 */

import type { ComponentPublicInstance } from 'vue'

/** ElTree 组件实例类型 */
export interface ElTreeInstance extends ComponentPublicInstance {
  /** 设置勾选的节点 */
  setCheckedKeys: (keys: string[], leafOnly?: boolean) => void
  /** 获取勾选的节点 */
  getCheckedNodes: (leafOnly?: boolean, includeHalfChecked?: boolean) => any[]
  /** 获取勾选的节点 key */
  getCheckedKeys: (leafOnly?: boolean) => string[]
  /** 设置节点勾选状态 */
  setChecked: (key: string, checked: boolean, deep?: boolean) => void
  /** 获取当前勾选的节点 */
  getCurrentKey: () => string | null
  /** 设置当前节点 */
  setCurrentKey: (key: string | null) => void
  /** 获取节点 */
  getNode: (key: string) => any
  /** 更新节点 */
  updateKeyChildren: (key: string, data: any[]) => void
}