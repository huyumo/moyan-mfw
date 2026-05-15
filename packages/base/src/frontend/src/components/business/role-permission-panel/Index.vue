<!--
/**
 * @fileoverview 权限池配置弹窗组件
 * @description 用于应用类型详情页的权限池配置，支持 PC 权限树和普通权限两个 Tab
 * @example
 * ```vue
 * <PermissionPoolDialog
 *   :app-type-id="appTypeId"
 * />
 * ```
 * */
-->
<template>
  <div data-testid="role-perm-panel">
    <MfwPermissionTree :data="data" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { MfwPermissionTree } from '../permission-tree'
import { PermissionTreesResponseDto } from '../../../apis/sys/schemas';
import { ApiRoleAssignPermissions, ApiRoleGetRolePermissions } from '../../../apis/sys';

defineOptions({ name: 'RolePermissionPanel' })

const { roleId } = defineProps({
  roleId: {
    type: String,
    required: true
  }
})

const data = ref<PermissionTreesResponseDto>({
  pcTree: [],
  normalTree: []
})

const getTreeData = async () => {
 await new ApiRoleGetRolePermissions({
    params: {
      id: roleId
    }
  }).then(res => {
    data.value = res.permissionTrees
  })
}

onMounted(() => {
  getTreeData()
})

const onConfirm = async () => {
  await new ApiRoleAssignPermissions({
    params: { id: roleId },
    body: {
      permissionTrees: {
        pcTree: data.value.pcTree,
        normalTree: data.value.normalTree
      }
    }
  }, { hintSuccess: true, hintFail: true })
}

defineExpose({
  onConfirm
})

</script>

<style scoped lang="scss"></style>
