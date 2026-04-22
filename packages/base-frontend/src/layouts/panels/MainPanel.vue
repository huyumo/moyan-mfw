<!--
/**
 * @fileoverview 主内容面板组件
 * @description 包含标签栏和主内容区域
 */
-->
<template>
  <main class="mfw-admin-main-panel">
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
import TabsPanel from './TabsPanel.vue';
import type { PageTabItem } from '../../types/layout-types';

const props = defineProps<{
  modelValue: string;
  showTabs?: boolean;
  visitedTabs?: PageTabItem[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'tab-remove', value: string | number): void;
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

.mfw-admin-content-area {
  flex: 1;
  overflow: auto;
  padding: 0;
}
</style>
