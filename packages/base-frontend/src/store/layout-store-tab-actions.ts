/**
 * @fileoverview 布局标签页动作实现。
 */

import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { LayoutTabActionContext } from './layout-store-model';

/**
 * 同步路由到标签页。
 */
export function syncRouteTab(store: LayoutTabActionContext, route: RouteLocationNormalizedLoaded): void {
  const homePath = store.navigation.homePath || '/dashboard';
  const affix = Boolean(route.meta.affix) || route.path === homePath;
  const fullPath = route.fullPath || route.path;
  const title = typeof route.meta.title === 'string' && route.meta.title.trim() ? route.meta.title : '未命名页面';
  const key = typeof route.name === 'string' ? route.name : fullPath;

  const existedIndex = store.visitedTabs.findIndex((tab) => tab.fullPath === fullPath);
  if (existedIndex >= 0) {
    store.visitedTabs[existedIndex] = {
      ...store.visitedTabs[existedIndex],
      title,
      affix: store.visitedTabs[existedIndex].affix || affix,
      closable: !(store.visitedTabs[existedIndex].affix || affix),
    };
  } else {
    store.visitedTabs.push({
      key,
      title,
      path: route.path,
      fullPath,
      affix,
      closable: !affix,
    });
  }

  store.activeTabPath = fullPath;
  store.persistPreferences();
}

/**
 * 关闭单个标签页。
 */
export function closeTab(store: LayoutTabActionContext, path: string): string {
  const currentIndex = store.visitedTabs.findIndex((tab) => tab.fullPath === path);
  if (currentIndex < 0) {
    return store.activeTabPath;
  }

  const currentTab = store.visitedTabs[currentIndex];
  if (currentTab.affix) {
    return store.activeTabPath;
  }

  const wasActive = store.activeTabPath === path;
  store.visitedTabs.splice(currentIndex, 1);

  if (!wasActive) {
    store.persistPreferences();
    return store.activeTabPath;
  }

  const nextTab = store.visitedTabs[currentIndex] || store.visitedTabs[currentIndex - 1] || store.visitedTabs[0];
  store.activeTabPath = nextTab ? nextTab.fullPath : store.navigation.homePath || '/dashboard';
  store.persistPreferences();
  return store.activeTabPath;
}

/**
 * 关闭目标左侧标签。
 */
export function closeTabsLeft(store: LayoutTabActionContext, targetPath: string): string {
  const targetIndex = store.visitedTabs.findIndex((tab) => tab.fullPath === targetPath);
  if (targetIndex < 0) {
    return store.activeTabPath;
  }

  const targetSet = new Set([targetPath, ...store.visitedTabs.filter((tab) => tab.affix).map((tab) => tab.fullPath)]);
  store.visitedTabs = store.visitedTabs.filter((tab, index) => index >= targetIndex || targetSet.has(tab.fullPath));
  if (!store.visitedTabs.some((tab) => tab.fullPath === store.activeTabPath)) {
    store.activeTabPath = targetPath;
  }

  store.persistPreferences();
  return store.activeTabPath;
}

/**
 * 关闭目标右侧标签。
 */
export function closeTabsRight(store: LayoutTabActionContext, targetPath: string): string {
  const targetIndex = store.visitedTabs.findIndex((tab) => tab.fullPath === targetPath);
  if (targetIndex < 0) {
    return store.activeTabPath;
  }

  const targetSet = new Set([targetPath, ...store.visitedTabs.filter((tab) => tab.affix).map((tab) => tab.fullPath)]);
  store.visitedTabs = store.visitedTabs.filter((tab, index) => index <= targetIndex || targetSet.has(tab.fullPath));
  if (!store.visitedTabs.some((tab) => tab.fullPath === store.activeTabPath)) {
    store.activeTabPath = targetPath;
  }

  store.persistPreferences();
  return store.activeTabPath;
}

/**
 * 关闭其他标签。
 */
export function closeOtherTabs(store: LayoutTabActionContext, targetPath: string): string {
  const targetSet = new Set([targetPath, ...store.visitedTabs.filter((tab) => tab.affix).map((tab) => tab.fullPath)]);
  store.visitedTabs = store.visitedTabs.filter((tab) => targetSet.has(tab.fullPath));
  store.activeTabPath = store.visitedTabs.some((tab) => tab.fullPath === targetPath)
    ? targetPath
    : store.visitedTabs[0]?.fullPath || store.navigation.homePath || '/dashboard';

  store.persistPreferences();
  return store.activeTabPath;
}

/**
 * 关闭全部标签。
 */
export function closeAllTabs(store: LayoutTabActionContext): string {
  store.visitedTabs = store.visitedTabs.filter((tab) => tab.affix);
  store.activeTabPath = store.visitedTabs[0]?.fullPath || store.navigation.homePath || '/dashboard';
  store.persistPreferences();
  return store.activeTabPath;
}
