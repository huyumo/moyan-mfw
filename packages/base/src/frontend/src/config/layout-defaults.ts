/**
 * @fileoverview 默认布局配置。
 */

import type {
  AdminNavigationConfig,
  LayoutStyleConfig,
} from '../types/layout-types';

/** 默认布局样式配置。 */
export const defaultLayoutStyleConfig: LayoutStyleConfig = {
  layoutMode: 'sidebar',
  sidebarWidth: 236,
  headerHeight: 64,
  contentMaxWidth: 1360,
  compact: false,
  fixedHeader: true,
  showTabs: true,
  cardRadius: 8,
  buttonRadius: 6,
  colorMode: 'light',
  themePackage: 'tech',
  searchTrigger: 'change',
  keepAlive: true,
};

/** 默认导航配置。 */
export const defaultNavigationConfig: AdminNavigationConfig = {
  brandName: '墨研管理后台',
  brandTagline: '前端基础框架',
  homePath: '/dashboard',
  topNav: [],
  sideMenu: [
    { key: 'dashboard', label: '首页', to: '/dashboard', icon: 'DataBoard' },
    {
      key: 'exceptions',
      label: '异常页面',
      to: '/403',
      icon: 'WarningFilled',
      children: [
        { key: 'forbidden', label: '权限不足', to: '/403', icon: 'Lock' },
        { key: 'missing', label: '页面不存在', to: '/404', icon: 'CircleCloseFilled' },
      ],
    },
  ],
};