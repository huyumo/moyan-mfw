/**
 * @fileoverview 本地存储键名统一管理
 * @description 所有 localStorage / sessionStorage 的键名集中定义，禁止在业务代码中硬编码字符串
 */

export const TOKEN_KEY = 'mfw:admin:token';
export const REFRESH_TOKEN_KEY = 'mfw:admin:refresh_token';
export const CURRENT_APP_KEY = 'mfw:admin:current_app';
export const LEGACY_ACCESS_TOKEN_KEY = 'access_token';

export const LAYOUT_PREFERENCES_KEY = 'mfw:base-frontend:layout-preferences';
export const LAYOUT_TABS_KEY = 'mfw:base-frontend:layout-tabs';
export const LAYOUT_LEGACY_CONFIG_KEY = 'mfw:layout:config';
