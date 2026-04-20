/**
 * @fileoverview 主题切换组合式函数。
 * 提供主题包的读取、设置和应用功能。
 */

import { computed } from 'vue';
import { useLayoutStore } from '../store/layout-store';
import { themeRegistry, defaultThemeKey, getTheme, getAvailableThemes } from '../themes';
import type { ThemeColors } from '../types/theme-types';

/**
 * 主题切换组合式函数。
 * 提供主题包的管理和 CSS 变量应用功能。
 */
export function useThemeSwitch() {
  const layoutStore = useLayoutStore();

  /**
   * 应用主题颜色到 CSS 变量。
   * @param colors - 主题颜色配置
   */
  const applyThemeColors = (colors: ThemeColors) => {
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--el-color-${key}`, value);
    });
  };

  /**
   * 设置当前主题。
   * @param themeName - 主题名称
   */
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

  /**
   * 当前主题。
   */
  const currentTheme = computed(() => {
    const name = layoutStore.styleConfig.themePackage;
    return getTheme(name);
  });

  /**
   * 可用主题列表。
   */
  const availableThemes = computed(() => getAvailableThemes());

  /**
   * 初始化主题。
   * 根据保存的设置初始化当前主题。
   */
  const initTheme = () => {
    const savedTheme = layoutStore.styleConfig.themePackage;
    setTheme(savedTheme);
  };

  return {
    /** 设置当前主题 */
    setTheme,
    /** 当前主题 */
    currentTheme,
    /** 可用主题列表 */
    availableThemes,
    /** 初始化主题 */
    initTheme,
    /** 主题注册表 */
    themeRegistry,
    /** 默认主题键 */
    defaultThemeKey,
  };
}