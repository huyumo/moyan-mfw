/**
 * @fileoverview 颜色模式切换组合式函数。
 * 基于 VueUse useDark 实现，支持 light/dark/system 三种模式。
 * 使用 View Transitions API 实现平滑过渡动画。
 */

import { useDark, usePreferredDark } from '@vueuse/core';
import { watch, computed } from 'vue';
import { useLayoutStore } from '../store/layout-store';
import type { ColorMode } from '../types/color-mode-types';

let transitionInProgress = false;

function calculateEndRadius(): number {
  const { innerWidth, innerHeight } = window;
  return Math.hypot(innerWidth, innerHeight);
}

function withViewTransition(callback: () => void) {
  if (transitionInProgress) {
    callback();
    return;
  }

  if (!document.startViewTransition) {
    callback();
    return;
  }

  const x = window.innerWidth;
  const y = 0;
  const endRadius = calculateEndRadius();

  transitionInProgress = true;
  const transition = document.startViewTransition(callback);

  transition.ready
    .then(() => {
      const isDark = document.documentElement.classList.contains('dark');
      const clipPathFrom = `circle(0px at ${x}px ${y}px)`;
      const clipPathTo = `circle(${endRadius}px at ${x}px ${y}px)`;

      document.documentElement.animate(
        {
          clipPath: isDark ? [clipPathTo, clipPathFrom] : [clipPathFrom, clipPathTo]
        },
        {
          duration: 450,
          easing: 'ease-in',
          fill: 'forwards',
          pseudoElement: isDark ? '::view-transition-old(root)' : '::view-transition-new(root)'
        }
      );
    })
    .catch(() => {})
    .finally(() => {
      transitionInProgress = false;
    });

  transition.finished.catch(() => {});
}

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
   * 切换暗色模式（带过渡动画）。
   * 同时更新 colorMode 并持久化。
   */
  const toggleDark = () => {
    const currentMode = layoutStore.styleConfig.colorMode;
    const newIsDark = !isDark.value;

    withViewTransition(() => {
      isDark.value = newIsDark;
    });

    if (currentMode === 'system') {
      layoutStore.styleConfig.colorMode = newIsDark ? 'dark' : 'light';
    } else {
      layoutStore.styleConfig.colorMode = newIsDark ? 'dark' : 'light';
    }
    layoutStore.persistPreferences();
  };

  /**
   * 当前颜色模式。
   */
  const colorMode = computed<ColorMode>(() => layoutStore.styleConfig.colorMode);

  /**
   * 设置颜色模式（带过渡动画）。
   * 同时持久化到 localStorage。
   * @param mode - 目标颜色模式
   */
  const setColorMode = (mode: ColorMode) => {
    layoutStore.styleConfig.colorMode = mode;

    withViewTransition(() => {
      if (mode === 'system') {
        isDark.value = prefersDark.value;
      } else if (mode === 'dark') {
        isDark.value = true;
      } else {
        isDark.value = false;
      }
    });

    layoutStore.persistPreferences();
  };

  /**
   * 监听系统偏好变化。
   * 当颜色模式为 system 时，自动同步系统偏好并持久化。
   */
  watch(prefersDark, (newValue, oldValue) => {
    if (layoutStore.styleConfig.colorMode === 'system') {
      if (oldValue === undefined) {
        isDark.value = newValue;
        return;
      }
      withViewTransition(() => {
        isDark.value = newValue;
      });
      layoutStore.persistPreferences();
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