<!--
/**
 * @fileoverview 顶部导航面板组件。
 */
-->
<template>
  <nav v-if="showPrimaryTopMenus" class="mfw-admin-primary-nav" aria-label="主导航菜单">
    <button
      v-for="menu in topLevelMenus"
      :key="menu.key"
      class="mfw-admin-primary-link"
      :class="{ 'is-active': menu.key === activeTopMenuKey }"
      type="button"
      :aria-label="menu.label"
      :data-testid="`nav-menu-${menu.key}`"
      @click="emit('top-menu-click', menu)"
    >
      <el-icon><component :is="resolveIcon(menu.icon)" /></el-icon>
      <span>{{ menu.label }}</span>
    </button>
  </nav>

  <nav v-else class="mfw-admin-top-nav" aria-label="顶部快捷导航">
    <template v-for="item in topNav" :key="item.key">
      <router-link v-if="item.to" :to="item.to" class="mfw-admin-top-link" :aria-label="item.label">{{
        item.label
      }}</router-link>
      <a
        v-else-if="item.href"
        :href="item.href"
        target="_blank"
        rel="noreferrer"
        class="mfw-admin-top-link"
        :aria-label="item.label"
      >
        {{ item.label }}
      </a>
    </template>
  </nav>
</template>

<script setup lang="ts">
import * as IconMap from '@element-plus/icons-vue';
import type { SideMenuItem, TopNavItem } from '../../types/layout-types';

defineProps<{
  /** 是否展示一级菜单 */
  showPrimaryTopMenus: boolean;
  /** 顶部一级菜单 */
  topLevelMenus: SideMenuItem[];
  /** 当前激活菜单键 */
  activeTopMenuKey: string;
  /** 顶部导航列表 */
  topNav: TopNavItem[];
}>();

const emit = defineEmits<{
  /** 顶部菜单点击事件 */
  (e: 'top-menu-click', menu: SideMenuItem): void;
}>();

function resolveIcon(iconName?: string) {
  if (!iconName) {
    return IconMap.Menu;
  }
  return (IconMap as Record<string, unknown>)[iconName] || IconMap.Menu;
}
</script>
