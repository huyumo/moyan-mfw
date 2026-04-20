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
        <MenuTreeNode v-for="menu in displayedSideMenus" :key="menu.key" :item="menu" />
      </el-menu>
    </el-scrollbar>

    <div class="mfw-admin-sidebar-footer">
      <slot name="sidebar-footer">
        <span></span>
      </slot>
    </div>
  </aside>
</template>

<script setup lang="ts">
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
}>();
</script>
