<!--
/**
 * @fileoverview 主内容面板组件
 * @description 包含面包屑、标签栏和主内容区域
 */
-->
<template>
  <main class="mfw-admin-main-panel">
    <div v-if="showBreadcrumb && breadcrumbItems.length > 1" class="mfw-admin-breadcrumb-wrap">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="item in breadcrumbItems" :key="item.path" :to="item.to">
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <TabsPanel
      v-if="showTabs"
      v-model="activeTabPath"
      :visited-tabs="visitedTabs ?? []"
      @tab-remove="emit('tab-remove', $event)"
      @tab-command="emit('tab-command', $event)"
    />

    <div class="mfw-admin-content-area">
      <slot />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import TabsPanel from './TabsPanel.vue';
import type { PageTabItem } from '../../types/layout-types';

interface BreadcrumbEntry {
  path: string;
  title: string;
  to?: string;
}

const props = defineProps<{
  modelValue: string;
  showBreadcrumb?: boolean;
  homePath?: string;
  currentTitle?: string;
  showTabs?: boolean;
  visitedTabs?: PageTabItem[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'tab-remove', value: string | number): void;
  (e: 'tab-command', command: string | number | object): void;
}>();

const route = useRoute();

const activeTabPath = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

const breadcrumbItems = computed<BreadcrumbEntry[]>(() => {
  const items: BreadcrumbEntry[] = [];
  const homePath = props.homePath || '/dashboard';

  items.push({
    path: homePath,
    title: '首页',
    to: homePath,
  });

  const matched = route.matched.filter(
    (r) => r.meta?.title && r.path !== homePath,
  );

  for (const record of matched) {
    const title = typeof record.meta.title === 'string' ? record.meta.title : '';
    if (title) {
      items.push({
        path: record.path,
        title,
        to: record.path,
      });
    }
  }

  return items;
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

.mfw-admin-breadcrumb-wrap {
  padding: 10px 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.mfw-admin-content-area {
  flex: 1;
  overflow: auto;
  padding: 0;
}
</style>
