/**
 * @fileoverview 路由配置。
 *
 * 路由页面加载规则：
 * 1. 页面组件必须存放在 src/views/ 目录下
 * 2. 每个页面是一个独立目录，目录内必须包含以下文件之一：
 *    - Index.vue (优先)
 *    - index.ts
 *    - index.tsx
 * 3. 如果路由配置了某个页面，但对应目录下没有找到上述文件，则自动显示 404 页面
 */

import type { RouteRecordRaw } from 'vue-router';

/**
 * 自动加载 views 目录下所有页面组件
 */
const viewModules = import.meta.glob(
  '../views/**/Index.{vue,ts,tsx}',
  { eager: false }
);

/**
 * 404 页面路径
 */
const NOT_FOUND_PATH = '../views/not-found/Index.vue';

/**
 * 获取页面组件的加载函数
 * @param dirName - views 下的目录名（如 '/dashboard', '/system/user-list'）
 * @returns 组件加载函数，找不到则返回 404 页面
 */
export function getViewComponent(dirName: string) {
  const basePath = `../views${dirName}/`;

  // 按优先级查找：Index.vue > index.ts > index.tsx
  const componentPath1 = `${basePath}Index.vue`;
  const componentPath2 = `${basePath}index.ts`;
  const componentPath3 = `${basePath}index.tsx`;

  if (viewModules[componentPath1]) {
    return viewModules[componentPath1];
  }
  if (viewModules[componentPath2]) {
    return viewModules[componentPath2];
  }
  if (viewModules[componentPath3]) {
    return viewModules[componentPath3];
  }

  // 找不到文件，返回 404 页面
  return () => import(NOT_FOUND_PATH);
}

/**
 * 动态导入布局组件
 */
const AdminLayout = () => import('../layouts/AdminLayout.vue');

/**
 * 403 和 404 页面（直接静态导入）
 */
const ForbiddenPage = () => import('../views/forbidden/Index.vue');
const NotFoundPage = () => import(NOT_FOUND_PATH);

/**
 * 创建基础管理后台路由的选项接口。
 */
export interface CreateBaseAdminRoutesOptions {
  /** 业务路由配置 */
  businessRoutes?: RouteRecordRaw[];
}

/**
 * 规范化业务路由。
 * 移除路径前的斜杠并设置默认需要认证。
 */
function normalizeBusinessRoute(route: RouteRecordRaw): RouteRecordRaw {
  const normalizedPath = route.path.replace(/^\/+/, '');
  return {
    ...route,
    path: normalizedPath,
    meta: {
      ...route.meta,
      requiresAuth: route.meta?.requiresAuth ?? true,
    },
  };
}

/**
 * 合并业务路由到基础子路由。
 */
function mergeBusinessChildren(
  children: RouteRecordRaw[],
  businessRoutes: RouteRecordRaw[] = []
): RouteRecordRaw[] {
  const merged = [...children];
  const existed = new Set(children.map((item) => item.path));

  for (const route of businessRoutes) {
    if (!route.path || existed.has(route.path.replace(/^\/+/, ''))) {
      continue;
    }
    const normalized = normalizeBusinessRoute(route);
    merged.push(normalized);
    existed.add(normalized.path);
  }

  return merged;
}

/**
 * 创建基础管理后台路由配置。
 * @param options 路由配置选项。
 * @returns 路由配置数组。
 */
export function createBaseAdminRoutes(options: CreateBaseAdminRoutesOptions = {}): RouteRecordRaw[] {
  const baseChildren: RouteRecordRaw[] = [
    {
      path: '',
      redirect: '/dashboard',
    },
    {
      path: 'dashboard',
      name: 'AdminDashboard',
      component: getViewComponent('/dashboard'),
      meta: {
        title: '首页',
        requiresAuth: true,
        menuLabel: '首页',
        menuIcon: 'DataBoard',
        menuOrder: 1,
        affix: true,
      },
    },
  ];

  return [
    {
      path: '/login',
      name: 'AdminLogin',
      component: getViewComponent('/login'),
      meta: {
        title: '登录',
        menu: false,
      },
    },
    {
      path: '/',
      component: AdminLayout,
      meta: {
        requiresAuth: true,
        menu: false,
      },
      children: mergeBusinessChildren(baseChildren, options.businessRoutes),
    },
    {
      path: '/403',
      name: 'AdminForbidden',
      component: ForbiddenPage,
      meta: {
        title: '权限不足',
        requiresAuth: true,
        menu: false,
      },
    },
    {
      path: '/404',
      name: 'AdminNotFound',
      component: NotFoundPage,
      meta: {
        title: '页面不存在',
        menu: false,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404',
    },
  ];
}

/**
 * 默认的基础管理后台路由配置。
 */
export const baseAdminRoutes: RouteRecordRaw[] = createBaseAdminRoutes();
