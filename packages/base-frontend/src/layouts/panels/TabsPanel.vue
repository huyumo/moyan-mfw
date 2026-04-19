<!--
/**
 * @fileoverview 标签栏面板组件。
 */
-->
<template>
  <div class="mfw-admin-tabs-wrap">
    <el-tabs v-model="activeTabPath"  type="card" class="mfw-admin-tabs" @tab-remove="emit('tab-remove', $event)">
      <el-tab-pane v-for="tab in visitedTabs" :key="tab.key" :name="tab.fullPath" :closable="tab.closable">
        <template #label>
          <span class="mfw-admin-tab-label">{{ tab.title }}</span>
        </template>
      </el-tab-pane>
    </el-tabs>
    <el-dropdown trigger="click" @command="emit('tab-command', $event)">
        <el-icon :size="18" class="tab-action-btn" type="button">
          <MoreFilled />
        </el-icon>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="closeCurrent">关闭当前</el-dropdown-item>
          <el-dropdown-item command="closeLeft">关闭左侧</el-dropdown-item>
          <el-dropdown-item command="closeRight">关闭右侧</el-dropdown-item>
          <el-dropdown-item command="closeOther">关闭其他</el-dropdown-item>
          <el-dropdown-item command="closeAll">关闭全部</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { MoreFilled } from '@element-plus/icons-vue';
import { computed } from 'vue';
import type { PageTabItem } from '../../types/layout-types';

const props = defineProps<{
  /** 当前激活标签路径 */
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
<style scoped lang="scss">
.tab-action-btn {
  cursor: pointer;
  transform: rotate(90deg) scale(0.8);
  color: #909399;
}
</style>
