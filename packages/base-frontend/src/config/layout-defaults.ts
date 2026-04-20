/**
 * @fileoverview 默认布局与主题配置。
 */

import type {
  AdminNavigationConfig,
  LayoutStyleConfig,
  ThemeRegistry,
  ThemeTokenPalette,
  ThemeTokens,
} from '../types/layout-types';

/** 默认配置说明。 */
function createPalette(light: ThemeTokens, dark: ThemeTokens): ThemeTokenPalette {
  return { light, dark };
}

/** 默认配置说明。 */
const auroraLight: ThemeTokens = {
  appBackground: '#f5f7fa',
  surfaceBackground: '#ffffff',
  borderColor: '#e5e7eb',
  textColor: '#1f2937',
  mutedTextColor: '#6b7280',
  primaryColor: '#3b82f6',
  headerGradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
  headerTextColor: '#ffffff',
  cardShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
};

/** 默认配置说明。 */
const auroraDark: ThemeTokens = {
  appBackground: '#0f172a',
  surfaceBackground: '#1e293b',
  borderColor: '#334155',
  textColor: '#f1f5f9',
  mutedTextColor: '#94a3b8',
  primaryColor: '#60a5fa',
  headerGradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%)',
  headerTextColor: '#f8fafc',
  cardShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

/** 默认配置说明。 */
const oceanLight: ThemeTokens = {
  appBackground: '#f0fdfa',
  surfaceBackground: '#ffffff',
  borderColor: '#e5e7eb',
  textColor: '#1f2937',
  mutedTextColor: '#6b7280',
  primaryColor: '#14b8a6',
  headerGradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #5eead4 100%)',
  headerTextColor: '#ffffff',
  cardShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
};

/** 默认配置说明。 */
const oceanDark: ThemeTokens = {
  appBackground: '#0f172a',
  surfaceBackground: '#1e293b',
  borderColor: '#334155',
  textColor: '#f1f5f9',
  mutedTextColor: '#94a3b8',
  primaryColor: '#5eead4',
  headerGradient: 'linear-gradient(135deg, #0f172a 0%, #115e59 50%, #14b8a6 100%)',
  headerTextColor: '#f8fafc',
  cardShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

/** 默认配置说明。 */
const graphiteLight: ThemeTokens = {
  appBackground: '#f9fafb',
  surfaceBackground: '#ffffff',
  borderColor: '#e5e7eb',
  textColor: '#1f2937',
  mutedTextColor: '#6b7280',
  primaryColor: '#6b7280',
  headerGradient: 'linear-gradient(135deg, #374151 0%, #6b7280 50%, #9ca3af 100%)',
  headerTextColor: '#ffffff',
  cardShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
};

/** 默认配置说明。 */
const graphiteDark: ThemeTokens = {
  appBackground: '#0f172a',
  surfaceBackground: '#1e293b',
  borderColor: '#334155',
  textColor: '#f1f5f9',
  mutedTextColor: '#94a3b8',
  primaryColor: '#9ca3af',
  headerGradient: 'linear-gradient(135deg, #0f172a 0%, #374151 50%, #6b7280 100%)',
  headerTextColor: '#f8fafc',
  cardShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

/** 默认配置说明。 */
export const defaultThemeRegistry: ThemeRegistry = {
  aurora: { label: '\u6781\u5149\u84dd', tokens: createPalette(auroraLight, auroraDark) },
  ocean: { label: '\u6d77\u6d0b\u7eff', tokens: createPalette(oceanLight, oceanDark) },
  graphite: { label: '\u77f3\u58a8\u7070', tokens: createPalette(graphiteLight, graphiteDark) },
};

/** 默认配置说明。 */
export const defaultLayoutStyleConfig: LayoutStyleConfig = {
  theme: 'aurora',
  layoutMode: 'sidebar',
  sidebarWidth: 236,
  headerHeight: 64,
  contentMaxWidth: 1360,
  compact: false,
  fixedHeader: true,
  showBreadcrumb: true,
  showTabs: true,
  cardRadius: 8,
};

/** 默认配置说明。 */
export const defaultNavigationConfig: AdminNavigationConfig = {
  brandName: '\u58a8\u7814\u7ba1\u7406\u540e\u53f0',
  brandTagline: '\u524d\u7aef\u57fa\u7840\u6846\u67b6',
  homePath: '/dashboard',
  topNav: [
    { key: 'guide', label: '\u63a5\u5165\u6307\u5357', href: 'https://www.vben.pro/#/analytics' },
    { key: 'docs', label: '\u5e03\u5c40\u793a\u4f8b', to: '/dashboard' },
  ],
  sideMenu: [
    { key: 'dashboard', label: '\u9996\u9875', to: '/dashboard', icon: 'DataBoard', order: 1 },
    {
      key: 'exceptions',
      label: '\u5f02\u5e38\u9875\u9762',
      to: '/403',
      icon: 'WarningFilled',
      order: 90,
      children: [
        { key: 'forbidden', label: '\u6743\u9650\u4e0d\u8db3', to: '/403', icon: 'Lock', order: 1 },
        { key: 'missing', label: '\u9875\u9762\u4e0d\u5b58\u5728', to: '/404', icon: 'CircleCloseFilled', order: 2 },
      ],
    },
  ],
};

/** 默认配置说明。 */
export const defaultThemeKey = 'aurora';
