/**
 * @fileoverview 布局组合逻辑。
 */
import { ElMessage } from 'element-plus';
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router';
import { ApiAuthLogout } from '../../apis/sys';
import { useLayoutStore } from '../../store/layout-store';
import { useAuthStore } from '../../store/auth-store';
import { resetRouteGuard } from '../../router/guard';
import { getAvailableThemes, themeRegistry } from '../../themes';
import type { LayoutMode, LayoutStyleConfig, SideMenuItem } from '../../types/layout-types';
/**
 * 布局组合逻辑入口。
 */
export function useAdminLayout(): any {
  const layoutStore = useLayoutStore();
  const route = useRoute();
  const router = useRouter();
  const mobileMenuOpen = ref(false);
  const resetConfirmVisible = ref(false);
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const settingsSnapshot = ref<LayoutStyleConfig | null>(null);
  const skipSettingsRollback = ref(false);
  const isMobile = computed(() => windowWidth.value < 768);
  const layoutModeOptions: Array<{ label: string; value: LayoutMode }> = [
    { label: '侧边栏', value: 'sidebar' },
    { label: '顶部菜单', value: 'top' },
    { label: '双栏菜单', value: 'dual' },
  ];
  const themeOptions = computed(() => getAvailableThemes());
  const shellClasses = computed(() => ({
    'is-compact': layoutStore.styleConfig.compact && layoutStore.showSidebar,
    'layout-mode-sidebar': layoutStore.styleConfig.layoutMode === 'sidebar',
    'layout-mode-top': layoutStore.styleConfig.layoutMode === 'top',
    'layout-mode-dual': layoutStore.styleConfig.layoutMode === 'dual',
  }));
  const currentTitle = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : '\u4eea\u8868\u76d8'));
  const topLevelMenus = computed(() => layoutStore.navigation.sideMenu);
  const activeTopMenuKey = computed(() => layoutStore.activeTopMenuKey || topLevelMenus.value[0]?.key || '');
  const activeTopMenu = computed(
    () =>
      topLevelMenus.value.find((item: SideMenuItem) => item.key === activeTopMenuKey.value) || topLevelMenus.value[0],
  );
  const showPrimaryTopMenus = computed(() => layoutStore.styleConfig.layoutMode !== 'sidebar');
  const displayedSideMenus = computed(() => {
    if (layoutStore.styleConfig.layoutMode === 'top') {
      return [];
    }
    if (layoutStore.styleConfig.layoutMode === 'dual') {
      const current = activeTopMenu.value;
      if (!current) {
        return [];
      }
      return current.children && current.children.length > 0 ? current.children : [current];
    }
    return topLevelMenus.value;
  });
  const activeMenuPath = computed(() => resolveMenuActivePath(displayedSideMenus.value, route.path) || route.path);
  const activeTabPath = computed({
    get: () => layoutStore.activeTabPath,
    set: (path: string) => {
      layoutStore.setActiveTab(path);
      if (path !== route.fullPath) {
        router.push(path);
      }
    },
  });
  function resolveMenuPath(to?: RouteLocationRaw): string {
    if (!to) {
      return '';
    }
    if (typeof to === 'string') {
      return to;
    }
    if ('path' in to && to.path) {
      return to.path;
    }
    return '';
  }
  function resolveFirstLeafPath(item: SideMenuItem): string {
    if (item.children && item.children.length > 0) {
      return resolveFirstLeafPath(item.children[0]);
    }
    return resolveMenuPath(item.to) || '/dashboard';
  }
  function resolveMenuActivePath(items: SideMenuItem[], path: string): string {
    let matchedPath = '';
    for (const item of items) {
      const currentPath = resolveMenuPath(item.to);
      if (currentPath && (path === currentPath || path.startsWith(`${currentPath}/`))) {
        if (!matchedPath || currentPath.length > matchedPath.length) {
          matchedPath = currentPath;
        }
      }
      if (item.children && item.children.length > 0) {
        const childMatched = resolveMenuActivePath(item.children, path);
        if (childMatched && (!matchedPath || childMatched.length > matchedPath.length)) {
          matchedPath = childMatched;
        }
      }
    }
    return matchedPath;
  }
  function handleTopMenuClick(item: SideMenuItem) {
    layoutStore.setActiveTopMenuKey(item.key);
    const targetPath = resolveFirstLeafPath(item);
    if (targetPath && targetPath !== route.path) {
      router.push(targetPath);
    }
  }
  function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value;
  }
  function handleResetDefaults() {
    resetConfirmVisible.value = true;
  }
  function confirmResetDefaults() {
    skipSettingsRollback.value = true;
    layoutStore.resetToDefaults();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mfw:layout:config', JSON.stringify(layoutStore.styleConfig));
    }
    layoutStore.toggleSettingsPanel(false);
    resetConfirmVisible.value = false;
    ElMessage.success('\u5df2\u6062\u590d\u9ed8\u8ba4\u8bbe\u7f6e');
  }
  function removeTab(name: string | number) {
    const nextPath = layoutStore.closeTab(String(name));
    if (nextPath && nextPath !== route.fullPath) {
      router.push(nextPath);
    }
  }
  function handleTabCommand(command: string | number | object) {
    const currentPath = route.fullPath;
    const action = String(command);
    let nextPath = currentPath;
    if (action === 'closeCurrent') {
      nextPath = layoutStore.closeTab(currentPath);
    } else if (action === 'closeLeft') {
      nextPath = layoutStore.closeTabsLeft(currentPath);
    } else if (action === 'closeRight') {
      nextPath = layoutStore.closeTabsRight(currentPath);
    } else if (action === 'closeOther') {
      nextPath = layoutStore.closeOtherTabs(currentPath);
    } else if (action === 'closeAll') {
      nextPath = layoutStore.closeAllTabs();
    }
    if (nextPath && nextPath !== route.fullPath) {
      router.push(nextPath);
    }
  }
  async function handleUserCommand(command: string | number | object) {
    const action = String(command);
    if (action === 'logout') {
      // 1. 先重置路由守卫状态，防止路由循环
      resetRouteGuard();
      // 2. 清除 Token（直接操作 localStorage，避免响应式延迟）
      localStorage.removeItem('mfw:admin:token');
      localStorage.removeItem('mfw:admin:refresh_token');
      localStorage.removeItem('mfw:admin:current_app');
      // 3. 获取 store 实例
      const authStore = useAuthStore();
      // 4. 调用 API（可选，不阻塞）
      authStore.logout().catch(() => {});
      // 5. 清除 store 状态
      authStore.clearToken();
      // 6. 强制刷新到登录页（使用 location.href 避免路由冲突）
      window.location.href = '/login';
      return;
    }
    if (action === 'settings') {
      layoutStore.toggleSettingsPanel(true);
      return;
    }
    router.push('/dashboard');
  }
  function handlePreviewChange(payload: Partial<LayoutStyleConfig>) {
    layoutStore.patchStyleConfig(payload, { persist: false });
  }
  function handleSaveSettings(payload: LayoutStyleConfig) {
    skipSettingsRollback.value = true;
    layoutStore.patchStyleConfig(payload, { persist: false });
    layoutStore.persistPreferences();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mfw:layout:config', JSON.stringify(layoutStore.styleConfig));
    }
    layoutStore.toggleSettingsPanel(false);
    ElMessage.success('\u504f\u597d\u8bbe\u7f6e\u5df2\u4fdd\u5b58');
  }
  function getThemeColor(themeKey: string): string {
    const theme = themeRegistry[themeKey];
    if (!theme) {
      return 'var(--el-color-primary)';
    }
    return theme.colors.primary;
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      windowWidth.value = window.innerWidth;
    });
  }
  watch(
    () => route.fullPath,
    () => {
      mobileMenuOpen.value = false;
      layoutStore.syncActiveTopMenuByPath(route.path);
      layoutStore.syncRouteTab(route);
    },
    { immediate: true },
  );
  watch(
    () => layoutStore.settingsPanelOpen,
    (isOpen, wasOpen) => {
      if (isOpen) {
        settingsSnapshot.value = { ...layoutStore.styleConfig };
        skipSettingsRollback.value = false;
        return;
      }
      if (!wasOpen) {
        return;
      }
      if (skipSettingsRollback.value) {
        skipSettingsRollback.value = false;
        settingsSnapshot.value = null;
        return;
      }
      if (settingsSnapshot.value) {
        layoutStore.patchStyleConfig(settingsSnapshot.value, { persist: false });
      }
      settingsSnapshot.value = null;
    },
  );
  onMounted(() => {
    const savedConfig = typeof window !== 'undefined' ? window.localStorage.getItem('mfw:layout:config') : null;
    if (savedConfig) {
      try {
        layoutStore.patchStyleConfig(JSON.parse(savedConfig), { persist: true });
      } catch {
      }
    }
  });
  return {
    layoutStore,
    mobileMenuOpen,
    resetConfirmVisible,
    isMobile,
    layoutModeOptions,
    themeOptions,
    shellClasses,
    currentTitle,
    topLevelMenus,
    activeTopMenuKey,
    showPrimaryTopMenus,
    displayedSideMenus,
    activeMenuPath,
    activeTabPath,
    handleTopMenuClick,
    toggleMobileMenu,
    handleResetDefaults,
    confirmResetDefaults,
    removeTab,
    handleTabCommand,
    handleUserCommand,
    handlePreviewChange,
    handleSaveSettings,
    getThemeColor,
  };
}
