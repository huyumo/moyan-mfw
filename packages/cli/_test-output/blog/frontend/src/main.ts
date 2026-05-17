/**
 * @fileoverview 扩展包前端自启动入口
 */
import 'moyan-mfw-base/frontend/styles/base-admin.scss';
import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend';
import { BlogRoutes } from './index';

const app = createExtensionFrontendApp({
  name: '博客管理',
  routes: BlogRoutes,
});

app.mount('#app');
