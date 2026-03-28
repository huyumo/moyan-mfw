/**
 * @fileoverview 业务路由配置 - 自动扫描模式。
 *
 * 框架使用 import.meta.glob 扫描 views 目录下的 index.{ts,tsx} 配置文件
 * 自动生成路由和菜单，无需手动配置路由表
 */

import type { RouteRecordRaw, Router } from 'vue-router';

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
 * 自动扫描 views 目录下所有 index.ts / index.tsx 配置文件
 */
const pageConfigs = import.meta.glob('../views/**/index.{ts,tsx}', {
  eager: true,
  import: 'default',
});

/**
 * 从扫描结果构建路由配置
 */
function buildRoutesFromConfigs(): RouteRecordRaw[] {
  const configMap = new Map<string, PageConfig>();

  // 1. 收集所有配置
  for (const [path, config] of Object.entries(pageConfigs)) {
    // 从路径提取相对路径
    const relativePath = path
      .replace('../views/', '')
      .replace('/index.ts', '')
      .replace('/index.tsx', '');

    configMap.set(relativePath, config as PageConfig);
  }

  // 2. 按层级组织路由
  const routeMap = new Map<string, RouteRecordRaw>();

  for (const [relativePath, config] of configMap.entries()) {
    const segments = relativePath.split('/').filter(Boolean);
    const fullPath = '/' + segments.join('/');

    // 创建路由
    const route: RouteRecordRaw = {
      path: segments[segments.length - 1] || '',
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

    routeMap.set(fullPath, route);
  }

  // 3. 构建树形结构
  const rootRoutes: RouteRecordRaw[] = [];

  for (const [fullPath, route] of routeMap.entries()) {
    const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/'));

    if (!parentPath) {
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
