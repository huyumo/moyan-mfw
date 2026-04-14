/**
 * @fileoverview 基础前端路由创建与鉴权守卫模块。
 */

import { createRouter, createWebHistory, type RouteRecordRaw, type Router, type RouterHistory } from 'vue-router';
import { buildBasePackageRoutes } from './routes';
import { setupRouteGuard } from './guard';

/**
 * 本地存储中的认证令牌键名。
 */
export const AUTH_TOKEN_STORAGE_KEY = 'mfw:admin:token';

/**
 * 路由创建参数。
 */
export interface CreateBaseAdminRouterOptions {
  /** 路由历史实现 */
  history?: RouterHistory;
  /** 路由基础路径 */
  base?: string;
  /** 完整路由配置 */
  routes?: RouteRecordRaw[];
  /** 页面标题后缀 */
  title?: string;
}

/**
 * 从本地存储读取认证令牌。
 * @returns 认证令牌字符串；不存在时返回空字符串。
 */
function readAuthToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
}

/**
 * 解析页面标题。
 * @param toTitle 路由元信息中的标题值。
 * @param title 应用默认标题。
 * @returns 完整页面标题。
 */
function resolvePageTitle(toTitle: unknown, title: string): string {
  if (typeof toTitle === 'string' && toTitle.trim().length > 0) {
    return `${toTitle} | ${title}`;
  }
  return title;
}

/**
 * 创建后台路由实例并注册全局守卫。
 * @param options 路由创建参数。
 * @returns 可直接挂载到应用的路由实例。
 */
export function createBaseAdminRouter(options: CreateBaseAdminRouterOptions = {}): Router {
  // 始终获取基包自己的路由（sys 模块等）
  const basePackageRoutes = buildBasePackageRoutes();

  // 合并基包路由和业务路由
  const businessRoutes = options.routes || [];
  const allChildren = [...basePackageRoutes, ...businessRoutes];

  const finalRoutes = [
    {
      path: '/login',
      name: 'AdminLogin',
      component: () => import('../views/login/Index.vue'),
      meta: {
        title: '登录',
        menu: false,
      },
    },
    {
      path: '/install',
      name: 'InstallWizard',
      component: () => import('../views/install/InstallWizard.vue'),
      meta: {
        title: '系统初始化',
        menu: false,
        requiresAuth: false,
      },
    },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      meta: {
        requiresAuth: true,
        menu: false,
      },
      children: [
        {
          path: '',
          name: 'RootRedirect',
          redirect: '/dashboard',
          meta: { requiresAuth: true },
        },
        // 注入合并后的路由
        ...allChildren.map((route) => {
          const newPath = route.path.replace(/^\//, '');

          // 如果 redirect 是字符串且带前导/，需要转换为相对路径
          if (typeof route.redirect === 'string' && route.redirect.startsWith('/')) {
            return {
              ...route,
              path: newPath,
              redirect: route.redirect.replace(/^\//, ''),
            };
          }
          return {
            ...route,
            path: newPath,
          };
        }),
      ],
    },
    {
      path: '/403',
      name: 'AdminForbidden',
      component: () => import('../views/forbidden/Index.vue'),
      meta: {
        title: '权限不足',
        requiresAuth: true,
        menu: false,
      },
    },
    {
      path: '/404',
      name: 'AdminNotFound',
      component: () => import('../views/not-found/Index.vue'),
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

  const router = createRouter({
    history: options.history ?? createWebHistory(options.base),
    routes: finalRoutes,
  });

  // 使用新的路由权限守卫
  setupRouteGuard(router);

  return router;
}

export * from './routes';
export { setupRouteGuard, resetRouteGuard } from './guard';
