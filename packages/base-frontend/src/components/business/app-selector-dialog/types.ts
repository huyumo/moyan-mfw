/**
 * @fileoverview 应用实例选择器弹窗类型定义
 * @description 用于用户登录后选择应用实例
 */

import type { AppInstanceItemDto } from '../../../apis/sys/schemas'

/** 弹窗组件 Props */
export interface AppSelectorDialogProps {
  /** 是否显示弹窗 */
  visible: boolean
  /** 关闭回调 */
  onClose?: () => void
}

/** 应用选择器弹窗数据 */
export interface AppSelectorDialogData {
  /** 是否强制选择（不允许关闭） */
  forceSelect?: boolean
  /** 关闭回调 */
  onClose?: () => void
  /** 选择成功回调 */
  onSelect?: (app: AppInstanceItemDto) => void
}

/** 应用列表项渲染数据 */
export interface AppListItemRender {
  /** 应用实例数据 */
  app: AppInstanceItemDto
  /** 是否选中 */
  selected: boolean
  /** 是否禁用 */
  disabled: boolean
}