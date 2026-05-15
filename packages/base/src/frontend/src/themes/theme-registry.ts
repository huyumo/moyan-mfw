import defaultTheme from './packages/default/manifest.json';
import oceanTheme from './packages/ocean/manifest.json';
import graphiteTheme from './packages/graphite/manifest.json';
import fintechTheme from './packages/fintech/manifest.json';
import techTheme from './packages/tech/manifest.json';
import luxuryTheme from './packages/luxury/manifest.json';
import natureTheme from './packages/nature/manifest.json';
import auroraTheme from './packages/aurora/manifest.json';
import sunsetTheme from './packages/sunset/manifest.json';

import type { ThemeRegistry } from '../types/theme-types';

export const themeRegistry: ThemeRegistry = {
  default: defaultTheme,
  ocean: oceanTheme,
  graphite: graphiteTheme,
  fintech: fintechTheme,
  tech: techTheme,
  luxury: luxuryTheme,
  nature: natureTheme,
  aurora: auroraTheme,
  sunset: sunsetTheme,
};

export const defaultThemeKey = 'default';

export function getTheme(name: string) {
  return themeRegistry[name] || themeRegistry[defaultThemeKey];
}

export function getAvailableThemes() {
  return Object.values(themeRegistry);
}