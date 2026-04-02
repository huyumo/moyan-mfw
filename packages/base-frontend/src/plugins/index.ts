/**
 * @fileoverview 插件入口
 * @description 统一注册 Vue 插件
 */

import type { App } from 'vue';
import ElementPlus from 'element-plus';
import { MoAxios } from './api';

/**
 * 安装所有插件
 */
export function setupPlugins(app: App) {
  // Element Plus
  app.use(ElementPlus);

  // moyan-api 适配器
  app.use(MoAxios);
}

export { MoAxios } from './api';