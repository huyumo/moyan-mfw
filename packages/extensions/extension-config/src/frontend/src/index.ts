/**
 * @fileoverview 配置管理前端入口
 * @description 导出组件和路由配置
 */

export * from './components/config-form-card/mod';
export { default as MfwConfigFormCard } from './components/config-form-card';

import { buildRoutesFromModuleTree } from 'moyan-mfw-base/frontend';
import configModuleConfig from './views/index';

export const configRoutes = buildRoutesFromModuleTree(configModuleConfig, 'config', {
  namespaceName: '配置管理',
});
