/**
 * @fileoverview 路由配置。
 */

import type { RouteRecordRaw } from 'vue-router';

const AdminLayout = () => import('../layouts/AdminLayout.vue');
const DashboardPage = () => import('../pages/DashboardPage.vue');
const ForbiddenPage = () => import('../pages/ForbiddenPage.vue');
const LoginPage = () => import('../pages/LoginPage.vue');
const NotFoundPage = () => import('../pages/NotFoundPage.vue');

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
      component: DashboardPage,
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
      component: LoginPage,
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
