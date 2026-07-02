<!--
/**
 * @fileoverview 路由同步按钮组件
 * @description 仅开发者可见，用于将前端菜单树配置同步到后端权限系统
 */
-->
<template>
  <el-button
    v-if="visible"
    :loading="syncing"
    size="small"
    text
    :title="needsSync ? '检测到菜单配置变更，点击同步到后端' : '菜单配置已是最新'"
    @click="handleSync"
  >
    <el-icon><Refresh /></el-icon>
    <span v-if="needsSync" class="route-sync-badge"></span>
  </el-button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useAuthStore } from '../../../store/auth-store'
import { ApiRouteSyncCheck, ApiRouteSyncSync } from '../../../apis/sys'
import { serializeMenuTrees } from '../../../utils/serialize-menu-trees'
import type { FrontendAppTypeMenuConfig } from '../../../router/routes'

const authStore = useAuthStore()

/** 从应用根注入菜单树配置（普通数组，非 Ref） */
const menuTrees = inject<FrontendAppTypeMenuConfig[]>(
  'mfw:menuTrees',
  [],
)

/** 是否需要同步 */
const needsSync = ref(false)
/** 同步中 */
const syncing = ref(false)
/** 检查是否失败（如非开发者、无权限等），失败后隐藏按钮 */
const checkFailed = ref(false)

/** 仅开发者可见，且检查未失败 */
const visible = computed(
  () => !!authStore.user?.isDeveloper && !checkFailed.value,
)

/** 检查是否需要同步 */
async function checkSync() {
  if (!authStore.user?.isDeveloper || !menuTrees?.length) {
    needsSync.value = false
    return
  }
  try {
    const payload = serializeMenuTrees(menuTrees)
    const result = await new ApiRouteSyncCheck(
      { body: payload },
      { hintFail: false },
    )
    const data = (result as any)?.data ?? result
    needsSync.value = !!data?.needsSync
    checkFailed.value = false
  } catch {
    needsSync.value = false
    checkFailed.value = true
  }
}

/** 执行同步 */
async function handleSync() {
  if (syncing.value || !menuTrees?.length) return
  syncing.value = true
  try {
    const payload = serializeMenuTrees(menuTrees)
    await new ApiRouteSyncSync({ body: payload }, { hintSuccess: true })
    needsSync.value = false
  } catch {
    // ApiCall 已通过事件提示错误
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  checkSync()
})
</script>

<style scoped lang="scss">
.route-sync-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-danger);
}
</style>
