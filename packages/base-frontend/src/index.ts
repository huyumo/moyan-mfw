/**
 * @fileoverview 管理后台应用主入口模块
 * 统一导出创建管理后台应用的相关函数、配置和类型定义。
 */

export * from './create-base-admin-app';
export * from './router';
export * from './layouts';
export * from './config/layout-defaults';
export * from './types/layout-types';

export type { PermissionName, DefaultPermissionName, ExtensionPermissionName } from './utils/permissions';
export { createBusinessPageConfigFn } from './utils/permissions';

export * from './components';
