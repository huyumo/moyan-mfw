<!--
/**
 * @fileoverview 主内容面板组件。
 */
-->
<template>
  <main class="mfw-admin-content">
    <div v-if="showBreadcrumb" class="mfw-admin-breadcrumb-wrap">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: homePath || '/dashboard' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <TabsPanel
      v-if="showTabs"
      v-model="activeTabPath"
      :visited-tabs="visitedTabs"
      @tab-remove="emit('tab-remove', $event)"
      @tab-command="emit('tab-command', $event)"
    />

    <div class="mfw-admin-content-inner">
      <slot />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PageTabItem } from '../../types/layout-types';
import TabsPanel from './TabsPanel.vue';

const props = defineProps<{
  /** 是否显示面包屑 */
  showBreadcrumb: boolean;
  /** 首页路径 */
  homePath: string;
  /** 当前页面标题 */
  currentTitle: string;
  /** 是否显示标签栏 */
  showTabs: boolean;
  /** 当前激活标签 */
  modelValue: string;
  /** 标签列表 */
  visitedTabs: PageTabItem[];
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
