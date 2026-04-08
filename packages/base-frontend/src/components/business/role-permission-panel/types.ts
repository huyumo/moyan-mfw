/**
 * @fileoverview RolePermissionPanel 组件类型定义
 * @description 角色权限分配面板的 Props 和类型定义
 */

import type { PermissionTreeNodeDto } from '../../../apis/sys/schemas'

/** RolePermissionPanel Props */
export interface RolePermissionPanelProps {
  /** 角色 ID */
  roleId: string
  /** 应用类型 ID（用于获取权限池） */
  appTypeId: string
}

/** 权限勾选状态 */
export interface PermissionCheckState {
  /** 权限 ID */
  permissionId: string
  /** 是否勾选 */
  checked: boolean
  /** permissionValue（位运算权限值） */
  permissionValue?: string
}

/** 权限树节点（带勾选状态） */
export interface PermissionTreeNodeWithState extends PermissionTreeNodeDto {
  /** 勾选状态 */
  checked: boolean
  /** 展开状态 */
  expanded: boolean
  /** permissionValue 勾选状态（各操作位的勾选） */
  permissionValueBits?: PermissionValueBitState[]
  /** 子节点 */
  children?: PermissionTreeNodeWithState[]
}

/** permissionValue 位运算状态 */
export interface PermissionValueBitState {
  /** 位值（如 1n, 2n, 4n） */
  bit: string
  /** 操作名称（如 ADD, EDIT, DELETE） */
  name: string
  /** 是否勾选 */
  checked: boolean
}

/** 权限操作常量 */
export const PERMISSION_OPERATIONS = {
  ADD: 1n,      // 添加
  EDIT: 2n,     // 编辑
  DELETE: 4n,   // 删除
  VIEW: 8n,     // 查看
  EXPORT: 16n,  // 导出
  IMPORT: 32n,  // 导入
  APPROVE: 64n, // 审批
  REJECT: 128n, // 拒绝
} as const

/** 操作名称映射 */
export const OPERATION_NAMES: Record<string, string> = {
  '1': '添加',
  '2': '编辑',
  '4': '删除',
  '8': '查看',
  '16': '导出',
  '32': '导入',
  '64': '审批',
  '128': '拒绝',
}

/** Tab 类型 */
export type PermissionTabType = 'pc' | 'normal'