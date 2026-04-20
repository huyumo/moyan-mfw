import defaultTheme from './packages/default/manifest.json';
import oceanTheme from './packages/ocean/manifest.json';
import graphiteTheme from './packages/graphite/manifest.json';

import type { ThemeRegistry } from '../types/theme-types';

export const themeRegistry: ThemeRegistry = {
  default: defaultTheme,
  ocean: oceanTheme,
  graphite: graphiteTheme,
};

export const defaultThemeKey = 'default';

export function getTheme(name: string) {
  return themeRegistry[name] || themeRegistry[defaultThemeKey];
}

export function getAvailableThemes() {
  return Object.values(themeRegistry);
}