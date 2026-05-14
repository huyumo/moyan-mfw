/**
 * @fileoverview 菜单构建工具模块。
 *
 * 从扁平路由配置构建菜单树。根据 meta.moduleInfo 对页面进行逻辑分组，
 * 无需路由嵌套结构即可生成层级菜单。
 *
 * 核心逻辑：
 * - 有 moduleInfo 的页面 → 归入对应模块分组（如"系统管理"下的"用户管理"）
 * - 无 moduleInfo 的页面 → 作为顶级菜单项（如"首页"）
 * - 模块分组和顶级项均按 meta.menuOrder 排序
 */

import type { RouteRecordRaw } from 'vue-router';
import type { SideMenuItem } from '../types/layout-types';
import { buildRoutesFromConfigs } from './routes';

/** 带 order 字段的内部菜单项，用于排序后剥离 */
interface OrderedMenuItem extends SideMenuItem {
  order: number;
}

/** 路径规范化：去除重复斜杠和尾部斜杠 */
function normalizePath(path: string): string {
  return `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

/**
 * 从扁平路由配置构建菜单树。
 *
 * 根据 meta.moduleInfo 将页面分组到模块菜单下；
 * 无 moduleInfo 的页面作为顶级菜单项。
 *
 * @param routes - 扁平路由列表（由 buildRoutesFromConfigs 生成）
 * @param context.parentPath - 父路径前缀（如 '/'），用于生成绝对路径
 */
export function createMenuTreeFromRoutes(
  routes: RouteRecordRaw[],
  context?: { parentPath?: string }
): SideMenuItem[] {
  const parentPath = context?.parentPath ?? '';
  const moduleGroups = new Map<string, OrderedMenuItem>();
  const topLevelItems: OrderedMenuItem[] = [];

  for (const route of routes) {
    const meta = (route.meta ?? {}) as Record<string, unknown>;

    // 跳过隐藏菜单
    if (meta.menu === false || meta.hidden === true) {
      continue;
    }

    const routePath = typeof route.path === 'string' ? route.path : '';
    const absolutePath = normalizePath(`${parentPath}/${routePath}`);

    // 菜单标签优先级：menuLabel > title > route.name
    const menuLabel =
      typeof meta.menuLabel === 'string'
        ? meta.menuLabel
        : typeof meta.title === 'string'
          ? meta.title
          : typeof route.name === 'string'
            ? route.name
            : '';

    // 无标签则跳过
    if (!menuLabel) {
      continue;
    }

    // 菜单 key 优先级：menuKey > route.name > 路径
    const menuKey =
      typeof meta.menuKey === 'string'
        ? meta.menuKey
        : typeof route.name === 'string'
          ? route.name
          : absolutePath;

    const menuItem: OrderedMenuItem = {
      key: menuKey,
      label: String(menuLabel),
      to: absolutePath,
      icon: typeof meta.menuIcon === 'string' ? meta.menuIcon : undefined,
      badge: typeof meta.menuBadge === 'string' ? meta.menuBadge : undefined,
      order: typeof meta.menuOrder === 'number' ? meta.menuOrder : 50,
    };

    // 读取模块信息，决定分组归属
    const moduleInfo = meta.moduleInfo as
      | { modulePath: string; moduleName: string; moduleIcon?: string; moduleOrder?: number }
      | undefined;

    if (moduleInfo) {
      // 首次遇到该模块时创建分组项
      if (!moduleGroups.has(moduleInfo.modulePath)) {
        moduleGroups.set(moduleInfo.modulePath, {
          key: `Module_${moduleInfo.modulePath}`,
          label: moduleInfo.moduleName,
          to: absolutePath,
          icon: moduleInfo.moduleIcon,
          order: moduleInfo.moduleOrder ?? 50,
          children: [],
        });
      }
      // 将页面归入对应模块分组
      const group = moduleGroups.get(moduleInfo.modulePath)!;
      group.children!.push(menuItem);
    } else {
      // 无模块归属，作为顶级菜单项
      topLevelItems.push(menuItem);
    }
  }

  // 合并模块分组和顶级项，按 order 排序，剥离内部 order 字段
  const allItems: OrderedMenuItem[] = [
    ...Array.from(moduleGroups.values()),
    ...topLevelItems,
  ];

  return allItems
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...item }) => item);
}

/**
 * 菜单树去重。
 * 按路径（item.to）去重，防止重复路由出现在菜单中。
 * 递归处理子菜单，空分组和无路径项会被过滤。
 */
export function dedupeMenuTree(
  items: SideMenuItem[],
  existed = new Set<string>()
): SideMenuItem[] {
  const result: SideMenuItem[] = [];

  for (const item of items) {
    const children = item.children
      ? dedupeMenuTree(item.children, existed)
      : undefined;
    const path = typeof item.to === 'string' ? item.to : '';

    // 无路径且无有效子项 → 跳过
    if (!path && (!children || children.length === 0)) {
      continue;
    }
    // 路径重复 → 跳过
    if (path && existed.has(path)) {
      continue;
    }
    if (path) {
      existed.add(path);
    }

    result.push({ ...item, children });
  }

  return result;
}

/**
 * 读取路由配置并转换为菜单格式。
 * 用于安装向导预览等场景，直接从 views 目录扫描生成菜单。
 */
export function readRoutes(): SideMenuItem[] {
  const allConfigs = import.meta.glob('../views/**/index.{ts,tsx}', {
    eager: true,
    import: 'default',
  });

  const routes = buildRoutesFromConfigs(allConfigs, { minSegments: 1 });
  return createMenuTreeFromRoutes(routes, { parentPath: '' });
}
