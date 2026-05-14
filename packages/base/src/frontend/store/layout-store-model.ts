/**
 * @fileoverview 布局状态模型定义。
 */

import type {
  AdminNavigationConfig,
  LayoutExtensionComponents,
  LoginExtensionComponents,
  LayoutStyleConfig,
  PageTabItem,
} from '../types/layout-types';
import { LAYOUT_PREFERENCES_KEY, LAYOUT_TABS_KEY, LAYOUT_LEGACY_CONFIG_KEY } from '../constants/storage-keys';

export const LAYOUT_PREFERENCES_STORAGE_KEY = LAYOUT_PREFERENCES_KEY;
export const LAYOUT_TABS_STORAGE_KEY = LAYOUT_TABS_KEY;
export { LAYOUT_LEGACY_CONFIG_KEY };

export interface AppItem {
  id: string;
  name: string;
  appKey: string;
  description?: string;
  icon?: string;
  enabled?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 布局持久化状态。
 */
export interface LayoutPersistedState {
  /** 样式配置 */
  styleConfig?: Partial<LayoutStyleConfig>;
  /** 当前激活的顶部菜单键 */
  activeTopMenuKey?: string;
  /** 访问过的标签页 */
  visitedTabs?: PageTabItem[];
  /** 当前激活的标签页路径 */
  activeTabPath?: string;
}

/**
 * 布局状态。
 */
export interface LayoutState {
  /** 样式配置 */
  styleConfig: LayoutStyleConfig;
  /** 导航配置 */
  navigation: AdminNavigationConfig;
  /** 设置面板状态 */
  settingsPanelOpen: boolean;
  /** 当前激活顶部菜单键 */
  activeTopMenuKey: string;
  /** 访问过的标签页 */
  visitedTabs: PageTabItem[];
  /** 当前激活标签页 */
  activeTabPath: string;
  /** 布局扩展组件 */
  layoutExtensions: LayoutExtensionComponents;
  /** 登录扩展组件 */
  loginExtensions: LoginExtensionComponents;
  /** 当前应用 */
  currentApp: AppItem | null;
  /** 用户可访问应用列表 */
  userApps: AppItem[];
}

/**
 * 标签管理动作运行时上下文。
 */
export interface LayoutTabActionContext {
  /** 导航配置 */
  navigation: AdminNavigationConfig;
  /** 访问标签页 */
  visitedTabs: PageTabItem[];
  /** 当前激活标签页 */
  activeTabPath: string;
  /** 持久化方法 */
  persistPreferences: () => void;
}

/**
 * 偏好与布局动作运行时上下文。
 */
export interface LayoutPreferenceActionContext extends LayoutTabActionContext {
  /** 样式配置 */
  styleConfig: LayoutStyleConfig;
  /** 导航配置 */
  navigation: AdminNavigationConfig;
  /** 设置面板状态 */
  settingsPanelOpen: boolean;
  /** 当前激活顶部菜单键 */
  activeTopMenuKey: string;
  /** 布局扩展组件 */
  layoutExtensions: LayoutExtensionComponents;
  /** 登录扩展组件 */
  loginExtensions: LoginExtensionComponents;
  /** 当前应用 */
  currentApp: AppItem | null;
  /** 用户可访问应用列表 */
  userApps: AppItem[];
}
