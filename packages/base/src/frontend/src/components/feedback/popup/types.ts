/**
 * @fileoverview MfwPopup 弹窗组件类型定义
 * @description 提供命令式弹窗 API 的类型定义
 */

import type { Component, DefineComponent, Ref } from 'vue';
import type { DialogProps, DrawerProps } from 'element-plus';

/** 弹窗类型 */
export type PopupType = 'dialog' | 'drawer';

/** 弹窗位置 */
export type PopupPosition = 'ltr' | 'rtl' | 'ttb' | 'btt';

/** 页脚配置 */
export interface PopupFooter {
  /** 显示取消按钮 */
  showCancel?: boolean;
  /** 显示确认按钮 */
  showConfirm?: boolean;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 确认按钮加载状态 */
  confirmLoading?: boolean;
}

/** 弹窗事件监听器 */
export interface PopupListeners {
  /** 确认事件 */
  confirm?: (data: any) => void | Promise<void>;
  /** 关闭事件 */
  close?: (data: any) => void;
  /** 取消事件 */
  cancel?: () => void;
  /** 变化事件 */
  change?: (data: any) => void;
}

/** 弹窗内容组件 Props */
export interface PopupComponentProps<T = any> {
  /** 弹窗数据 */
  data?: T;
  /** 弹窗实例 */
  popupRef?: PopupInstance;
  /** 关闭弹窗 */
  close?: () => void;
  /** 确认弹窗 */
  confirm?: () => void;
}

/** 弹窗实例 */
export interface PopupInstance {
  /** 弹窗 UUID */
  uuid: string;
  /** 打开弹窗 */
  open: () => void;
  /** 关闭弹窗 */
  close: () => void;
  /** 确认弹窗 */
  confirm: () => void;
  /** 更新弹窗配置 */
  update: (options: Partial<OpenPopupOptions>) => void;
}

/** 打开弹窗选项 */
export interface OpenPopupOptions<T = any> {
  /** 弹窗唯一标识（用于缓存） */
  uuid?: string;
  /** 弹窗标题 */
  title?: string;
  /** 弹窗类型 */
  type?: PopupType;
  /** 弹窗内容组件 */
  component: Component | DefineComponent;
  /** 传递给内容组件的数据 */
  data?: T;
  /** 传递给内容组件的 provide */
  provides?: Record<string, any>;
  /** Dialog/Drawer 配置 */
  popupProps?: Partial<DialogProps | DrawerProps>;
  /** 页脚配置 */
  footer?: PopupFooter | boolean;
  /** 事件监听器 */
  on?: PopupListeners;
  /** 抽屉方向（仅 drawer 类型） */
  position?: PopupPosition;
  /** 是否缓存组件实例 */
  cache?: boolean;
}

/** 弹窗管理器实例 */
export interface PopupManagerInstance {
  /** 打开弹窗 */
  open: <T = any>(options: OpenPopupOptions<T>) => PopupInstance;
  /** 关闭弹窗 */
  close: (uuid: string) => void;
  /** 关闭所有弹窗 */
  closeAll: () => void;
  /** 弹窗列表 */
  popups: Ref<PopupItem[]>;
}

/** 弹窗项 */
export interface PopupItem {
  /** 弹窗 UUID */
  uuid: string;
  /** 弹窗标题 */
  title: string;
  /** 弹窗类型 */
  type: PopupType;
  /** 弹窗内容组件 */
  component: Component | DefineComponent;
  /** 传递给内容组件的数据 */
  data?: any;
  /** 传递给内容组件的 provide */
  provides?: Record<string, any>;
  /** Dialog/Drawer 配置 */
  popupProps: Partial<DialogProps | DrawerProps>;
  /** 页脚配置 */
  footer?: PopupFooter | boolean;
  /** 事件监听器 */
  on: PopupListeners;
  /** 是否打开 */
  visible: boolean;
  /** 是否缓存 */
  cache: boolean;
  /** 组件引用 */
  componentRef?: any;
}
