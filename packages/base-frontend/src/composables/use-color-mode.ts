/**
 * @fileoverview 颜色模式切换组合式函数。
 * 基于 VueUse useDark 实现，支持 light/dark/system 三种模式。
 */

import { useDark, usePreferredDark, useToggle } from '@vueuse/core';
import { watch, computed } from 'vue';
import { useLayoutStore } from '../store/layout-store';
import type { ColorMode } from '../types/color-mode-types';

/**
 * 颜色模式切换组合式函数。
 * 提供颜色模式的读取、设置和切换功能。
 */
export function useColorMode() {
  const layoutStore = useLayoutStore();

  /**
   * 当前是否为暗色模式。
   * 基于 VueUse useDark，自动同步到 html 元素的 class。
   */
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
  });

  /**
   * 系统偏好暗色模式。
   */
  const prefersDark = usePreferredDark();

  /**
   * 切换暗色模式。
   */
  const toggleDark = useToggle(isDark);

  /**
   * 当前颜色模式。
   */
  const colorMode = computed<ColorMode>(() => layoutStore.styleConfig.colorMode);

  /**
   * 设置颜色模式。
   * @param mode - 目标颜色模式
   */
  const setColorMode = (mode: ColorMode) => {
    layoutStore.styleConfig.colorMode = mode;

    if (mode === 'system') {
      isDark.value = prefersDark.value;
    } else if (mode === 'dark') {
      isDark.value = true;
    } else {
      isDark.value = false;
    }
  };

  /**
   * 监听系统偏好变化。
   * 当颜色模式为 system 时，自动同步系统偏好。
   */
  watch(prefersDark, (newValue) => {
    if (layoutStore.styleConfig.colorMode === 'system') {
      isDark.value = newValue;
    }
  });

  /**
   * 初始化颜色模式。
   * 根据保存的设置初始化当前颜色模式。
   */
  const initColorMode = () => {
    const savedMode = layoutStore.styleConfig.colorMode;
    setColorMode(savedMode);
  };

  return {
    /** 当前是否为暗色模式 */
    isDark,
    /** 系统偏好暗色模式 */
    prefersDark,
    /** 当前颜色模式 */
    colorMode,
    /** 切换暗色模式 */
    toggleDark,
    /** 设置颜色模式 */
    setColorMode,
    /** 初始化颜色模式 */
    initColorMode,
  };
}