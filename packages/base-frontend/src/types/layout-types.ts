/**
 * @fileoverview 布局相关类型定义。
 */

import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { ThemeOption } from './layout-theme-types';

export type { ThemePack, ThemeRegistry, ThemeTokenInput, ThemeTokenPalette, ThemeTokens } from './layout-theme-types';

/** 布局模式定义。 */
export type LayoutMode = 'sidebar' | 'top' | 'dual';

/** 色彩模式定义。 */
export type ColorSchemeMode = 'light' | 'dark' | 'system';

/** 布局样式配置。 */
export interface LayoutStyleConfig {
  theme: string;
  layoutMode: LayoutMode;
  sidebarWidth: number;
  headerHeight: number;
  contentMaxWidth: number;
  compact: boolean;
  fixedHeader: boolean;
  showBreadcrumb: boolean;
  showTabs: boolean;
  colorScheme: ColorSchemeMode;
  isDark: boolean;
  darkSidebar: boolean;
  darkSidebarChildren: boolean;
  darkHeader: boolean;
  cardRadius: number;
}

/** 顶部导航项。 */
export interface TopNavItem {
  key: string;
  label: string;
  to?: RouteLocationRaw;
  href?: string;
}

/** 侧边菜单项。 */
export interface SideMenuItem {
  key: string;
  label: string;
  to?: RouteLocationRaw;
  icon?: string;
  badge?: string;
  order?: number;
  children?: SideMenuItem[];
}

/** 导航配置。 */
export interface AdminNavigationConfig {
  brandName: string;
  brandTagline: string;
  homePath: string;
  topNav: TopNavItem[];
  sideMenu: SideMenuItem[];
}

/** 标签页项。 */
export interface PageTabItem {
  key: string;
  title: string;
  path: string;
  fullPath: string;
  affix: boolean;
  closable: boolean;
}

/** 布局扩展组件。 */
export interface LayoutExtensionComponents {
  headerCommon?: Component;
  headerAvatar?: Component;
  headerUserMenu?: Component;
}

/** 异步扩展组件加载函数。 */
export type AsyncExtensionLoader = () => Promise<Component | { default: Component }>;

/** 异步扩展组件配置。 */
export interface AsyncExtensionComponent {
  loader: AsyncExtensionLoader;
  timeout?: number;
}

/** 扩展组件输入类型。 */
export type ExtensionComponentInput = Component | AsyncExtensionComponent;

/** 登录页扩展组件配置。 */
export interface LoginExtensionComponents {
  methods?: ExtensionComponentInput;
  aside?: ExtensionComponentInput;
  footer?: ExtensionComponentInput;
}

/** 主题选项类型。 */
export type { ThemeOption };
