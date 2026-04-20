/**
 * @fileoverview 布局状态工具函数。
 */

import type {
  LayoutStyleConfig,
  PageTabItem,
  SideMenuItem,
} from '../types/layout-types';
import { LAYOUT_PREFERENCES_STORAGE_KEY, type LayoutPersistedState } from './layout-store-model';

/**
 * 深拷贝菜单树。
 */
export function cloneMenus(items: SideMenuItem[] = []): SideMenuItem[] {
  return items.map((item) => ({
    ...item,
    children: item.children ? cloneMenus(item.children) : undefined,
  }));
}

/**
 * 创建首页标签。
 */
export function createHomeTab(homePath: string): PageTabItem {
  return {
    key: homePath,
    title: '首页',
    path: homePath,
    fullPath: homePath,
    affix: true,
    closable: false,
  };
}

/**
 * 读取持久化状态。
 */
export function readPersistedState(): LayoutPersistedState {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(LAYOUT_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as LayoutPersistedState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * 规范化持久化标签页。
 */
export function normalizePersistedTabs(tabs: PageTabItem[] | undefined, homePath: string): PageTabItem[] {
  const homeTab = createHomeTab(homePath);
  if (!Array.isArray(tabs) || tabs.length === 0) {
    return [homeTab];
  }

  const deduped: PageTabItem[] = [];
  const pathSet = new Set<string>();
  for (const tab of tabs) {
    if (!tab || typeof tab.fullPath !== 'string' || !tab.fullPath || pathSet.has(tab.fullPath)) {
      continue;
    }
    pathSet.add(tab.fullPath);
    deduped.push({
      key: tab.key || tab.fullPath,
      title: tab.title || '未命名页面',
      path: tab.path || tab.fullPath,
      fullPath: tab.fullPath,
      affix: tab.affix || tab.path === homePath || tab.fullPath === homePath,
      closable: !(tab.affix || tab.path === homePath || tab.fullPath === homePath),
    });
  }

  if (!deduped.some((tab) => tab.path === homePath || tab.fullPath === homePath)) {
    deduped.unshift(homeTab);
  }

  return deduped.map((tab) => {
    if (tab.path === homePath || tab.fullPath === homePath || tab.affix) {
      return { ...tab, affix: true, closable: false };
    }
    return tab;
  });
}

/**
 * 判断菜单路径是否命中当前路由。
 */
export function isPathMatched(routePath: string, menuPath?: string): boolean {
  if (!menuPath) {
    return false;
  }
  return routePath === menuPath || routePath.startsWith(`${menuPath}/`);
}

/**
 * 判断路径是否包含在菜单树中。
 */
export function containsPathInMenu(item: SideMenuItem, routePath: string): boolean {
  const target = typeof item.to === 'string' ? item.to : undefined;
  if (isPathMatched(routePath, target)) {
    return true;
  }
  if (!item.children || item.children.length === 0) {
    return false;
  }
  return item.children.some((child) => containsPathInMenu(child, routePath));
}

/**
 * 组装持久化样式配置。
 */
export function mergeStyleConfig(base: LayoutStyleConfig, persisted?: Partial<LayoutStyleConfig>): LayoutStyleConfig {
  return {
    ...base,
    ...persisted,
  };
}
