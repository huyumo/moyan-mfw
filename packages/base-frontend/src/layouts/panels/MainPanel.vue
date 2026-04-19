<!--
/**
 * @fileoverview 主内容面板组件
 * @description 包含面包屑、标签栏和主内容区域
 */
-->
<template>
  <main class="mfw-admin-main-panel">
    <!-- 标签栏 -->
    <TabsPanel
      v-if="showTabs"
      v-model="activeTabPath"
      :visited-tabs="visitedTabs ?? []"
      @tab-remove="emit('tab-remove', $event)"
      @tab-command="emit('tab-command', $event)"
    />

    <!-- 主内容区域 -->
    <div class="mfw-admin-content-area">
      <slot />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight, HomeFilled } from '@element-plus/icons-vue';
import TabsPanel from './TabsPanel.vue';
import type { PageTabItem } from '../../types/layout-types';

const props = defineProps<{
  /** 当前激活标签路径 */
  modelValue: string;
  /** 是否显示面包屑 */
  showBreadcrumb?: boolean;
  /** 首页路径 */
  homePath?: string;
  /** 当前页面标题 */
  currentTitle?: string;
  /** 是否显示标签栏 */
  showTabs?: boolean;
  /** 已访问标签列表 */
  visitedTabs?: PageTabItem[];
}>();

const emit = defineEmits<{
  /** 更新激活标签 */
  (e: 'update:modelValue', value: string): void;
  /** 移除标签 */
  (e: 'tab-remove', value: string | number): void;
  /** 执行标签命令 */
  (e: 'tab-command', command: string | number | object): void;
}>();

const activeTabPath = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});
</script>

<style scoped lang="scss">
.mfw-admin-main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.mfw-admin-breadcrumb {
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.mfw-admin-content-area {
  flex: 1;
  overflow: auto;
  padding: 0;
}
</style>