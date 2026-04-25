/**
 * @fileoverview 布局状态管理入口。
 */

import { defineStore } from 'pinia';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import {
  defaultLayoutStyleConfig,
  defaultNavigationConfig,
} from '../config/layout-defaults';
import type {
  AdminNavigationConfig,
  LayoutExtensionComponents,
  LoginExtensionComponents,
  LayoutMode,
  LayoutStyleConfig,
} from '../types/layout-types';
import { type LayoutPreferenceActionContext, type LayoutState } from './layout-store-model';
import {
  cloneMenus,
  mergeStyleConfig,
  normalizePersistedTabs,
  readPersistedState,
} from './layout-store-utils';
import {
  patchStyleConfig,
  persistPreferences,
  resetToDefaults,
  setActiveTopMenuKey,
  setLayoutExtensions,
  setLoginExtensions,
  setLayoutMode,
  setNavigation,
  syncActiveTopMenuByPath,
  toggleCompact,
  toggleSettingsPanel,
} from './layout-store-preference-actions';
import {
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  closeTabsLeft,
  closeTabsRight,
  syncRouteTab,
} from './layout-store-tab-actions';

/**
 * 布局状态仓库。
 */
export const useLayoutStore = defineStore('mfw-base-layout', {
  /**
   * 初始化状态。
   */
  state: (): LayoutState => {
    const persisted = readPersistedState();
    const homePath = defaultNavigationConfig.homePath || '/dashboard';
    const visitedTabs = normalizePersistedTabs(persisted.visitedTabs, homePath);
    const activeTabPath = visitedTabs.some((tab) => tab.fullPath === persisted.activeTabPath)
      ? (persisted.activeTabPath as string)
      : visitedTabs[0].fullPath;

    return {
      styleConfig: mergeStyleConfig(defaultLayoutStyleConfig, persisted.styleConfig),
      navigation: {
        ...defaultNavigationConfig,
        topNav: [...defaultNavigationConfig.topNav],
        sideMenu: cloneMenus(defaultNavigationConfig.sideMenu),
      },
      settingsPanelOpen: false,
      activeTopMenuKey: persisted.activeTopMenuKey || defaultNavigationConfig.sideMenu[0]?.key || '',
      visitedTabs,
      activeTabPath,
      layoutExtensions: {},
      loginExtensions: {},
      currentApp: null,
      userApps: [],
    };
  },

  getters: {
    /**
     * 是否显示侧边栏。
     */
    showSidebar(state): boolean {
      return state.styleConfig.layoutMode !== 'top';
    },
  },

  actions: {
    persistPreferences() {
      persistPreferences(this as unknown as LayoutPreferenceActionContext);
    },

    patchStyleConfig(payload: Partial<LayoutStyleConfig>, options?: { persist?: boolean }) {
      patchStyleConfig(this as unknown as LayoutPreferenceActionContext, payload, options);
    },

    setLayoutMode(mode: LayoutMode) {
      setLayoutMode(this as unknown as LayoutPreferenceActionContext, mode);
    },

    toggleCompact(force?: boolean) {
      toggleCompact(this as unknown as LayoutPreferenceActionContext, force);
    },

    setNavigation(payload: Partial<AdminNavigationConfig>, options?: { clearTabs?: boolean }) {
      setNavigation(this as unknown as LayoutPreferenceActionContext, payload, options);
    },

    toggleSettingsPanel(force?: boolean) {
      toggleSettingsPanel(this as unknown as LayoutPreferenceActionContext, force);
    },

    setActiveTopMenuKey(key: string) {
      setActiveTopMenuKey(this as unknown as LayoutPreferenceActionContext, key);
    },

    syncActiveTopMenuByPath(path: string) {
      syncActiveTopMenuByPath(this as unknown as LayoutPreferenceActionContext, path);
    },

    setLayoutExtensions(payload: LayoutExtensionComponents = {}) {
      setLayoutExtensions(this as unknown as LayoutPreferenceActionContext, payload);
    },

    setLoginExtensions(payload: LoginExtensionComponents = {}) {
      setLoginExtensions(this as unknown as LayoutPreferenceActionContext, payload);
    },

    setCurrentApp(app: LayoutState['currentApp']) {
      this.currentApp = app;
    },

    setUserApps(apps: LayoutState['userApps']) {
      this.userApps = apps;
    },

    syncRouteTab(route: RouteLocationNormalizedLoaded) {
      syncRouteTab(this as unknown as LayoutPreferenceActionContext, route);
    },

    setActiveTab(path: string) {
      this.activeTabPath = path;
      this.persistPreferences();
    },

    closeTab(path: string): string {
      return closeTab(this as unknown as LayoutPreferenceActionContext, path);
    },

    closeTabsLeft(targetPath: string): string {
      return closeTabsLeft(this as unknown as LayoutPreferenceActionContext, targetPath);
    },

    closeTabsRight(targetPath: string): string {
      return closeTabsRight(this as unknown as LayoutPreferenceActionContext, targetPath);
    },

    closeOtherTabs(targetPath: string): string {
      return closeOtherTabs(this as unknown as LayoutPreferenceActionContext, targetPath);
    },

    closeAllTabs(): string {
      return closeAllTabs(this as unknown as LayoutPreferenceActionContext);
    },

    resetToDefaults() {
      resetToDefaults(this as unknown as LayoutPreferenceActionContext);
    },
  },
}) as any;
