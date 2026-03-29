/**
 * @fileoverview 组件示例应用入口文件。
 */

import { createBaseAdminApp } from 'moyan-mfw-base-frontend';
import { businessThemes } from './themes';
import { businessRoutes } from './router';

// 创建并启动管理后台应用
const admin = createBaseAdminApp({
  title: 'Moyan MFW 组件示例',
  routes: businessRoutes,
  themes: businessThemes,
  defaultTheme: 'sunset',
  layout: {
    layoutMode: 'dual',
    showTabs: true,
    isDark: false,
  },
  navigation: {
    brandName: 'Moyan 管理后台',
    brandTagline: '组件示例应用',
    homePath: '/components-demo/page-scene',
  },
});

admin.mount('#app');
