/**
 * @fileoverview 前端应用入口文件。
 */

import { createBaseAdminApp } from 'moyan-mfw-base-frontend';
import { HeaderAvatarPanel, HeaderCommonActions } from './components/Layout';
import { businessRoutes } from './router';

const admin = createBaseAdminApp({
  title: '墨焱前端演示',
  routes: businessRoutes,
  layout: {
    layoutMode: 'dual',
    showTabs: true,
    colorMode: 'system',
    themePackage: 'default',
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
