/**
 * @fileoverview 基础前端路由创建与鉴权守卫模块。
 */

import { createRouter, createWebHistory, type RouteRecordRaw, type Router, type RouterHistory } from 'vue-router';
import { createBaseAdminRoutes } from './routes';

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
  /** 业务路由配置 */
  businessRoutes?: RouteRecordRaw[];
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
  const resolvedRoutes = options.routes ?? createBaseAdminRoutes({ businessRoutes: options.businessRoutes });

  const router = createRouter({
    history: options.history ?? createWebHistory(options.base),
    routes: resolvedRoutes,
  });

  const appTitle = options.title ?? '墨焱管理后台';

  router.beforeEach((to) => {
    if (typeof document !== 'undefined') {
      document.title = resolvePageTitle(to.meta.title, appTitle);
    }

    const token = readAuthToken();
    if (to.meta.requiresAuth && !token) {
      return {
        path: '/login',
        query: {
          redirect: to.fullPath,
        },
      };
    }

    if (to.path === '/login' && token) {
      return {
        path: '/dashboard',
      };
    }

    return true;
  });

  return router;
}

export * from './routes';
