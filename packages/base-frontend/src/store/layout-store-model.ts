/**
 * @fileoverview 布局状态模型定义。
 */

import type {
  AdminNavigationConfig,
  LayoutExtensionComponents,
  LoginExtensionComponents,
  LayoutStyleConfig,
  PageTabItem,
  ThemeRegistry,
} from '../types/layout-types';

/**
 * 应用项类型定义。
 * TODO: 重新设计 API 类型系统
 */
export interface AppItem {
  /** 应用 ID */
  id: string;
  /** 应用名称 */
  name: string;
  /** 应用标识 */
  appKey: string;
  /** 应用描述 */
  description?: string;
  /** 应用图标 */
  icon?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 排序 */
  order?: number;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * 布局偏好设置本地存储键名。
 */
export const LAYOUT_PREFERENCES_STORAGE_KEY = 'mfw:base-frontend:layout-preferences';

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
  /** 主题注册表 */
  themes: ThemeRegistry;
  /** 主题切换开关 */
  enableThemeSwitch: boolean;
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
  /** 主题注册表 */
  themes: ThemeRegistry;
  /** 主题切换开关 */
  enableThemeSwitch: boolean;
  /** 当前激活顶部菜单键 */
  activeTopMenuKey: string;
  /** 布局扩展组件 */
  layoutExtensions: LayoutExtensionComponents;
  /** 登录扩展组件 */
  loginExtensions: LoginExtensionComponents;
  /** 当前激活主题键 */
  activeThemeKey: string;
  /** 当前应用 */
  currentApp: AppItem | null;
  /** 用户可访问应用列表 */
  userApps: AppItem[];
}
