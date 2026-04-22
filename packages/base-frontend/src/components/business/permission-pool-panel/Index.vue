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
  <MfwPermissionTree :data="data" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { MfwPermissionTree } from '../permission-tree'
import {  PermissionTreesResponseDto } from '../../../apis/sys/schemas';
import { ApiAppTypeGetPermissionPool, ApiAppTypeUpdatePermissionPool } from '../../../apis/sys';

defineOptions({ name: 'PermissionPoolPanel' })

const { appTypeId } = defineProps({
  appTypeId: {
    type: String,
    required: true
  }
})

const data = ref<PermissionTreesResponseDto>({
  pcTree: [],
  normalTree: []
})



const getTreeData = async () => {
  new ApiAppTypeGetPermissionPool({
    params: {
      appTypeId: appTypeId
    }
  }).then(res => {
    data.value = res.permissionTrees
  })
}

onMounted(() => {
  getTreeData()
})

const onConfirm = async () => {
  console.log(data.value)
  await new ApiAppTypeUpdatePermissionPool({
    params: {      appTypeId: appTypeId    },
    body: {
      permissionTrees: {
        pcTree: data.value.pcTree,
        normalTree: data.value.normalTree
      }
    }
  },{ hintSuccess: true, hintFail: true })
}

defineExpose({
  onConfirm
})

</script>

<style scoped lang="scss"></style>
