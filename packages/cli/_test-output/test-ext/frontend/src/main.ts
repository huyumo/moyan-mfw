/**
 * @fileoverview 扩展包前端自启动入口
 */
import 'moyan-mfw-base/frontend/styles/base-admin.scss';
import { createExtensionFrontendApp } from 'moyan-mfw-base/frontend';
import { TestExtRoutes } from './index';

const app = createExtensionFrontendApp({
  name: '测试扩展',
  routes: TestExtRoutes,
});

app.mount('#app');
