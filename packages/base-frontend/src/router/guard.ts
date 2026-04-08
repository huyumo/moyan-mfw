/**
 * @fileoverview 路由权限守卫
 * @description 处理页面访问权限验证、登录重定向、Token 过期处理
 */

import type { Router, RouteLocationNormalized } from 'vue-router';
import { useAuthStore, TOKEN_KEY } from '../store/auth-store';

/** 白名单路由（无需登录即可访问） */
const WHITE_LIST = ['/login', '/install', '/403', '/404'];

/** 已初始化标记 */
let isInitialized = false;

/** 系统初始化状态 */
let sysInitialized: boolean | null = null;

/**
 * 检查系统初始化状态
 * @description 网络/服务不可用时返回 true，避免误判为"未初始化"导致跳转
 */
async function checkInitialized(): Promise<boolean> {
  if (sysInitialized !== null) {
    return sysInitialized;
  }
  try {
    const response = await fetch('/api/install/status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    sysInitialized = result.data?.initialized ?? false;
    return sysInitialized;
  } catch (error) {
    // 网络/服务不可用时，假设系统已初始化，避免误跳转
    console.warn('[RouteGuard] 检查初始化状态失败，假设系统已初始化:', error);
    sysInitialized = true;
    return true;
  }
}

/**
 * 设置路由权限守卫
 * @param router Vue Router 实例
 */
export function setupRouteGuard(router: Router): void {
  // 全局前置守卫
  router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next) => {
    const authStore = useAuthStore();

    // 0. 检查系统初始化状态
    const initialized = await checkInitialized();

    // 0.1 系统未初始化时，只允许访问 /install 页面
    if (!initialized) {
      if (to.path !== '/install') {
        next({ path: '/install' });
        return;
      }
      next();
      return;
    }

    // 0.2 系统已初始化时，禁止访问 /install 页面
    if (initialized && to.path === '/install') {
      next({ path: '/login' });
      return;
    }

    // 1. 处理根路径 /
    if (to.path === '/' || (to.name === 'RootRedirect' && to.path === '/')) {
      const hasToken = localStorage.getItem(TOKEN_KEY);
      if (!hasToken) {
        // 未认证，重定向到登录页
        next({ path: '/login' });
        return;
      }
      // 已认证，重定向到仪表盘
      next({ path: '/dashboard' });
      return;
    }

    // 1. 检查是否在白名单中
    if (WHITE_LIST.includes(to.path)) {
      // 已登录用户访问登录页，且 Token 有效时重定向到首页
      // 注意：使用 localStorage 直接检查，避免响应式延迟问题
      const hasToken = localStorage.getItem(TOKEN_KEY);
      if (to.path === '/login' && hasToken && authStore.isLoggedIn) {
        next({ path: '/' });
        return;
      }
      next();
      return;
    }

    // 2. 检查是否有 Token
    const hasToken = localStorage.getItem(TOKEN_KEY);
    if (!hasToken) {
      // 未登录，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      });
      return;
    }

    // 3. 首次访问时初始化认证状态
    if (!isInitialized) {
      isInitialized = true;
      try {
        const success = await authStore.initializeAuth();
        if (!success) {
          // 初始化失败，清除 Token 并重定向到登录页
          next({
            path: '/login',
            query: { redirect: to.fullPath },
          });
          return;
        }
      } catch (error) {
        console.error('[RouteGuard] 初始化认证状态失败:', error);
        authStore.clearToken();
        next({
          path: '/login',
          query: { redirect: to.fullPath },
        });
        return;
      }
    }

    // 4. 检查页面权限
    if (to.meta.requiresAuth !== false) {
      // 检查是否有权限访问该页面
      const hasPermission = checkPagePermission(to, authStore);
      if (!hasPermission) {
        next({ path: '/403' });
        return;
      }
    }

    next();
  });

  // 全局后置守卫
  router.afterEach((to: RouteLocationNormalized) => {
    // 设置页面标题
    const title = to.meta.title as string;
    if (title && typeof document !== 'undefined') {
      document.title = title;
    }
  });
}

/**
 * 检查页面权限
 * @param to 目标路由
 * @param authStore 认证 Store
 * @returns 是否有权限
 */
function checkPagePermission(to: RouteLocationNormalized, authStore: ReturnType<typeof useAuthStore>): boolean {
  // 如果页面标记为不需要认证，直接通过
  if (to.meta.requiresAuth === false) {
    return true;
  }

  // 如果页面标记为菜单页面，检查权限菜单
  if (to.meta.menu !== false) {
    const permissionMenu = authStore.permissionMenu;
    if (permissionMenu.length === 0) {
      // 没有权限菜单数据，暂时允许通过（可能在加载中）
      return true;
    }

    // 检查路由路径是否在权限菜单中
    const routePath = to.path;
    const hasPermission = checkRouteInMenu(routePath, permissionMenu);
    if (!hasPermission) {
      return false;
    }
  }

  return true;
}

/**
 * 检查路由是否在权限菜单中
 * @param routePath 路由路径
 * @param menu 权限菜单
 * @returns 是否在菜单中
 */
function checkRouteInMenu(routePath: string, menu: any[]): boolean {
  for (const item of menu) {
    // 检查当前节点的路由路径
    if (item.routePath === routePath) {
      return true;
    }

    // 递归检查子节点
    if (item.children && item.children.length > 0) {
      if (checkRouteInMenu(routePath, item.children)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 重置守卫状态（用于登出后重新初始化）
 */
export function resetRouteGuard(): void {
  isInitialized = false;
}

/**
 * 重置系统初始化状态（用于安装完成后）
 */
export function resetSystemInitialized(): void {
  sysInitialized = null;
}