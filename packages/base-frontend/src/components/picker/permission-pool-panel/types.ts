/**
 * @fileoverview MfwPermissionPoolPanel 权限池配置面板类型定义
 * @description 用于应用类型详情页的权限池配置
 */

import type { PermissionTreeNodeDto, PermissionTreePayloadDto } from '../../../apis/sys/schemas'

// ========== 权限位定义 ==========

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

/** 权限位类型 */
export type PermBitValue = typeof PermBit[keyof typeof PermBit]

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

// ========== Props 接口 ==========

/** MfwPermissionPoolPanel Props 接口 */
export interface MfwPermissionPoolPanelProps {
  /** 应用类型 ID */
  appTypeId: string
  /** 是否只读模式 */
  readonly?: boolean
  /** 是否隐藏底部按钮（用于弹窗模式，使用弹窗自身的按钮） */
  hideFooter?: boolean
}

// ========== Emits 接口 ==========

/** MfwPermissionPoolPanel Emits 接口 */
export interface MfwPermissionPoolPanelEmits {
  /** 保存成功事件 */
  (e: 'saved', data: { appTypeId: string; updatedCount: number }): void
  /** 加载成功事件 */
  (e: 'loaded', data: { pcTree: PermissionTreeNodeDto[]; normalTree: PermissionTreeNodeDto[] }): void
  /** 错误事件 */
  (e: 'error', error: Error): void
}

// ========== 内部状态类型 ==========

/** 权限池面板状态 */
export interface PermissionPoolPanelState {
  /** 加载中 */
  loading: boolean
  /** 保存中 */
  saving: boolean
  /** PC 权限树数据 */
  pcTree: PermissionTreeNodeDto[]
  /** 普通权限树数据 */
  normalTree: PermissionTreeNodeDto[]
  /** 当前选中的 Tab */
  activeTab: 'pc' | 'normal'
  /** 已勾选的权限 ID 集合 */
  checkedIds: Set<string>
  /** 权限值配置（permissionId -> permissionValue） */
  permissionValues: Map<string, bigint>
}

/** 权限树节点内部状态（含选中状态） */
export interface PermissionTreeNodeState extends Omit<PermissionTreeNodeDto, 'children'> {
  /** 是否勾选（加入权限池） */
  checked: boolean
  /** 权限值（位运算） */
  permissionValueBigInt?: bigint
  /** 子节点 */
  children?: PermissionTreeNodeState[]
}

// ========== 暴露实例接口 ==========

/** MfwPermissionPoolPanel 暴露实例接口 */
export interface MfwPermissionPoolPanelInstance {
  /** 加载权限池数据 */
  load: () => Promise<void>
  /** 保存权限池配置 */
  save: () => Promise<void>
  /** 重置为初始状态 */
  reset: () => void
  /** 获取当前配置数据 */
  getConfig: () => { pcTree: PermissionTreePayloadDto[]; normalTree: PermissionTreePayloadDto[] }
  /** 验证配置有效性 */
  validate: () => boolean
}