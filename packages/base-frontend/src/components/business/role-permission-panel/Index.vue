<!--
/**
 * @fileoverview RolePermissionPanel 角色权限分配面板组件
 * @description 用于给角色分配权限，支持 PC 权限和普通权限两种类型
 *
 * @example
 * ```vue
 * <RolePermissionPanel
 *   :role-id="role.id"
 *   :app-type-id="role.appTypeId"
 * />
 * ```
 */
-->
<template>
  <div class="role-permission-panel">
    <!-- 使用统一的权限树组件 -->
    <MfwPermissionTree
      :pc-tree-data="pcTreeData"
      :normal-tree-data="normalTreeData"
      :pool-data="permissionPool"
      :checked-ids="checkedIds"
      mode="role"
      :loading="loading"
      @check-change="checkedIds = $event"
      @permission-value-change="handlePermissionValueChange"
    />

    <!-- 底部操作按钮 -->
    <div v-if="!hideFooter" class="panel-footer">
      <ElButton type="primary" :loading="saving" @click="onConfirm">
        保存
      </ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import {
  ApiAppTypeGetPermissionPool,
  ApiRoleGetRolePermissions,
  ApiRoleAssignPermissions,
} from '../../../apis/sys'
import type { PermissionItemDto, PermissionTreeNodeDto } from '../../../apis/sys/schemas'
import { MfwPermissionTree } from '../permission-tree/mod'

defineOptions({ name: 'RolePermissionPanel' })

/** Props 定义 - 支持直接使用和弹窗使用两种模式 */
interface Props {
  roleId?: string
  appTypeId?: string
  data?: {
    roleId: string
    appTypeId: string
  }
  hideFooter?: boolean
}

const props = defineProps<Props>()

// 兼容弹窗模式：优先使用 data 中的值
const roleId = computed(() => props.data?.roleId || props.roleId || '')
const appTypeId = computed(() => props.data?.appTypeId || props.appTypeId || '')

/** 状态 */
const loading = ref(true)
const saving = ref(false)

/** 权限池数据 */
const permissionPool = ref<PermissionTreeNodeDto[]>([])

/** 已勾选的权限 ID */
const checkedIds = ref<string[]>([])

/** 权限值映射（nodeId -> permissionValue） */
const permissionValues = ref<Map<string, string>>(new Map())

/** 处理后的树数据 */
const pcTreeData = ref<PermissionTreeNodeDto[]>([])
const normalTreeData = ref<PermissionTreeNodeDto[]>([])

/**
 * 初始化数据
 */
async function initData() {
  loading.value = true
  try {
    await Promise.all([loadPermissionPool(), loadRolePermissions()])
  } finally {
    loading.value = false
  }
}

/**
 * 加载权限池数据
 */
async function loadPermissionPool() {
  if (!appTypeId.value) return

  try {
    const result = await new ApiAppTypeGetPermissionPool({
      query: { appTypeId: appTypeId.value },
    })
    permissionPool.value = [
      ...(result.permissionTrees?.pcTree || []),
      ...(result.permissionTrees?.normalTree || []),
    ]
    pcTreeData.value = result.permissionTrees?.pcTree || []
    normalTreeData.value = result.permissionTrees?.normalTree || []
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    ElMessage.error(err?.response?.data?.message || '加载权限池失败')
    throw error
  }
}

/**
 * 加载角色当前权限
 */
async function loadRolePermissions() {
  if (!roleId.value) return

  try {
    const result = await new ApiRoleGetRolePermissions({
      query: { id: roleId.value },
    })
    const rolePerms = (result || []) as PermissionItemDto[]

    // 设置已勾选的权限 ID
    checkedIds.value = rolePerms.map(p => p.permissionId)

    // 设置权限值映射
    permissionValues.value = new Map(
      rolePerms.map(p => [p.permissionId, String(p.permissionValue || '0')])
    )
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    ElMessage.error(err?.response?.data?.message || '加载角色权限失败')
    throw error
  }
}

/**
 * 处理 permissionValue 变化
 */
function handlePermissionValueChange(nodeId: string, permissionValue: string) {
  permissionValues.value.set(nodeId, permissionValue)
}

/**
 * 收集所有勾选的权限
 */
function collectCheckedPermissions(): PermissionItemDto[] {
  const permissions: PermissionItemDto[] = []

  // 递归收集树的勾选节点
  const collectFromTree = (nodes: PermissionTreeNodeDto[]) => {
    for (const node of nodes) {
      if (checkedIds.value.includes(node.id)) {
        permissions.push({
          permissionId: node.id,
          permissionValue: permissionValues.value.get(node.id) || '0',
        })
      }
      if (node.children && node.children.length > 0) {
        collectFromTree(node.children)
      }
    }
  }

  collectFromTree(pcTreeData.value)
  collectFromTree(normalTreeData.value)

  return permissions
}

/**
 * 确认保存（供 MfwPopup 调用）
 */
async function onConfirm() {
  const permissions = collectCheckedPermissions()

  if (permissions.length === 0) {
    ElMessage.warning('请至少选择一个权限')
    throw new Error('请至少选择一个权限')
  }

  saving.value = true
  try {
    await new ApiRoleAssignPermissions({
      query: { id: roleId.value },
      params: { permissions },
    })
    ElMessage.success('权限分配成功')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    ElMessage.error(err?.response?.data?.message || '权限分配失败')
    throw error
  } finally {
    saving.value = false
  }
}

// 监听 roleId 和 appTypeId 变化
watch([roleId, appTypeId], () => {
  initData()
})

// 组件挂载时初始化
onMounted(() => {
  initData()
})

// 导出 onConfirm 方法供 MfwPopup 调用
defineExpose({
  onConfirm,
})
</script>

<style scoped lang="scss">
.role-permission-panel {
  height: 100%;
  display: flex;
  flex-direction: column;

  .panel-footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 16px;
    border-top: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }
}
</style>
