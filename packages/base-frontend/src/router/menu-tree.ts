/**
 * @fileoverview 业务路由菜单树构建工具。
 */

import type { RouteLocationRaw, RouteRecordRaw } from 'vue-router';
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
  const resolved = `/${path}`.replace(/\/+/g, '/');
  if (resolved.length > 1 && resolved.endsWith('/')) {
    return resolved.slice(0, -1);
  }
  return resolved;
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
 * 判断菜单路径是否可直接访问。
 */
function isMenuPathAvailable(path: string): boolean {
  return Boolean(path) && !path.includes(':');
}

/**
 * 路由目标转路径字符串。
 */
function toPathString(target?: RouteLocationRaw): string {
  if (!target) {
    return '';
  }
  if (typeof target === 'string') {
    return target;
  }
  if ('path' in target && typeof target.path === 'string') {
    return target.path;
  }
  return '';
}

/**
 * 解析菜单目标路径。
 */
function resolveMenuTarget(path: string, children: SideMenuItem[]): string {
  if (isMenuPathAvailable(path)) {
    return path;
  }
  const childPath = toPathString(children[0]?.to);
  return childPath || '/dashboard';
}

/**
 * 元信息转字符串。
 */
function toMetaString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * 元信息转数字。
 */
function toMetaNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * 元信息转徽标文本。
 */
function toMetaBadge(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

/**
 * 从路由构建菜单树。
 */
export function createMenuTreeFromRoutes(routes: RouteRecordRaw[], context: MenuBuildContext): SideMenuItem[] {
  const orderedMenus: OrderedMenuItem[] = [];

  for (const route of routes) {
    const meta = (route.meta ?? {}) as Record<string, unknown>;
    const routePath = typeof route.path === 'string' ? route.path : '';
    const absolutePath = resolveAbsolutePath(context.parentPath, routePath);
    const children = createMenuTreeFromRoutes(route.children || [], { parentPath: absolutePath });

    if (meta.menu === false) {
      orderedMenus.push(...children.map((item) => ({ ...item, order: item.order ?? 50 })));
      continue;
    }

    const menuLabel =
      toMetaString(meta.menuLabel) || toMetaString(meta.title) || (typeof route.name === 'string' ? route.name : '');
    if (!menuLabel) {
      orderedMenus.push(...children.map((item) => ({ ...item, order: item.order ?? 50 })));
      continue;
    }

    const targetPath = resolveMenuTarget(absolutePath, children);
    const menuKey =
      toMetaString(meta.menuKey) ||
      (typeof route.name === 'string' ? route.name : '') ||
      targetPath ||
      `${context.parentPath}-${menuLabel}`;

    orderedMenus.push({
      key: menuKey,
      label: menuLabel,
      to: targetPath,
      icon: toMetaString(meta.menuIcon) || undefined,
      badge: toMetaBadge(meta.menuBadge),
      order: toMetaNumber(meta.menuOrder, 50),
      children: children.length > 0 ? children : undefined,
    });
  }

  return orderedMenus.sort((a, b) => (a.order ?? 50) - (b.order ?? 50)).map(({ order: _order, ...menu }) => menu);
}

/**
 * 菜单树去重。
 */
export function dedupeMenuTree(items: SideMenuItem[], existed = new Set<string>()): SideMenuItem[] {
  const result: SideMenuItem[] = [];

  for (const item of items) {
    const children = item.children ? dedupeMenuTree(item.children, existed) : undefined;
    const path = toPathString(item.to);

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
