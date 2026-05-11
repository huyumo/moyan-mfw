<!--
/**
 * @fileoverview 应用选择器弹窗组件
 * @description 用于用户登录后选择应用，支持弹窗模式展示
 *
 * @example
 * ```vue
 * // 使用 MfwPopup 打开弹窗
 * import { MfwPopup } from '@/components/feedback/popup'
 * import AppSelectorDialog from '@/components/business/app-selector-dialog'
 *
 * MfwPopup.open({
 *   title: '选择应用',
 *   type: 'dialog',
 *   component: AppSelectorDialog,
 *   data: { forceSelect: true },
 *   popupProps: { width: '600px' },
 *   footer: false,
 *   on: {
 *     close: () => { // 关闭回调 }
 *   }
 * })
 * ```
 */
-->
<template>
  <div class="app-selector-dialog">
    <!-- 头部 -->
    <div class="dialog-header">
      <h3 class="dialog-title">选择应用</h3>
      <p class="dialog-subtitle">请选择要进入的应用，不同应用的权限相互隔离</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="4" animated />
    </div>

    <!-- 空状态 -->
    <div v-else-if="appList.length === 0" class="empty-state">
      <el-empty description="暂无可用应用">
        <template #image>
          <el-icon class="empty-icon" :size="48">
            <Monitor />
          </el-icon>
        </template>
      </el-empty>
      <p class="empty-text">请联系管理员为您分配应用</p>
    </div>

    <!-- 应用列表 -->
    <div v-else class="app-list">
      <div
        v-for="app in appList"
        :key="app.appId"
        class="app-item"
        :class="{
          selected: selectedAppId === app.appId
        }"
        @click="handleSelectApp(app)"
        data-testid="app-selector-item"
      >
        <!-- 应用图标 -->
        <div class="app-icon placeholder" v-if="!getImageSrc(app.logo)">
          <el-icon :size="24">
            <Monitor />
          </el-icon>
        </div>
        <img v-else class="app-icon" :src="getImageSrc(app.logo)" :alt="app.appName" />

        <!-- 应用信息 -->
        <div class="app-info">
          <div class="app-name">
            {{ app.appName }}
            <el-tag
              v-if="app.role"
              class="role-tag"
              size="small"
              :type="app.role === 'owner' ? 'warning' : 'info'"
            >
              {{ app.role === 'owner' ? '拥有者' : '成员' }}
            </el-tag>
          </div>
          <div class="app-type">
            <el-icon :size="14">
              <OfficeBuilding />
            </el-icon>
            {{ app.appTypeName }}
          </div>
          <div class="app-code">编码: {{ app.appCode }}</div>
        </div>

        <!-- 选中图标 -->
        <el-icon v-if="selectedAppId === app.appId" class="check-icon">
          <Check />
        </el-icon>
      </div>
    </div>

    <!-- 底部提示 -->
    <div v-if="!loading && appList.length > 0" class="dialog-footer">
      <p class="footer-tip">切换应用无需重新登录，权限将自动刷新</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Monitor, OfficeBuilding, Check } from '@element-plus/icons-vue'
import { ApiAuthGetUserApps, ApiAuthGetUserPermissions } from '../../../apis/sys'
import type { AppInstanceItemDto, PermissionTreeNodeDto } from '../../../apis/sys/schemas'
import { useAuthStore } from '../../../store/auth-store'
import { useLayoutStore } from '../../../store/layout-store'
import type { PopupComponentProps } from '../../feedback/popup/types'
import type { AppSelectorDialogData } from './types'
import type { SideMenuItem } from '../../../types/layout-types'
import { getImageSrc } from '../../../utils/image'

defineOptions({ name: 'AppSelectorDialog' })

/** Props 类型定义 */
interface AppSelectorDialogPopupProps extends PopupComponentProps<AppSelectorDialogData> {}

// 接收弹窗传递的 props
const props = defineProps<AppSelectorDialogPopupProps>()

// 获取数据
const dialogData = computed(() => props.data || {})

// 状态
const loading = ref(true)
const appList = ref<AppInstanceItemDto[]>([])
const selectedAppId = ref<string>('')
const authStore = useAuthStore()
const layoutStore = useLayoutStore()

/**
 * 将权限菜单节点转换为侧边栏菜单格式
 */
function transformMenuNodesToSideMenu(nodes: any[]): SideMenuItem[] {
  return nodes
    .filter((item: any) => item.routePath) // 只保留有路由路径的菜单项
    .map((item: any) => ({
      key: item.permCode || item.id,
      label: item.permName,
      to: item.routePath,
      icon: item.iconName,
      children: item.children 
        ? transformMenuNodesToSideMenu(item.children) 
        : undefined,
    }));
}

/**
 * 选择应用
 */
async function handleSelectApp(app: AppInstanceItemDto) {
  // 后端已过滤禁用的应用，此处直接处理选择
  selectedAppId.value = app.appId

  try {
    // 1. 保存应用选择到 auth-store
    await authStore.selectApp({
      appId: app.appId,
      appName: app.appName,
      appCode: app.appCode,
      appLogo: getImageSrc(app.logo),
      isOwner: app.role === 'owner',
      appTypeId: app.appTypeId,
      appTypeCode: app.appTypeCode,
      appTypeName: app.appTypeName,
    })

    // 2. 加载该应用下的权限菜单
    const permissionsResult = await new ApiAuthGetUserPermissions({
      query: { appId: app.appId },
    })

    // 3. 设置权限菜单
    const menuNodes = permissionsResult.menuTree || []
    const permissionMenu = transformMenuNodes(menuNodes)
    authStore.setPermissionMenu(permissionMenu)

    // 4. 同步到侧边栏菜单
    const sideMenu = transformMenuNodesToSideMenu(permissionMenu)
    layoutStore.setNavigation({ sideMenu })

    console.log('已更新侧边栏菜单:', sideMenu)

    // 5. 调用成功回调
    dialogData.value.onSelect?.(app)

    // 6. 调用弹窗关闭方法（如果有 popupRef）
    if (props.popupRef) {
      props.popupRef.close()
    }

    ElMessage.success(`已进入应用: ${app.appName}`)
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    ElMessage.error(err?.response?.data?.message || err?.message || '切换应用失败')
  }
}

/**
 * 将权限菜单节点转换为 auth-store 格式
 */
function transformMenuNodes(nodes: PermissionTreeNodeDto[]): any[] {
  return nodes.map(node => ({
    id: node.id,
    permName: node.permName,
    permCode: node.permCode,
    routePath: node.routePath,
    iconName: node.iconName,
    children: node.children ? transformMenuNodes(node.children) : undefined,
  }))
}

/**
 * 加载用户应用列表
 */
async function loadAppList() {
  loading.value = true
  try {
    const result = await new ApiAuthGetUserApps({})
    appList.value = Array.isArray(result) ? result : (result as any)?.list || []

    // 如果只有一个应用，自动选择
    if (appList.value.length === 1) {
      await handleSelectApp(appList.value[0])
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    ElMessage.error(err?.response?.data?.message || err?.message || '加载应用列表失败')
    appList.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 关闭弹窗（供 MfwPopup 调用）
 */
function onCancel() {
  if (dialogData.value.forceSelect && appList.value.length > 0) {
    ElMessage.warning('请选择一个应用')
    throw new Error('请选择一个应用')
  }
  dialogData.value.onClose?.()
}

// 组件挂载时加载数据
onMounted(() => {
  loadAppList()
})

// 导出方法供 MfwPopup 调用
defineExpose({
  onCancel,
  onConfirm: handleSelectApp,
})
</script>

<style scoped lang="scss" src="./style.scss"></style>