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
  showBreadcrumb: true,
  showTabs: true,
  cardRadius: 8,
  buttonRadius: 6,
  colorMode: 'system',
  themePackage: 'default',
};

/** 默认导航配置。 */
export const defaultNavigationConfig: AdminNavigationConfig = {
  brandName: '墨研管理后台',
  brandTagline: '前端基础框架',
  homePath: '/dashboard',
  topNav: [
    { key: 'guide', label: '接入指导', href: 'https://www.vben.pro/#/analytics' },
    { key: 'docs', label: '布局示例', to: '/dashboard' },
  ],
  sideMenu: [
    { key: 'dashboard', label: '首页', to: '/dashboard', icon: 'DataBoard', order: 1 },
    {
      key: 'exceptions',
      label: '异常页面',
      to: '/403',
      icon: 'WarningFilled',
      order: 90,
      children: [
        { key: 'forbidden', label: '权限不足', to: '/403', icon: 'Lock', order: 1 },
        { key: 'missing', label: '页面不存在', to: '/404', icon: 'CircleCloseFilled', order: 2 },
      ],
    },
  ],
};