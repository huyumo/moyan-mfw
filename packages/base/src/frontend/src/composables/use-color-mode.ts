/**
 * @fileoverview 颜色模式切换组合式函数。
 * 基于 VueUse useDark 实现，支持 light/dark 两种模式。
 * 使用 View Transitions API 实现平滑过渡动画。
 * 持久化统一使用 layout-store 的 storage key。
 */

import { usePreferredDark } from '@vueuse/core';
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

function applyDarkMode(isDark: boolean) {
  const html = document.documentElement;
  if (isDark) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

export function useColorMode() {
  const layoutStore = useLayoutStore();
  const prefersDark = usePreferredDark();

  const colorMode = computed<ColorMode>(() => layoutStore.styleConfig.colorMode);
  const isDark = computed<boolean>(() => colorMode.value === 'dark');

  const initColorMode = () => {
    const savedMode = layoutStore.styleConfig.colorMode;
    const resolved = savedMode === 'dark';
    applyDarkMode(resolved);

    watch(
      () => layoutStore.styleConfig.colorMode,
      (mode) => {
        const isDark = mode === 'dark';
        withViewTransition(() => {
          applyDarkMode(isDark);
        });
      },
      { flush: 'sync' }
    );
  };

  const setColorMode = (mode: ColorMode, options?: { persist?: boolean }) => {
    const shouldPersist = options?.persist !== false;
    layoutStore.styleConfig.colorMode = mode;

    if (shouldPersist) {
      layoutStore.persistPreferences();
    }
  };

  const toggleDark = () => {
    const newMode: ColorMode = isDark.value ? 'light' : 'dark';
    layoutStore.styleConfig.colorMode = newMode;
    layoutStore.persistPreferences();
  };

  return {
    isDark,
    prefersDark,
    colorMode,
    toggleDark,
    setColorMode,
    initColorMode,
  };
}