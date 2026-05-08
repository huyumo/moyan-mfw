/**
 * @fileoverview 路由权限守卫
 * @description 处理页面访问权限验证、登录重定向、Token 过期处理
 */

import type { Router, RouteLocationNormalized } from 'vue-router';
import { useAuthStore, TOKEN_KEY } from '../store/auth-store';
import { useAppLoadingStore } from '../store/app-loading-store';

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
    return sysInitialized as boolean;
  }
  try {
    const response = await fetch('/api/install/status', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    sysInitialized = Boolean(result.data?.initialized);
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
  router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next) => {
    const authStore = useAuthStore();
    const appLoadingStore = useAppLoadingStore();

    const initialized = await checkInitialized();

    if (!initialized) {
      if (to.path !== '/install') {
        next({ path: '/install' });
        return;
      }
      next();
      return;
    }

    if (initialized && to.path === '/install') {
      next({ path: '/login' });
      return;
    }

    if (to.path === '/' || (to.name === 'RootRedirect' && to.path === '/')) {
      const hasToken = localStorage.getItem(TOKEN_KEY);
      if (!hasToken) {
        next({ path: '/login' });
        return;
      }
      next({ path: '/dashboard' });
      return;
    }

    if (WHITE_LIST.includes(to.path)) {
      const hasToken = localStorage.getItem(TOKEN_KEY);
      if (to.path === '/login' && hasToken && authStore.isLoggedIn) {
        // 已登录但尚未选择应用 → 留在登录页展示选择面板
        if (authStore.needSelectApp) {
          next();
          return;
        }
        next({ path: '/' });
        return;
      }
      next();
      return;
    }

    const hasToken = localStorage.getItem(TOKEN_KEY);
    if (!hasToken) {
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      });
      return;
    }

    if (!isInitialized) {
      isInitialized = true;
      
      if (authStore.isAuthenticated) {
        next();
        return;
      }
      
      appLoadingStore.showLoading('正在初始化认证...');
      
      try {
        const success = await authStore.initializeAuth();
        if (!success) {
          appLoadingStore.hideLoading();
          next({
            path: '/login',
            query: { redirect: to.fullPath },
          });
          return;
        }

        // 多应用且未选择 → 跳转登录页展示选择面板
        if (authStore.needSelectApp) {
          appLoadingStore.hideLoading();
          next({
            path: '/login',
            query: { redirect: to.fullPath },
          });
          return;
        }
      } catch (error) {
        console.error('[RouteGuard] 初始化认证状态失败:', error);
        authStore.clearToken();
        appLoadingStore.hideLoading();
        next({
          path: '/login',
          query: { redirect: to.fullPath },
        });
        return;
      }
      
      appLoadingStore.hideLoading();
    }

    if (to.meta.requiresAuth !== false) {
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