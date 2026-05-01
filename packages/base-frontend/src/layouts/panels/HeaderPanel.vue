<!--
/**
 * @fileoverview 头部面板组件
-->
<template>
  <header class="mfw-admin-header" :class="{ 'is-fixed': fixedHeader }">
    <div class="mfw-admin-brand">
      <button
        class="mfw-admin-menu-toggle"
        type="button"
        aria-label="Toggle mobile menu"
        data-testid="header-mobile-toggle"
        @click="emit('toggle-mobile-menu')"
      >
        <el-icon><Menu /></el-icon>
      </button>
      <button
        v-if="showSidebar"
        class="mfw-admin-collapse-toggle"
        type="button"
        :aria-label="compact ? 'Expand sidebar' : 'Collapse sidebar'"
        data-testid="header-compact-toggle"
        @click="emit('toggle-compact')"
      >
        <el-icon><component :is="compact ? Expand : Fold" /></el-icon>
      </button>
      <div class="mfw-admin-brand-text">
        <span class="mfw-admin-brand-name">{{ brandName }}</span>
        <small class="mfw-admin-brand-tagline">{{ brandTagline }}</small>
      </div>
    </div>

    <NavigationPanel
      :show-primary-top-menus="showPrimaryTopMenus"
      :top-level-menus="topLevelMenus"
      :active-top-menu-key="activeTopMenuKey"
      :top-nav="topNav"
      @top-menu-click="emit('top-menu-click', $event)"
      @sub-menu-click="emit('sub-menu-click', $event)"
    />

    <div class="mfw-admin-header-actions">
      <slot name="header-common">
        <component :is="layoutExtensions.headerCommon" v-if="layoutExtensions.headerCommon" />
        <el-button v-else text aria-label="Open layout settings" data-testid="header-settings-btn" @click="emit('open-settings')">Layout</el-button>
      </slot>

      <UserPanel :layout-extensions="layoutExtensions" @user-command="emit('user-command', $event)">
        <template #header-avatar>
          <slot name="header-avatar" />
        </template>
        <template #header-user-menu>
          <slot name="header-user-menu" />
        </template>
      </UserPanel>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Expand, Fold, Menu } from '@element-plus/icons-vue';
import type { LayoutExtensionComponents, SideMenuItem, TopNavItem } from '../../types/layout-types';
import NavigationPanel from './NavigationPanel.vue';
import UserPanel from './UserPanel.vue';

defineProps<{
  /** 是否固定头部 */
  fixedHeader: boolean;
  /** 是否显示侧边栏 */
  showSidebar: boolean;
  /** 是否紧凑模式 */
  compact: boolean;
  /** 品牌名称 */
  brandName: string;
  /** 品牌标语 */
  brandTagline: string;
  /** 是否显示主导航菜单 */
  showPrimaryTopMenus: boolean;
  /** 顶级菜单项 */
  topLevelMenus: SideMenuItem[];
  /** 当前激活的顶级菜单键 */
  activeTopMenuKey: string;
  /** 头部导航 */
  topNav: TopNavItem[];
  /** 布局扩展组件 */
  layoutExtensions: LayoutExtensionComponents;
}>();

const emit = defineEmits<{
  /** 切换移动端菜单 */
  (e: 'toggle-mobile-menu'): void;
  /** 切换紧凑模式 */
  (e: 'toggle-compact'): void;
  /** 顶级菜单点击 */
  (e: 'top-menu-click', menu: SideMenuItem): void;
  /** 子菜单点击 */
  (e: 'sub-menu-click', payload: { parent: SideMenuItem; child: SideMenuItem }): void;
  /** 打开设置 */
  (e: 'open-settings'): void;
  /** 用户命令 */
  (e: 'user-command', command: string | number | object): void;
}>();
</script>
