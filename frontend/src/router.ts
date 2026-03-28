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

/**
 * 模块配置接口
 */
export interface ModuleConfig {
  /** 类型：module 表示模块分组 */
  type?: 'module';
  /** 模块/菜单名称 */
  name: string;
  /** 菜单图标 */
  icon?: string;
  /** 菜单顺序 */
  order?: number;
}

/**
 * 页面配置接口
 */
export interface PageConfig {
  /** 页面组件 */
  page: unknown;
  /** 路由路径 */
  path: string;
  /** 页面/菜单名称 */
  name: string;
  /** 菜单图标 */
  icon?: string;
  /** 是否需要认证 */
  auth?: boolean;
  /** 菜单顺序 */
  order?: number;
  /** 菜单隐藏 */
  hidden?: boolean;
  /** 子页面配置 */
  children?: PageConfig[];
}

/**
 * 扫描所有配置文件（包括模块配置和页面配置）
 */
const allConfigs = import.meta.glob('./views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

/**
 * 判断是否为模块配置
 */
function isModuleConfig(config: unknown): config is ModuleConfig {
  return typeof config === 'object' && config !== null && (config as ModuleConfig).type === 'module';
}

/**
 * 判断是否为页面配置
 */
function isPageConfig(config: unknown): config is PageConfig {
  return typeof config === 'object' && config !== null && 'page' in config && 'path' in config && 'name' in config;
}

/**
 * 从扫描结果构建路由配置
 */
function buildRoutesFromConfigs(): RouteRecordRaw[] {
  // 1. 分离模块配置和页面配置
  const moduleMap = new Map<string, ModuleConfig>();
  const pageConfigs = new Map<string, PageConfig>();

  for (const [path, config] of Object.entries(allConfigs)) {
    // 从路径提取相对路径
    const relativePath = path
      .replace('./views/', '')
      .replace('/index.ts', '')
      .replace('/index.tsx', '');

    if (isModuleConfig(config)) {
      // 模块配置存储在模块目录（如 business/index.ts）
      moduleMap.set(relativePath, config);
    } else if (isPageConfig(config)) {
      // 页面配置存储在页面目录（如 business/orders/index.ts）
      // 跳过只有 1 层的路径（如 business/index.ts 不是页面配置）
      const segments = relativePath.split('/');
      if (segments.length >= 2) {
        pageConfigs.set(relativePath, config);
      }
    }
  }

  // 2. 按层级组织路由
  const routeMap = new Map<string, RouteRecordRaw>();

  for (const [relativePath, config] of pageConfigs.entries()) {
    const segments = relativePath.split('/').filter(Boolean);
    // 子路由路径不带前导/
    const path = segments.join('/');

    // 创建路由
    const route: RouteRecordRaw = {
      path: path,
      name: `Route_${segments.join('_')}` || 'Root',
      component: config.page as RouteRecordRaw['component'],
      meta: {
        title: config.name,
        menuLabel: config.name,
        menuIcon: config.icon,
        menuOrder: config.order ?? 50,
        requiresAuth: config.auth ?? true,
        hidden: config.hidden,
      },
    } as RouteRecordRaw;

    routeMap.set('/' + path, route);
  }

  // 3. 为有页面配置的模块创建模块路由（作为菜单分组）
  for (const [modulePath, moduleConfig] of moduleMap.entries()) {
    // 检查该模块下是否有页面
    const hasChildRoutes = Array.from(routeMap.keys()).some(key =>
      key.startsWith('/' + modulePath + '/')
    );

    if (hasChildRoutes) {
      // 创建模块分组路由（没有 component，仅作为菜单分组）
      const route: RouteRecordRaw = {
        path: modulePath,
        name: `Module_${modulePath}`,
        redirect: () => {
          // 找到该模块下的第一个子路由并跳转
          const firstChildRoute = Array.from(routeMap.entries())
            .find(([key]) => key.startsWith('/' + modulePath + '/'));
          if (firstChildRoute) {
            return firstChildRoute[0];
          }
          return '/404';
        },
        meta: {
          title: moduleConfig.name,
          menuLabel: moduleConfig.name,
          menuIcon: moduleConfig.icon,
          menuOrder: moduleConfig.order ?? 50,
          menu: true,
        },
      } as RouteRecordRaw;
      routeMap.set('/' + modulePath, route);
    }
  }

  // 4. 构建树形结构
  const rootRoutes: RouteRecordRaw[] = [];

  for (const [fullPath, route] of routeMap.entries()) {
    const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/'));

    if (!parentPath || parentPath === '/') {
      // 根级路由
      rootRoutes.push(route);
    } else {
      // 子路由，找到父路由并添加
      const parentRoute = routeMap.get(parentPath);
      if (parentRoute) {
        if (!parentRoute.children) {
          parentRoute.children = [];
        }
        parentRoute.children.push(route);

        // 如果父路由没有 component，设置为 redirect
        if (!parentRoute.component && !parentRoute.redirect) {
          parentRoute.redirect = fullPath;
        }
      } else {
        rootRoutes.push(route);
      }
    }
  }

  return rootRoutes;
}

/**
 * 创建业务路由配置
 */
export function createBusinessRoutes(): RouteRecordRaw[] {
  return buildRoutesFromConfigs();
}

/**
 * 业务路由配置（默认导出）
 */
export const businessRoutes: RouteRecordRaw[] = createBusinessRoutes();
