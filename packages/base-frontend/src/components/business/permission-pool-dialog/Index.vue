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
      ref="panelRef"
      :app-type-id="props.data.appTypeId"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MfwPermissionPoolPanel } from '../../picker/permission-pool-panel/mod'
import type { MfwPermissionPoolPanelInstance } from '../../picker/permission-pool-panel/types'

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

/** 权限池面板引用 */
const panelRef = ref<MfwPermissionPoolPanelInstance>()

/** 配置权限池 */
const handleSaved = () => {
  emit('saved')
}

/** 保存权限池 - 供 MfwPopup 调用 */
const onConfirm = async () => {
  if (!panelRef.value) {
    throw new Error('面板未初始化')
  }
  await panelRef.value.save()
}

defineExpose({
  onConfirm,
  save: onConfirm,
})
</script>

<style scoped lang="scss">
.permission-pool-dialog {
  height: 600px;
}
</style>
