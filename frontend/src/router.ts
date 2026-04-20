/**
 * @fileoverview 业务路由配置 - 自动扫描模式。
 *
 * 框架使用 import.meta.glob 扫描 views 目录下的 index.{ts,tsx} 配置文件
 * 自动生成路由和菜单，无需手动配置路由表
 *
 * 模块配置（可选）：在模块目录定义 index.ts，例如：
 *   views/business/index.ts: export default { type: 'module', name: '业务中心', icon: 'Briefcase', order: 10 }
 */

import type { RouteRecordRaw } from 'vue-router';
import { buildRoutesFromConfigs } from 'moyan-mfw-base-frontend';

/**
 * 扫描所有配置文件（包括模块配置和页面配置）
 */
const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

/**
 * 创建业务路由配置
 */
export function createBusinessRoutes(): RouteRecordRaw[] {
  return buildRoutesFromConfigs(allConfigs, { minSegments: 1 });
}

/**
 * 业务路由配置（默认导出）
 */
export const businessRoutes: RouteRecordRaw[] = createBusinessRoutes();
