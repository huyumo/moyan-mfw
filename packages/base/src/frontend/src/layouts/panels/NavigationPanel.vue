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

  <div v-else-if="showTabs" class="mfw-admin-top-tabs">
    <TabsPanel
      :model-value="activeTabPath ?? ''"
      :visited-tabs="visitedTabs ?? []"
      @update:model-value="emit('update:activeTabPath', $event)"
      @tab-remove="emit('tab-remove', $event)"
      @tab-command="emit('tab-command', $event)"
    />
  </div>

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
import type { PageTabItem, SideMenuItem, TopNavItem } from '../../types/layout-types';
import TabsPanel from './TabsPanel.vue';

defineProps<{
  /** 是否展示一级菜单 */
  showPrimaryTopMenus: boolean;
  /** 顶部一级菜单 */
  topLevelMenus: SideMenuItem[];
  /** 当前激活菜单键 */
  activeTopMenuKey: string;
  /** 顶部导航列表 */
  topNav: TopNavItem[];
  /** 是否在顶部展示标签栏（侧边栏模式） */
  showTabs?: boolean;
  /** 标签列表 */
  visitedTabs?: PageTabItem[];
  /** 当前激活标签路径 */
  activeTabPath?: string;
}>();

const emit = defineEmits<{
  /** 顶部菜单点击事件 */
  (e: 'top-menu-click', menu: SideMenuItem): void;
  /** 更新激活标签 */
  (e: 'update:activeTabPath', value: string): void;
  /** 移除标签 */
  (e: 'tab-remove', value: string | number): void;
  /** 执行标签命令 */
  (e: 'tab-command', command: string | number | object): void;
}>();

function resolveIcon(iconName?: string) {
  if (!iconName) {
    return IconMap.Menu;
  }
  return (IconMap as Record<string, unknown>)[iconName] || IconMap.Menu;
}
</script>

<style scoped lang="scss">
:deep(.tab-action-btn) {
  color: rgba(255, 255, 255, 0.7);

  &:hover {
    color: #fff;
  }
}
</style>
