<!--
/**
 * @fileoverview 应用切换抽屉组件
 * @description 从左侧滑出的抽屉，展示用户可访问的应用列表，用于在管理后台中切换应用。
 */
-->
<template>
  <el-drawer
    v-model="drawerVisible"
    direction="ltr"
    :size="420"
    title="切换应用"
    data-testid="app-switcher-drawer"
  >
    <AppSelectorPanel
      :apps="apps"
      :loading="loading"
      :selected-app-id="currentAppId"
      :default-app-id="defaultAppId"
      :show-default-toggle="true"
      @select="handleSelect"
      @toggle-default="handleToggleDefault"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppSelectorPanel, { type AppListItem } from '../app-selector-panel/Index.vue'

defineOptions({ name: 'AppSelectorDrawer' })

const props = defineProps<{
  visible: boolean
  apps: AppListItem[]
  loading?: boolean
  currentAppId?: string
  defaultAppId?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'select', app: AppListItem): void
  (e: 'toggle-default', app: AppListItem): void
}>()

const drawerVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

function handleSelect(app: AppListItem) {
  emit('select', app)
  emit('update:visible', false)
}

function handleToggleDefault(app: AppListItem) {
  emit('toggle-default', app)
}
</script>
