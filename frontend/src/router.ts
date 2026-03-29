/**
 * @fileoverview 业务路由配置 - 复用 base-frontend 路由模块。
 *
 * 框架使用 import.meta.glob 扫描 views 目录下的 index.{ts,tsx} 配置文件
 * 自动生成路由和菜单，无需手动配置路由表
 *
 * 模块配置（可选）：在模块目录定义 index.ts，例如：
 *   views/business/index.ts: export default { type: 'module', name: '业务中心', icon: 'Briefcase', order: 10 }
 */

// 直接复用 base-frontend 的路由模块
export {
  createBaseAdminRouter,
  createBaseAdminRoutes,
  baseAdminRoutes,
  type PageConfig,
  type ModuleConfig,
  AUTH_TOKEN_STORAGE_KEY,
  type CreateBaseAdminRouterOptions,
} from 'moyan-mfw-base-frontend';
