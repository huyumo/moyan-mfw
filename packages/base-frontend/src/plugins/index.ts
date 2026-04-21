/**
 * @fileoverview 插件入口
 * @description 统一注册 Vue 插件
 */

import type { App } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { MoAxios } from './api';

/**
 * 安装所有插件
 */
export function setupPlugins(app: App) {
  app.use(ElementPlus, { locale: zhCn });

  app.use(MoAxios);
}

export { MoAxios } from './api';