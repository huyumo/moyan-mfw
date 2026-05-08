<!--
/**
 * @fileoverview 鐢啫鐪€圭懓娅掔紒鍕閵? */
-->
<template>
  <div class="mfw-admin-shell" :class="shellClasses">
    <HeaderPanel :fixed-header="layoutStore.styleConfig.fixedHeader" :show-sidebar="layoutStore.showSidebar"
      :compact="layoutStore.styleConfig.compact" :brand-name="headerBrandName"
      :brand-tagline="headerBrandTagline" :show-app-switcher="showAppSwitcher"
      :show-primary-top-menus="showPrimaryTopMenus" :top-level-menus="topLevelMenus"
      :active-top-menu-key="activeTopMenuKey" :top-nav="layoutStore.navigation.topNav"
      :layout-extensions="layoutStore.layoutExtensions" @toggle-mobile-menu="toggleMobileMenu"
      @toggle-compact="layoutStore.toggleCompact()" @top-menu-click="handleTopMenuClick"
      @sub-menu-click="handleSubMenuClick"
      @open-settings="layoutStore.toggleSettingsPanel(true)" @user-command="handleUserCommand"
      @brand-click="openAppDrawer">
      <template v-if="$slots['header-common']" #header-common>
        <slot name="header-common" />
      </template>
      <template v-if="$slots['header-avatar']" #header-avatar>
        <slot name="header-avatar" />
      </template>
      <template v-if="$slots['header-user-menu']" #header-user-menu>
        <slot name="header-user-menu" />
      </template>
    </HeaderPanel>

    <div class="mfw-admin-main">
      <AsidePanel :show-sidebar="layoutStore.showSidebar" :mobile-menu-open="mobileMenuOpen"
        :compact="layoutStore.styleConfig.compact" :active-menu-path="activeMenuPath"
        :displayed-side-menus="displayedSideMenus"
        :no-apps="noApps">
        <template v-if="$slots['sidebar-footer']" #sidebar-footer>
          <slot name="sidebar-footer" />
        </template>
      </AsidePanel>

      <MainPanel v-model="activeTabPath" :show-tabs="layoutStore.styleConfig.showTabs"
        :visited-tabs="layoutStore.visitedTabs" @tab-remove="removeTab" @tab-command="handleTabCommand">
        <NoAppsEmpty v-if="noApps" :brand-name="layoutStore.navigation.brandName"
          @logout="authStore.logout()" />
        <router-view v-else-if="layoutStore.styleConfig.keepAlive" v-slot="{ Component, route: slotRoute }">
          <keep-alive :max="20">
            <component :is="Component" :key="slotRoute.fullPath" />
          </keep-alive>
        </router-view>
        <router-view v-else v-slot="{ Component, route: slotRoute }">
          <component :is="Component" :key="slotRoute.fullPath" />
        </router-view>
      </MainPanel>
    </div>

    <SettingsPanel v-model="layoutStore.settingsPanelOpen" :is-mobile="isMobile"
      :layout-mode-options="layoutModeOptions" :theme-options="themeOptions" :style-config="layoutStore.styleConfig"
      :get-theme-color="getThemeColor" @preview-change="handlePreviewChange" @save-settings="handleSaveSettings"
      @reset-defaults="handleResetDefaults" />

    <AppSelectorDrawer
      v-model:visible="appDrawerVisible"
      :apps="drawerApps"
      :current-app-id="authStore.currentApp?.appId"
      @select="handleAppSwitch"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import AsidePanel from './panels/AsidePanel.vue';
import HeaderPanel from './panels/HeaderPanel.vue';
import MainPanel from './panels/MainPanel.vue';
import SettingsPanel from './panels/SettingsPanel.vue';
import NoAppsEmpty from '../components/business/no-apps-empty/Index.vue';
import AppSelectorDrawer from '../components/business/app-selector-drawer/Index.vue';
import type { AppListItem } from '../components/business/app-selector-panel/Index.vue';
import { useAdminLayout } from './composables/use-admin-layout';
import { useColorMode, useThemeSwitch } from '../composables';
import { useAuthStore } from '../store/auth-store';

const authStore = useAuthStore();

const {
  layoutStore,
  mobileMenuOpen,
  isMobile,
  layoutModeOptions,
  themeOptions,
  shellClasses,
  topLevelMenus,
  activeTopMenuKey,
  showPrimaryTopMenus,
  displayedSideMenus,
  activeMenuPath,
  activeTabPath,
  handleTopMenuClick,
  handleSubMenuClick,
  toggleMobileMenu,
  handleResetDefaults,
  removeTab,
  handleTabCommand,
  handleUserCommand,
  handlePreviewChange,
  handleSaveSettings,
  getThemeColor,
} = useAdminLayout();

const noApps = computed(() => authStore.isAuthenticated && !authStore.hasApps);

const appDrawerVisible = ref(false);

/** 头部显示的应用名称 */
const headerBrandName = computed(() =>
  authStore.currentApp?.appName || layoutStore.navigation.brandName
);

/** 头部显示的应用副标题 */
const headerBrandTagline = computed(() => {
  if (authStore.currentApp) {
    const parts: string[] = [];
    if (authStore.currentApp.appTypeName) {
      parts.push(authStore.currentApp.appTypeName);
    }
    parts.push(authStore.currentApp.isOwner ? '拥有者' : '成员');
    return parts.join(' · ');
  }
  return layoutStore.navigation.brandTagline;
});

/** 是否显示应用切换入口 */
const showAppSwitcher = computed(() => authStore.apps.length > 1);

/** 抽屉中的应用列表数据 */
const drawerApps = computed<AppListItem[]>(() =>
  authStore.apps.map(app => ({
    appId: app.appId,
    appName: app.appName,
    appCode: app.appCode,
    appLogo: app.appLogo,
    isOwner: app.isOwner,
    role: app.isOwner ? 'owner' : 'member',
    appTypeName: app.appTypeName,
  }))
);

/** 打开应用切换抽屉 */
function openAppDrawer() {
  appDrawerVisible.value = true;
}

/** 从抽屉中切换应用 */
async function handleAppSwitch(app: AppListItem) {
  try {
    await authStore.selectApp({
      appId: app.appId,
      appName: app.appName,
      appCode: app.appCode,
      appLogo: app.appLogo,
      isOwner: app.isOwner,
      appTypeName: app.appTypeName,
    });
    appDrawerVisible.value = false;
    ElMessage.success(`已切换到应用: ${app.appName}`);
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || '切换应用失败');
  }
}

const { initColorMode } = useColorMode();
const { initTheme } = useThemeSwitch();

initColorMode();

onMounted(() => {
  initTheme();
});
</script>

<style scoped lang="scss">
@use '../styles/admin-layout-settings';

.mfw-admin-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color-page);
  position: relative;
}
</style>

<style lang="scss">
.mfw-admin-content-area > :first-child {
  animation: mfw-page-enter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes mfw-page-enter {
  from {
    opacity: 0;
    transform: translateX(24px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
