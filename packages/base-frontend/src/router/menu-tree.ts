/**
 * @fileoverview 业务路由菜单树构建工具。
 */

import type { RouteRecordRaw } from 'vue-router';
import type { SideMenuItem } from '../types/layout-types';

/**
 * 菜单构建上下文。
 */
interface MenuBuildContext {
  /** 父级路径 */
  parentPath: string;
}

/**
 * 带排序信息的菜单项。
 */
interface OrderedMenuItem extends SideMenuItem {
  /** 排序字段 */
  order: number;
}

/**
 * 规范化路径。
 */
function normalizePath(path: string): string {
  return `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

/**
 * 解析绝对路径。
 */
function resolveAbsolutePath(parentPath: string, currentPath: string): string {
  if (!currentPath) {
    return normalizePath(parentPath || '/');
  }
  if (currentPath.startsWith('/')) {
    return normalizePath(currentPath);
  }
  return normalizePath(`${parentPath}/${currentPath}`);
}

/**
 * 从路由配置构建菜单树。
 */
export function createMenuTreeFromRoutes(
  routes: RouteRecordRaw[],
  context: MenuBuildContext
): SideMenuItem[] {
  const orderedMenus: OrderedMenuItem[] = [];

  for (const route of routes) {
    const meta = (route.meta ?? {}) as Record<string, unknown>;

    // 跳过隐藏菜单
    if (meta.menu === false || meta.hidden === true) {
      continue;
    }

    const routePath = typeof route.path === 'string' ? route.path : '';
    const absolutePath = resolveAbsolutePath(context.parentPath, routePath);
    const children = route.children ? createMenuTreeFromRoutes(route.children, { parentPath: absolutePath }) : [];

    // 获取菜单标签
    const menuLabel =
      typeof meta.menuLabel === 'string'
        ? meta.menuLabel
        : typeof meta.title === 'string'
        ? meta.title
        : typeof route.name === 'string'
        ? route.name
        : '';

    if (!menuLabel) {
      continue;
    }

    // 生成菜单项
    const menuKey =
      typeof meta.menuKey === 'string'
        ? meta.menuKey
        : typeof route.name === 'string'
        ? route.name
        : absolutePath;

    orderedMenus.push({
      key: menuKey,
      label: String(menuLabel),
      to: absolutePath,
      icon: typeof meta.menuIcon === 'string' ? meta.menuIcon : undefined,
      badge: typeof meta.menuBadge === 'string' ? meta.menuBadge : undefined,
      order: typeof meta.menuOrder === 'number' ? meta.menuOrder : 50,
      children: children.length > 0 ? children : undefined,
    });
  }

  // 按 order 排序
  return orderedMenus
    .sort((a, b) => (a.order ?? 50) - (b.order ?? 50))
    .map(({ order: _order, ...menu }) => menu);
}

/**
 * 菜单树去重。
 */
export function dedupeMenuTree(items: SideMenuItem[], existed = new Set<string>()): SideMenuItem[] {
  const result: SideMenuItem[] = [];

  for (const item of items) {
    const children = item.children ? dedupeMenuTree(item.children, existed) : undefined;
    const path = typeof item.to === 'string' ? item.to : '';

    if (!path && (!children || children.length === 0)) {
      continue;
    }
    if (path && existed.has(path)) {
      continue;
    }
    if (path) {
      existed.add(path);
    }

    result.push({
      ...item,
      children,
    });
  }

  return result;
}
