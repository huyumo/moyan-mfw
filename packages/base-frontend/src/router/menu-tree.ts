/**
 * @fileoverview 业务路由菜单树构建工具。
 */

import type { SideMenuItem } from '../types/layout-types';
import type { BusinessMenuItem } from './routes';

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
 * 从业务菜单树转换为 SideMenuItem 树
 */
export function createMenuTreeFromRoutes(
  menus: BusinessMenuItem[],
  context: MenuBuildContext
): SideMenuItem[] {
  const orderedMenus: OrderedMenuItem[] = [];

  for (const item of menus) {
    const path = item.path || `/${item.name}`;
    const absolutePath = resolveAbsolutePath(context.parentPath, path);

    // 递归处理子菜单
    const children = item.children && item.children.length > 0
      ? createMenuTreeFromRoutes(item.children, { parentPath: absolutePath })
      : [];

    orderedMenus.push({
      key: `menu-${item.name}`,
      label: item.title,
      to: absolutePath,
      icon: item.icon,
      order: 50,
      children: children.length > 0 ? children : undefined,
    });
  }

  return orderedMenus.map(({ order: _order, ...menu }) => menu);
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
