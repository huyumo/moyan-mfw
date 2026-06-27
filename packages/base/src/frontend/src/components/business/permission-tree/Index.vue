<!--
/**
 * @fileoverview MfwPermissionTree 权限树组件
 * @description
 * 权限树选择组件，支持 PC 权限和普通权限（NORMAL）。
 * PC 权限已由 RouteSyncService 自动同步到权限池，权限池编辑时通过 showPcTab=false 隐藏。
 *
 * @example
 * ```vue
 * <!-- 默认显示 PC + 普通两个 Tab -->
 * <MfwPermissionTree :data="permissionData" />
 *
 * <!-- 仅显示普通权限（权限池用） -->
 * <MfwPermissionTree :data="permissionData" :show-pc-tab="false" />
 * ```
 */
-->
<template>
  <el-tabs v-if="showPcTab" v-model="activeTab" data-testid="perm-tree-tabs">
    <el-tab-pane label="PC 权限" name="pcTree">
      <TreeSelect v-model="pcTreeData" />
    </el-tab-pane>
    <el-tab-pane label="普通权限" name="normalTree">
      <TreeSelect v-model="normalTreeData" />
    </el-tab-pane>
  </el-tabs>
  <TreeSelect v-else v-model="normalTreeData" />
</template>

<script setup lang="ts">
import { computed, type PropType, ref } from 'vue';
import type { PermissionTreesResponseDto } from '../../../apis/sys/schemas';
import TreeSelect from './TreeSelect.vue';

defineOptions({ name: 'MfwPermissionTree' });

const activeTab = ref('pcTree');

const { data, showPcTab } = defineProps({
  data: {
    type: Object as PropType<PermissionTreesResponseDto>,
    default: () => ({
      pcTree: [],
      normalTree: [],
    }),
  },
  /** 是否显示 PC 权限标签页。权限池已由 RouteSyncService 自动同步，设为 false */
  showPcTab: {
    type: Boolean,
    default: true,
  },
});

const pcTreeData = computed(() => {
  return data?.pcTree || [];
});

const normalTreeData = computed(() => {
  return data?.normalTree || [];
});
</script>