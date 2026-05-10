/**
 * @fileoverview 前端应用入口文件。
 */

import { createBaseAdminApp } from 'moyan-mfw-base-frontend';
import { HeaderCommonActions } from './components/Layout';
import { businessRoutes } from './router';
import { adTypeRoutes, adPlacementRoutes } from 'moyan-extension-ad/frontend';

const admin = createBaseAdminApp({
  title: '墨焱前端演示',
  routes: [...businessRoutes, ...adTypeRoutes, ...adPlacementRoutes],
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
  },
});

admin.mount('#app');
