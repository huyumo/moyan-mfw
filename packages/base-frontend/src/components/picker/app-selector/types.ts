/**
 * @fileoverview MfwAppSelector 应用实例选择器类型定义
 * @description 用于用户登录后选择应用实例，支持搜索筛选
 */

import type { VNode } from 'vue';

// ========== 数据模型类型 ==========

/** 应用实例数据项 */
export interface AppInstanceItem {
  /** 应用实例 ID */
  appId: string;
  /** 应用实例名称 */
  appName: string;
  /** 应用实例编码 */
  appCode: string;
  /** 应用类型 ID */
  appTypeId: string;
  /** 应用类型编码 */
  appTypeCode: string;
  /** 应用类型名称 */
  appTypeName: string;
  /** 用户身份：拥有者/成员 */
  role: 'owner' | 'member';
  /** 应用图标 */
  icon?: string;
  /** 应用状态：1-启用，0-禁用 */
  appStatus?: number;
}

// ========== Props 接口 ==========

/** MfwAppSelector Props 接口 */
export interface MfwAppSelectorProps {
  /** 绑定值（选中的应用实例 ID） */
  modelValue?: string | AppInstanceItem;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位文本 */
  placeholder?: string;
  /** 应用列表数据（静态模式） */
  appList?: AppInstanceItem[];
  /** 应用列表数据加载函数（动态模式） */
  loadAppList?: (params: { keyword?: string }) => Promise<AppInstanceItem[]>;
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 是否可清空 */
  clearable?: boolean;
  /** 是否支持搜索 */
  searchable?: boolean;
  /** 搜索防抖时间（ms） */
  debounce?: number;
  /** 空数据提示文本 */
  emptyText?: string;
  /** 加载中提示文本 */
  loadingText?: string;
  /** 是否显示角色标识 */
  showRoleTag?: boolean;
  /** 是否显示应用类型 */
  showAppType?: boolean;
}

// ========== Emits 接口 ==========

/** MfwAppSelector Emits 接口 */
export interface MfwAppSelectorEmits {
  /** 值变化事件 */
  (e: 'update:modelValue', value: string | AppInstanceItem | undefined): void;
  /** 选择变化事件 */
  (e: 'change', value: AppInstanceItem | undefined, oldValue: AppInstanceItem | undefined): void;
  /** 清除事件 */
  (e: 'clear'): void;
  /** 搜索事件 */
  (e: 'search', keyword: string): void;
}

// ========== Slots 接口 ==========

/** MfwAppSelector Slots 接口 */
export interface MfwAppSelectorSlots {
  /** 自定义应用列表项 */
  item?: (props: { app: AppInstanceItem; selected: boolean }) => VNode[];
  /** 空数据 */
  empty?: () => VNode[];
  /** 前缀内容 */
  prefix?: () => VNode[];
}

// ========== 暴露实例接口 ==========

/** MfwAppSelector 暴露实例接口 */
export interface MfwAppSelectorInstance {
  /** 获取选中的应用实例 */
  getSelected: () => AppInstanceItem | undefined;
  /** 设置选中应用实例 */
  setSelected: (app: AppInstanceItem) => void;
  /** 清空选择 */
  clear: () => void;
  /** 刷新应用列表 */
  refresh: () => Promise<void>;
}

// ========== 内部状态类型 ==========

/** 应用选择器状态 */
export interface AppSelectorState {
  /** 是否显示下拉面板 */
  visible: boolean;
  /** 搜索关键词 */
  keyword: string;
  /** 应用列表数据 */
  appList: AppInstanceItem[];
  /** 加载中 */
  loading: boolean;
  /** 当前选中应用 */
  currentApp: AppInstanceItem | null;
}