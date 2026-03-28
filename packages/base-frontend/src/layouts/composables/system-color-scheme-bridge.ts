/**
 * @fileoverview 系统色彩模式桥接，负责监听系统深浅色并同步到布局配置。
 */
import { ref } from 'vue';
import type { LayoutStyleConfig } from '../../types/layout-types';

interface SystemColorSchemeStore {
  styleConfig: LayoutStyleConfig;
  patchStyleConfig: (payload: Partial<LayoutStyleConfig>, options?: { persist?: boolean }) => void;
}

/** 创建系统色彩模式桥接器。 */
export function createSystemColorSchemeBridge(layoutStore: SystemColorSchemeStore) {
  const systemPrefersDark = ref(false);
  let media: MediaQueryList | null = null;
  const handleChange = (event: MediaQueryListEvent) => {
    systemPrefersDark.value = event.matches;
    if (layoutStore.styleConfig.colorScheme === 'system') {
      layoutStore.patchStyleConfig({ isDark: event.matches }, { persist: false });
    }
  };
  function sync() {
    if (layoutStore.styleConfig.colorScheme !== 'system') {
      return;
    }
    layoutStore.patchStyleConfig({ isDark: systemPrefersDark.value }, { persist: false });
  }
  function start() {
    if (typeof window === 'undefined') {
      return;
    }
    media = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark.value = media.matches;
    media.addEventListener('change', handleChange);
    sync();
  }
  function stop() {
    if (!media) {
      return;
    }
    media.removeEventListener('change', handleChange);
    media = null;
  }
  return {
    systemPrefersDark,
    syncSystemColorScheme: sync,
    startSystemColorSchemeWatch: start,
    stopSystemColorSchemeWatch: stop,
  };
}
