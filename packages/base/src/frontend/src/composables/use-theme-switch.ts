/**
 * @fileoverview 主题切换组合式函数。
 * 提供主题包的读取、设置和应用功能。
 */

import { computed } from 'vue';
import { useLayoutStore } from '../../store/layout-store';
import { themeRegistry, defaultThemeKey, getTheme, getAvailableThemes } from '../../themes';
import type { ThemeColors } from '../../types/theme-types';

const LIGHT_LEVELS = [3, 5, 7, 8, 9] as const;
const DARK_LEVELS = [2] as const;

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixWithWhite(color: string, level: number): string {
  const rgb = hexToRgb(color);
  const ratio = level / 10;
  const mixed = rgb.map((c) => Math.round(255 * ratio + c * (1 - ratio))) as [number, number, number];
  return rgbToHex(mixed[0], mixed[1], mixed[2]);
}

function mixWithBlack(color: string, level: number): string {
  const rgb = hexToRgb(color);
  const ratio = level / 10;
  const mixed = rgb.map((c) => Math.round(c * (1 - ratio))) as [number, number, number];
  return rgbToHex(mixed[0], mixed[1], mixed[2]);
}

export function useThemeSwitch() {
  const layoutStore = useLayoutStore();

  const applyThemeColors = (colors: ThemeColors) => {
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
      if (key === 'gradient') {
        root.style.setProperty('--el-color-primary-gradient', value);
        root.style.setProperty('--mfw-gradient-primary', value);
        return;
      }

      root.style.setProperty(`--el-color-${key}`, value);

      LIGHT_LEVELS.forEach((level) => {
        const lightColor = mixWithWhite(value, level);
        root.style.setProperty(`--el-color-${key}-light-${level}`, lightColor);
      });

      DARK_LEVELS.forEach((level) => {
        const darkColor = mixWithBlack(value, level);
        root.style.setProperty(`--el-color-${key}-dark-${level}`, darkColor);
      });
    });

    const hasGradient = colors.gradient;
    root.classList.toggle('mfw-theme-gradient', Boolean(hasGradient));
  };

  const setTheme = (themeName: string) => {
    const theme = getTheme(themeName);
    if (!theme) {
      console.warn(`Theme "${themeName}" not found, fallback to default theme`);
      layoutStore.styleConfig.themePackage = defaultThemeKey;
      const defaultTheme = getTheme(defaultThemeKey);
      if (defaultTheme) {
        applyThemeColors(defaultTheme.colors);
      }
      return;
    }

    layoutStore.styleConfig.themePackage = themeName;
    applyThemeColors(theme.colors);
  };

  const currentTheme = computed(() => {
    const name = layoutStore.styleConfig.themePackage;
    return getTheme(name);
  });

  const availableThemes = computed(() => getAvailableThemes());

  const initTheme = () => {
    const savedTheme = layoutStore.styleConfig.themePackage;
    setTheme(savedTheme);
  };

  return {
    setTheme,
    currentTheme,
    availableThemes,
    initTheme,
    themeRegistry,
    defaultThemeKey,
  };
}