<!--
/**
 * @fileoverview 权限池配置弹窗组件
 * @description 用于应用类型详情页的权限池配置。
 * PC 权限已由 RouteSyncService 自动同步，此处仅编辑普通权限（NORMAL）。
 *
 * @example
 * ```vue
 * <PermissionPoolDialog :app-type-id="appTypeId" />
 * ```
 */
-->
<template>
  <div data-testid="perm-pool-panel">
    <MfwPermissionTree :data="data" :show-pc-tab="false" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { MfwPermissionTree } from '../permission-tree';
import { PermissionTreesResponseDto } from '../../../apis/sys/schemas';
import {
  ApiAppTypeGetPermissionPool,
  ApiAppTypeUpdatePermissionPool,
} from '../../../apis/sys';

defineOptions({ name: 'PermissionPoolPanel' });

const { appTypeId } = defineProps({
  appTypeId: {
    type: String,
    required: true,
  },
});

const data = ref<PermissionTreesResponseDto>({
  pcTree: [],
  normalTree: [],
});

const getTreeData = async () => {
  new ApiAppTypeGetPermissionPool({
    params: {
      appTypeId: appTypeId,
    },
  }).then((res) => {
    data.value = res.permissionTrees;
  });
};

onMounted(() => {
  getTreeData();
});

const onConfirm = async () => {
  await new ApiAppTypeUpdatePermissionPool(
    {
      params: { appTypeId: appTypeId },
      body: {
        permissionTrees: {
          pcTree: [], // PC 权限由 RouteSyncService 自动同步，不通过前端编辑
          normalTree: data.value.normalTree,
        },
      },
    },
    { hintSuccess: true, hintFail: true },
  );
};

defineExpose({
  onConfirm,
});
</script>

<style scoped lang="scss"></style>