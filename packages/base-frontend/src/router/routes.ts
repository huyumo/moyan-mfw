/**
 * @fileoverview 路由配置。
 *
 * 路由页面加载规则：
 * 1. 页面组件必须存放在 src/views/ 目录下
 * 2. 每个页面是一个独立目录，目录内必须包含以下文件之一：
 *    - Index.vue (优先)
 *    - index.ts
 *    - index.tsx
 * 3. 如果路由配置了某个页面，但对应目录下没有找到上述文件，则自动重定向到 404 页面
 */

import type { RouteRecordRaw } from 'vue-router';

/**
 * 动态导入页面组件的辅助函数
 * @param dirName - views 下的目录名
 * @returns 组件加载函数，如果找不到文件则返回 404 页面
 */
export function importPage(dirName: string) {
  return () =>
    import(`../views/${dirName}/Index.vue`).catch(() =>
      import(`../views/${dirName}/index.ts`).catch(() =>
        import(`../views/${dirName}/index.tsx`).catch(() => import('../views/not-found/Index.vue'))
      )
    );
}

/**
 * 动态导入布局组件
 */
const AdminLayout = () => import('../layouts/AdminLayout.vue');

/**
 * 403 和 404 页面（直接使用静态导入）
 */
const ForbiddenPage = () => import('../views/forbidden/Index.vue');
const NotFoundPage = () => import('../views/not-found/Index.vue');

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
 * @param route 原始路由配置。
 * @returns 规范化后的路由配置。
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
 * @param children 基础子路由数组。
 * @param businessRoutes 业务路由数组。
 * @returns 合并后的路由数组。
 */
function mergeBusinessChildren(children: RouteRecordRaw[], businessRoutes: RouteRecordRaw[] = []): RouteRecordRaw[] {
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
      component: importPage('dashboard'),
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
      component: importPage('login'),
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
