/**
 * @fileoverview RolePermissionPanel 组件类型定义
 */

import type { PermissionTreeNodeDto } from '../../../apis/sys/schemas'

/** Tab 类型 */
export type PermissionTabType = 'pc' | 'normal'

/** 权限树节点（带勾选状态和 permissionValue） */
export interface PermissionTreeNodeWithState extends PermissionTreeNodeDto {
  /** 是否勾选 */
  checked: boolean
  /** 展开状态 */
  expanded: boolean
  /** 权限值（位运算） */
  permissionValue?: string
  /** 子节点 */
  children?: PermissionTreeNodeWithState[]
}

/** RolePermissionPanel Props */
export interface RolePermissionPanelProps {
  /** 角色 ID */
  roleId?: string
  /** 应用类型 ID（用于获取权限池） */
  appTypeId?: string
  /** 弹窗模式数据 */
  data?: {
    roleId: string
    appTypeId: string
  }
}

/** RolePermissionPanel 暴露实例 */
export interface RolePermissionPanelInstance {
  /** 保存权限分配 */
  onConfirm: () => Promise<void>
}

/** 全局权限位常量（位运算） */
export const PermBit = {
  ADD: 1n,      // 2^0 = 新增
  EDIT: 2n,     // 2^1 = 编辑
  DELETE: 4n,   // 2^2 = 删除
  EXPORT: 8n,   // 2^3 = 导出
  IMPORT: 16n,  // 2^4 = 导入
  VIEW: 32n,    // 2^5 = 查看
  APPROVE: 64n, // 2^6 = 审批
  REJECT: 128n, // 2^7 = 拒绝
} as const

/** 权限位描述映射 */
export const PermBitDesc: Record<string, string> = {
  '1': '新增',
  '2': '编辑',
  '4': '删除',
  '8': '导出',
  '16': '导入',
  '32': '查看',
  '64': '审批',
  '128': '拒绝',
}
