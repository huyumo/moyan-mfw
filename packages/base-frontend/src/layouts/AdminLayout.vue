<!--
/**
 * @fileoverview 鐢啫鐪€圭懓娅掔紒鍕閵? */
-->
<template>
  <div class="mfw-admin-shell" :class="shellClasses">
    <HeaderPanel
      :fixed-header="layoutStore.styleConfig.fixedHeader"
      :show-sidebar="layoutStore.showSidebar"
      :compact="layoutStore.styleConfig.compact"
      :brand-name="layoutStore.navigation.brandName"
      :brand-tagline="layoutStore.navigation.brandTagline"
      :show-primary-top-menus="showPrimaryTopMenus"
      :top-level-menus="topLevelMenus"
      :active-top-menu-key="activeTopMenuKey"
      :top-nav="layoutStore.navigation.topNav"
      :layout-extensions="layoutStore.layoutExtensions"
      @toggle-mobile-menu="toggleMobileMenu"
      @toggle-compact="layoutStore.toggleCompact()"
      @top-menu-click="handleTopMenuClick"
      @open-settings="layoutStore.toggleSettingsPanel(true)"
      @user-command="handleUserCommand"
    >
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
      <AsidePanel
        :show-sidebar="layoutStore.showSidebar"
        :mobile-menu-open="mobileMenuOpen"
        :compact="layoutStore.styleConfig.compact"
        :active-menu-path="activeMenuPath"
        :displayed-side-menus="displayedSideMenus"
      >
        <template v-if="$slots['sidebar-footer']" #sidebar-footer>
          <slot name="sidebar-footer" />
        </template>
      </AsidePanel>

      <MainPanel
        v-model="activeTabPath"
        :show-breadcrumb="layoutStore.styleConfig.showBreadcrumb"
        :home-path="layoutStore.navigation.homePath"
        :current-title="currentTitle"
        :show-tabs="layoutStore.styleConfig.showTabs"
        :visited-tabs="layoutStore.visitedTabs"
        @tab-remove="removeTab"
        @tab-command="handleTabCommand"
      >
        <router-view />
      </MainPanel>
    </div>

    <SettingsPanel
      v-model="layoutStore.settingsPanelOpen"
      :is-mobile="isMobile"
      :layout-mode-options="layoutModeOptions"
      :theme-options="layoutStore.themeOptions"
      :style-config="layoutStore.styleConfig"
      :get-theme-color="getThemeColor"
      @preview-change="handlePreviewChange"
      @save-settings="handleSaveSettings"
      @reset-defaults="handleResetDefaults"
    />

    <el-dialog v-model="resetConfirmVisible" :title="dialogText.title" width="320px" align-center>
      <span>{{ dialogText.body }}</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetConfirmVisible = false">{{ dialogText.cancel }}</el-button>
          <el-button type="primary" @click="confirmResetDefaults">{{ dialogText.confirm }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import AsidePanel from './panels/AsidePanel.vue';
import HeaderPanel from './panels/HeaderPanel.vue';
import MainPanel from './panels/MainPanel.vue';
import SettingsPanel from './panels/SettingsPanel.vue';
import { useAdminLayout } from './composables/use-admin-layout';
import { useColorMode, useThemeSwitch } from '../composables';

const dialogText = {
  title: '\u6062\u590d\u9ed8\u8ba4\u8bbe\u7f6e',
  body: '\u662f\u5426\u6062\u590d\u5168\u90e8\u5e03\u5c40\u504f\u597d\u4e3a\u9ed8\u8ba4\u503c\uff1f',
  cancel: '\u53d6\u6d88',
  confirm: '\u786e\u8ba4',
} as const;

const {
  layoutStore,
  mobileMenuOpen,
  resetConfirmVisible,
  isMobile,
  layoutModeOptions,
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
} = useAdminLayout();

// 初始化颜色模式和主题
const { initColorMode } = useColorMode();
const { initTheme } = useThemeSwitch();

onMounted(() => {
  initColorMode();
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
}
</style>
