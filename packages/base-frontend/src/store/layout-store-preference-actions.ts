/**
 * @fileoverview 布局偏好动作实现。
 */

import { markRaw } from 'vue';
import { defaultLayoutStyleConfig } from '../config/layout-defaults';
import type {
  AdminNavigationConfig,
  LayoutExtensionComponents,
  LoginExtensionComponents,
  LayoutMode,
  LayoutStyleConfig,
  ThemeRegistry,
} from '../types/layout-types';
import { containsPathInMenu, createHomeTab, cloneMenus } from './layout-store-utils';
import {
  LAYOUT_PREFERENCES_STORAGE_KEY,
  type LayoutPersistedState,
  type LayoutPreferenceActionContext,
} from './layout-store-model';

/** 偏好操作实现。 */
export function persistPreferences(store: LayoutPreferenceActionContext): void {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: LayoutPersistedState = {
    styleConfig: store.styleConfig,
    activeTopMenuKey: store.activeTopMenuKey,
    visitedTabs: store.visitedTabs,
    activeTabPath: store.activeTabPath,
  };
  window.localStorage.setItem(LAYOUT_PREFERENCES_STORAGE_KEY, JSON.stringify(payload));
}

/** 偏好操作实现。 */
export function patchStyleConfig(
  store: LayoutPreferenceActionContext,
  payload: Partial<LayoutStyleConfig>,
  options?: { persist?: boolean },
): void {
  store.styleConfig = {
    ...store.styleConfig,
    ...payload,
  };
  if (options?.persist !== false) {
    store.persistPreferences();
  }
}

/** 偏好操作实现。 */
export function setLayoutMode(store: LayoutPreferenceActionContext, mode: LayoutMode): void {
  store.styleConfig.layoutMode = mode;
  store.persistPreferences();
}

/** 偏好操作实现。 */
export function toggleCompact(store: LayoutPreferenceActionContext, force?: boolean): void {
  store.styleConfig.compact = typeof force === 'boolean' ? force : !store.styleConfig.compact;
  store.persistPreferences();
}

/** 偏好操作实现。 */
export function setNavigation(store: LayoutPreferenceActionContext, payload: Partial<AdminNavigationConfig>): void {
  store.navigation = {
    ...store.navigation,
    ...payload,
    topNav: payload.topNav ? [...payload.topNav] : [...store.navigation.topNav],
    sideMenu: payload.sideMenu ? cloneMenus(payload.sideMenu) : cloneMenus(store.navigation.sideMenu),
  };

  const homePath = store.navigation.homePath || '/dashboard';
  const homeTab = createHomeTab(homePath);
  const restTabs = store.visitedTabs.filter((tab) => !tab.affix);
  store.visitedTabs = [homeTab, ...restTabs];

  if (!store.activeTabPath) {
    store.activeTabPath = homePath;
  }
  if (!store.activeTopMenuKey && store.navigation.sideMenu.length > 0) {
    store.activeTopMenuKey = store.navigation.sideMenu[0].key;
  }

  store.persistPreferences();
}

/** 偏好操作实现。 */
export function toggleSettingsPanel(store: LayoutPreferenceActionContext, force?: boolean): void {
  store.settingsPanelOpen = typeof force === 'boolean' ? force : !store.settingsPanelOpen;
}

/** 偏好操作实现。 */
export function registerThemes(store: LayoutPreferenceActionContext, payload: ThemeRegistry): void {
  store.themes = {
    ...store.themes,
    ...payload,
  };

  if (!store.themes[store.styleConfig.theme]) {
    store.styleConfig.theme = store.activeThemeKey;
  }
  store.persistPreferences();
}

/** 偏好操作实现。 */
export function setTheme(store: LayoutPreferenceActionContext, themeKey: string): void {
  if (!store.themes[themeKey]) {
    return;
  }
  store.styleConfig.theme = themeKey;
  store.persistPreferences();
}

/** 偏好操作实现。 */
export function setThemeSwitchEnabled(store: LayoutPreferenceActionContext, enabled: boolean): void {
  store.enableThemeSwitch = enabled;
}

/** 偏好操作实现。 */
export function setActiveTopMenuKey(store: LayoutPreferenceActionContext, key: string): void {
  store.activeTopMenuKey = key;
  store.persistPreferences();
}

/** 偏好操作实现。 */
export function syncActiveTopMenuByPath(store: LayoutPreferenceActionContext, path: string): void {
  if (store.navigation.sideMenu.length === 0) {
    store.activeTopMenuKey = '';
    return;
  }

  const matched = store.navigation.sideMenu.find((item) => containsPathInMenu(item, path));
  if (matched) {
    store.activeTopMenuKey = matched.key;
  } else if (!store.activeTopMenuKey) {
    store.activeTopMenuKey = store.navigation.sideMenu[0].key;
  }

  store.persistPreferences();
}

/** 偏好操作实现。 */
export function setLayoutExtensions(
  store: LayoutPreferenceActionContext,
  payload: LayoutExtensionComponents = {},
): void {
  const markedExtensions: LayoutExtensionComponents = {};
  for (const [key, component] of Object.entries(payload)) {
    if (component) {
      markedExtensions[key as keyof LayoutExtensionComponents] = markRaw(component);
    }
  }
  store.layoutExtensions = markedExtensions;
}

/** 偏好操作实现。 */
export function setLoginExtensions(store: LayoutPreferenceActionContext, payload: LoginExtensionComponents = {}): void {
  const markedExtensions: LoginExtensionComponents = {};
  for (const [key, component] of Object.entries(payload)) {
    if (component) {
      markedExtensions[key as keyof LoginExtensionComponents] = markRaw(component);
    }
  }
  store.loginExtensions = markedExtensions;
}
/** 偏好操作实现。 */
export function resetToDefaults(store: LayoutPreferenceActionContext): void {
  store.styleConfig = { ...defaultLayoutStyleConfig };
  store.persistPreferences();
}

/** 偏好操作实现。 */
export function hydrateLegacyLayoutConfig(store: LayoutPreferenceActionContext): void {
  if (typeof window === 'undefined') {
    return;
  }

  const raw = window.localStorage.getItem('mfw:layout:config');
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LayoutStyleConfig>;
    store.styleConfig = {
      ...store.styleConfig,
      ...parsed,
    };
  } catch {
    // ?????????????
  }
}

/** 偏好操作实现。 */
export function persistLegacyLayoutConfig(styleConfig: LayoutStyleConfig): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem('mfw:layout:config', JSON.stringify(styleConfig));
}
