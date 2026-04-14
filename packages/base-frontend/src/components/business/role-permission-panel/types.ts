/**
 * @fileoverview RolePermissionPanel 组件类型定义
 */

import type { PermissionTreeNodeDto } from '../../../apis/sys/schemas'

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
  /** 是否隐藏底部按钮 */
  hideFooter?: boolean
}

/** RolePermissionPanel 暴露实例 */
export interface RolePermissionPanelInstance {
  /** 保存权限分配 */
  onConfirm: () => Promise<void>
}
