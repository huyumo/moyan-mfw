/**
 * @fileoverview 布局相关类型定义。
 */

import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { ColorMode } from './color-mode-types';

/** 布局模式定义。 */
export type LayoutMode = 'sidebar' | 'top' | 'dual';

/** 布局样式配置。 */
export interface LayoutStyleConfig {
  layoutMode: LayoutMode;
  sidebarWidth: number;
  headerHeight: number;
  contentMaxWidth: number;
  compact: boolean;
  fixedHeader: boolean;
  showTabs: boolean;
  cardRadius: number;
  buttonRadius: number;
  colorMode: ColorMode;
  themePackage: string;
  searchTrigger: 'change' | 'submit';
  keepAlive: boolean;
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
  /** 侧边栏底部扩展组件（如路由同步按钮） */
  sidebarFooter?: Component;
}
