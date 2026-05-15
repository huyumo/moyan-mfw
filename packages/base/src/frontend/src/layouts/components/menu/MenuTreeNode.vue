<!--
/**
 * @fileoverview - 菜单树节点递归组件
 *
 * 该组件用于递归渲染多级菜单结构，支持无限层级的菜单嵌套。
 * 基于 Element Plus 的 el-sub-menu 和 el-menu-item 组件实现。
 *
 * 功能特性：
 * 1. 递归渲染：通过自引用实现多级菜单的无限嵌套
 * 2. 图标支持：自动解析 Element Plus 图标名称
 * 3. 徽章显示：支持在菜单项上显示徽章标签
 * 4. 智能索引：自动生成菜单索引用于路由匹配
 *
 * 组件结构：
 * - 有子菜单时：渲染 el-sub-menu（可展开的子菜单）
 * - 无子菜单时：渲染 el-menu-item（可点击的菜单项）
 *
 * 使用方式：
 * ```vue
 * <el-menu>
 *   <MenuTreeNode v-for="menu in menus" :key="menu.key" :item="menu" />
 * </el-menu>
 * ```
 *
 * @prop {SideMenuItem} item - 菜单项数据对象
 *
 * @author moyan
 * @since 1.0.0
 */
-->
<template>
  <el-sub-menu v-if="hasChildren" :index="subMenuIndex" :data-testid="`menu-node-${item.key}`">
    <template #title>
      <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
      <span>{{ item.label }}</span>
      <el-tag v-if="item.badge" size="small" type="primary" effect="plain">{{ item.badge }}</el-tag>
    </template>
    <MenuTreeNode v-for="child in item.children" :key="child.key" :item="child" />
  </el-sub-menu>

  <el-menu-item v-else :index="menuItemIndex" :data-testid="`menu-node-${item.key}`">
    <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
    <span>{{ item.label }}</span>
    <el-tag v-if="item.badge" size="small" type="primary" effect="plain">{{ item.badge }}</el-tag>
  </el-menu-item>
</template>

<script setup lang="ts">
import * as IconMap from '@element-plus/icons-vue';
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { SideMenuItem } from '../../../../types/layout-types';

/** 组件选项 */
defineOptions({
  name: 'MenuTreeNode',
});

/** 组件属性 */
const props = defineProps<{
  /** 菜单项数据 */
  item: SideMenuItem;
}>();

/** 是否有子菜单 */
const hasChildren = computed(() => Boolean(props.item.children && props.item.children.length > 0));

/**
 * 计算当前子菜单索引。
 */
const subMenuIndex = computed(() => {
  const indexPath = resolveMenuIndex(props.item.to);
  return `${props.item.key}:${indexPath || props.item.key}`;
});

/**
 * 菜单项索引
 * 用于路由激活状态匹配
 */
const menuItemIndex = computed(() => resolveMenuIndex(props.item.to));

/**
 * 解析路由目标为菜单索引
 * @param to - 路由目标
 * @returns 菜单索引路径
 */
function resolveMenuIndex(to?: RouteLocationRaw): string {
  if (!to) {
    return '/dashboard';
  }
  if (typeof to === 'string') {
    return to;
  }
  if ('path' in to && to.path) {
    return to.path;
  }
  return '/dashboard';
}

/**
 * 解析图标组件
 * @param iconName - 图标名称
 * @returns 图标组件
 */
function resolveIcon(iconName?: string) {
  if (!iconName) {
    return IconMap.Menu;
  }
  return (IconMap as Record<string, unknown>)[iconName] || IconMap.Menu;
}
</script>
