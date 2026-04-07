<!--
/**
 * @fileoverview 权限池配置弹窗组件
 * @description 用于应用类型详情页的权限池配置，支持 PC 权限树和普通权限两个 Tab
 */
-->
<template>
  <div class="permission-pool-dialog">
    <MfwPermissionPoolPanel
      v-if="props?.data?.appTypeId"
      :app-type-id="props.data.appTypeId"
      :readonly="true"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { MfwPermissionPoolPanel } from '../../picker/permission-pool-panel/mod'

defineOptions({ name: 'PermissionPoolDialog' })

/** 弹窗传递的数据 */
interface PopupData {
  appTypeId: string
}

const props = defineProps<{
  data?: PopupData
}>()

const emit = defineEmits<{
  saved: []
}>()

/** 配置权限池 */
const handleSaved = () => {
  emit('saved')
}

defineExpose({
  save: () => {},
})
</script>

<style scoped lang="scss">
.permission-pool-dialog {
  height: 500px;
}
</style>
