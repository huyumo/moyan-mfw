<!--
/**
 * @fileoverview MfwPermissionTree 权限树组件
 * @description
 *
 * @example
 * ```vue
 * <MfwPermissionTree
 *   :role-id="role.id"
 *   :app-type-id="role.appTypeId"
 * />
 * ```
 */
-->
<template>
  <el-tabs v-model="activeTab" data-testid="perm-tree-tabs">
    <el-tab-pane label="PC 权限" name="pcTree">
      <TreeSelect v-model="pcTreeData" />
    </el-tab-pane>
    <el-tab-pane label="普通权限" name="normalTree">
      <TreeSelect v-model="normalTreeData" />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { computed, PropType,ref } from 'vue';
import type { PermissionTreesResponseDto } from '../../../../apis/sys/schemas';
import TreeSelect from './TreeSelect.vue';


defineOptions({ name: 'MfwPermissionTree' });
const activeTab = ref('pcTree');

const { data } = defineProps({
  data: {
    type: Object as PropType<PermissionTreesResponseDto>,
    default: () => ({
      pcTree: [],
      normalTree: [],
    }),
  },
});


const pcTreeData = computed(() => {
  return data?.pcTree || [];
});

const normalTreeData = computed(() => {
  return data?.normalTree || [];
});


</script>
