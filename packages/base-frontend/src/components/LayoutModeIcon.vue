<!--
**
 * @fileoverview 布局模式图标组件
 *
 * 该组件用于展示三种布局模式的可视化图标：
 * - sidebar（侧边菜单模式）：左侧显示侧边栏，顶部显示头部
 * - top（顶部菜单模式）：仅顶部显示导航菜单
 * - dual（双菜单模式）：顶部显示一级菜单，左侧显示二级菜单
 *
 * 每个图标使用 SVG 绘制，直观展示对应布局模式的结构特征。
 *
 * @author moyan
 * @since 1.0.0
-->

<script setup lang="ts">
/**
 * 组件属性定义
 */
interface Props {
  /** 布局模式：sidebar | top | dual */
  mode: string;
}

defineProps<Props>();
</script>

<template>
  <!-- 侧边菜单模式图标 -->
  <svg v-if="mode === 'sidebar'" viewBox="0 0 64 48" class="layout-mode-icon">
    <!-- 头部 -->
    <rect x="0" y="0" width="64" height="10" class="icon-header" />
    <!-- 侧边栏 -->
    <rect x="0" y="10" width="16" height="38" class="icon-sidebar" />
    <!-- 内容区 -->
    <rect x="18" y="12" width="44" height="34" class="icon-content" />
  </svg>

  <!-- 顶部菜单模式图标 -->
  <svg v-else-if="mode === 'top'" viewBox="0 0 64 48" class="layout-mode-icon">
    <!-- 头部（包含菜单） -->
    <rect x="0" y="0" width="64" height="14" class="icon-header" />
    <!-- 内容区 -->
    <rect x="0" y="16" width="64" height="32" class="icon-content" />
  </svg>

  <!-- 双菜单模式图标 -->
  <svg v-else-if="mode === 'dual'" viewBox="0 0 64 48" class="layout-mode-icon">
    <!-- 头部（包含一级菜单） -->
    <rect x="0" y="0" width="64" height="10" class="icon-header" />
    <!-- 侧边栏（二级菜单） -->
    <rect x="0" y="10" width="16" height="38" class="icon-sidebar" />
    <!-- 内容区 -->
    <rect x="18" y="12" width="44" height="34" class="icon-content" />
  </svg>
</template>

<style scoped lang="scss">
.layout-mode-icon {
  width: 64px;
  height: 48px;

  .icon-header {
    fill: var(--el-color-primary);
    rx: 2;
  }

  .icon-sidebar {
    fill: var(--el-color-primary-light-7);
    rx: 2;
  }

  .icon-content {
    fill: var(--el-fill-color-light);
    rx: 2;
  }
}
</style>
