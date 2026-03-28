/**
 * @fileoverview 前端应用入口文件。
 */

import { createBaseAdminApp } from 'moyan-mfw-base-frontend';
import { HeaderAvatarPanel, HeaderCommonActions } from './business/components/Layout';
import { businessThemes } from './business/themes';

// 创建并启动管理后台应用
const admin = createBaseAdminApp({
  title: '墨焱前端演示',
  themes: businessThemes,
  defaultTheme: 'sunset',
  layout: {
    layoutMode: 'dual',
    showTabs: true,
    isDark: false,
  },
  navigation: {
    brandName: '墨焱管理后台',
    brandTagline: '业务演示应用',
    homePath: '/dashboard',
  },
  layoutExtensions: {
    headerCommon: HeaderCommonActions,
    headerAvatar: HeaderAvatarPanel,
  },
});

admin.mount('#app');
