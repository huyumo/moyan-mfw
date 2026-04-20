/**
 * @fileoverview 颜色模式切换组合式函数。
 * 基于 VueUse useDark 实现，支持 light/dark/system 三种模式。
 * 使用 View Transitions API 实现平滑过渡动画。
 */

import { useDark, usePreferredDark } from '@vueuse/core';
import { watch, computed } from 'vue';
import { useLayoutStore } from '../store/layout-store';
import type { ColorMode } from '../types/color-mode-types';

/**
 * 设置动画起始位置（用于圆形擦除效果）。
 * @param event - 鼠标/触摸事件
 */
function setViewTransitionOrigin(event?: MouseEvent | TouchEvent) {
  if (!event) {
    document.documentElement.style.removeProperty('--view-x');
    document.documentElement.style.removeProperty('--view-y');
    return;
  }

  const x = 'clientX' in event ? event.clientX : event.touches?.[0]?.clientX ?? window.innerWidth / 2;
  const y = 'clientY' in event ? event.clientY : event.touches?.[0]?.clientY ?? window.innerHeight / 2;

  document.documentElement.style.setProperty('--view-x', `${x}px`);
  document.documentElement.style.setProperty('--view-y', `${y}px`);
}

/**
 * 使用 View Transitions API 执行带动画的 DOM 更新。
 * 如果浏览器不支持 View Transitions，则直接执行回调。
 * @param callback - 要执行的 DOM 更新回调
 * @param event - 可选的触发事件，用于设置动画起始位置
 * @param targetMode - 目标模式，用于设置动画方向
 */
function withViewTransition(
  callback: () => void,
  event?: MouseEvent | TouchEvent,
  targetMode?: 'light' | 'dark'
) {
  setViewTransitionOrigin(event);

  if (!document.startViewTransition) {
    callback();
    return;
  }

  if (targetMode) {
    document.documentElement.classList.add(
      targetMode === 'dark' ? 'transition-to-dark' : 'transition-to-light'
    );
  }

  const transition = document.startViewTransition(callback);

  transition.finished.finally(() => {
    document.documentElement.classList.remove('transition-to-dark', 'transition-to-light');
  });
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
   * @param event - 触发事件，用于确定动画起始位置
   */
  const toggleDark = (event?: MouseEvent | TouchEvent) => {
    const targetMode = isDark.value ? 'light' : 'dark';
    withViewTransition(() => {
      isDark.value = !isDark.value;
    }, event, targetMode);
  };

  /**
   * 当前颜色模式。
   */
  const colorMode = computed<ColorMode>(() => layoutStore.styleConfig.colorMode);

  /**
   * 设置颜色模式（带过渡动画）。
   * @param mode - 目标颜色模式
   * @param event - 触发事件，用于确定动画起始位置
   */
  const setColorMode = (mode: ColorMode, event?: MouseEvent | TouchEvent) => {
    layoutStore.styleConfig.colorMode = mode;

    let targetMode: 'light' | 'dark' | undefined;
    if (mode === 'dark') {
      targetMode = 'dark';
    } else if (mode === 'light') {
      targetMode = 'light';
    }

    withViewTransition(() => {
      if (mode === 'system') {
        isDark.value = prefersDark.value;
      } else if (mode === 'dark') {
        isDark.value = true;
      } else {
        isDark.value = false;
      }
    }, event, targetMode);
  };

  /**
   * 监听系统偏好变化。
   * 当颜色模式为 system 时，自动同步系统偏好。
   */
  watch(prefersDark, (newValue) => {
    if (layoutStore.styleConfig.colorMode === 'system') {
      withViewTransition(() => {
        isDark.value = newValue;
      });
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