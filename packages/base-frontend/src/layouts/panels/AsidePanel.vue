<!--
/**
 * @fileoverview 侧边栏面板组件。
 */
-->
<template>
  <aside
    v-if="showSidebar"
    class="mfw-admin-sidebar"
    :class="{ 'is-mobile-open': mobileMenuOpen, 'is-hidden': !showSidebar }"
  >
    <el-scrollbar class="mfw-admin-sidebar-scroll">
      <el-menu :default-active="activeMenuPath" router class="mfw-admin-menu">
        <template v-if="noApps">
          <div class="mfw-admin-sidebar-empty">
            <el-icon :size="36"><WarningFilled /></el-icon>
            <span>您尚未加入任何应用</span>
          </div>
        </template>
        <MenuTreeNode v-for="menu in displayedSideMenus" :key="menu.key" :item="menu" />
      </el-menu>
    </el-scrollbar>

    <div class="mfw-admin-sidebar-footer">
      <button
        class="mfw-admin-collapse-toggle"
        type="button"
        :aria-label="compact ? '展开侧边栏' : '折叠侧边栏'"
        data-testid="sidebar-compact-toggle"
        @click="emit('toggle-compact')"
      >
        <el-icon><component :is="compact ? Expand : Fold" /></el-icon>
      </button>
      <slot name="sidebar-footer">
        <span></span>
      </slot>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { WarningFilled, Expand, Fold } from '@element-plus/icons-vue';
import MenuTreeNode from '../components/menu/MenuTreeNode.vue';
import type { SideMenuItem } from '../../types/layout-types';

defineProps<{
  /** 是否显示侧边栏 */
  showSidebar: boolean;
  /** 是否展开移动端菜单 */
  mobileMenuOpen: boolean;
  /** 是否折叠 */
  compact: boolean;
  /** 激活菜单路径 */
  activeMenuPath: string;
  /** 当前显示的侧边菜单 */
  displayedSideMenus: SideMenuItem[];
  /** 是否无应用可访问 */
  noApps?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle-compact'): void;
}>();
</script>
