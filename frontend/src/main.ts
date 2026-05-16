/**
 * @fileoverview 前端应用入口文件。
 */

import { createBaseAdminApp, registerPermissionValues } from 'moyan-mfw-base/frontend';
import { HeaderCommonActions } from './components/Layout';
import { businessRoutes } from './router';
import { adRoutes } from 'moyan-mfw-extension-ad/frontend';
import { AD_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ad/shared';
import './permissions'

registerPermissionValues([...AD_EXTENSION_PERMISSION_VALUES]);

const admin = createBaseAdminApp({
  title: '墨焱前端演示',
  routes: [...businessRoutes, ...adRoutes],
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

const values = await admin.fetchPermissionValues();
admin.initPermissionCache(values);

await admin.mount('#app');
