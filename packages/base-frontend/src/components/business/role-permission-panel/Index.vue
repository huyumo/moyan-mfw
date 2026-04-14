<!--
/**
 * @fileoverview 角色权限分配面板组件
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
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 主内容 -->
    <div v-else class="permission-content">
      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" class="permission-tabs">
        <!-- PC 权限 Tab -->
        <el-tab-pane label="PC 权限" name="pc">
          <div class="permission-tree-container">
            <el-tree
              ref="pcTreeRef"
              :data="pcPermissionTree"
              :props="treeProps"
              show-checkbox
              node-key="id"
              :default-expand-all="false"
              :expand-on-click-node="false"
            >
              <template #default="{ data }">
                <div class="tree-node-content">
                  <span class="node-label">
                    <span class="node-type-tag" :class="data.nodeType.toLowerCase()">
                      {{ data.nodeType }}
                    </span>
                    {{ data.permName }}
                  </span>
                  <span class="node-code">{{ data.permCode }}</span>
                  <!-- 配置操作权限按钮 - 只有已勾选的 PAGE/TAG 节点显示 -->
                  <el-button
                    v-if="canSetPermissionValue(data.nodeType) && getIsChecked(data.id)"
                    type="primary"
                    link
                    size="small"
                    @click.stop="handleConfigPermissionValue(data)"
                  >
                    <el-icon><Key /></el-icon> 配置操作权限
                  </el-button>
                </div>
              </template>
            </el-tree>

            <!-- 提示：无权限池数据 -->
            <el-empty v-if="pcPermissionTree.length === 0" description="该应用类型未配置 PC 权限池" />
          </div>
        </el-tab-pane>

        <!-- 普通权限 Tab -->
        <el-tab-pane label="普通权限" name="normal">
          <div class="permission-tree-container">
            <el-tree
              ref="normalTreeRef"
              :data="normalPermissionTree"
              :props="treeProps"
              show-checkbox
              node-key="id"
              :default-expand-all="false"
              :expand-on-click-node="false"
            >
              <template #default="{ data }">
                <div class="tree-node-content">
                  <span class="node-label">
                    <span class="node-type-tag" :class="data.nodeType.toLowerCase()">
                      {{ data.nodeType }}
                    </span>
                    {{ data.permName }}
                  </span>
                  <span class="node-code">{{ data.permCode }}</span>
                  <!-- 配置操作权限按钮 - 只有已勾选的 PAGE/TAG 节点显示 -->
                  <el-button
                    v-if="canSetPermissionValue(data.nodeType) && getIsChecked(data.id)"
                    type="primary"
                    link
                    size="small"
                    @click.stop="handleConfigPermissionValue(data)"
                  >
                    <el-icon><Key /></el-icon> 配置操作权限
                  </el-button>
                </div>
              </template>
            </el-tree>

            <!-- 提示：无权限池数据 -->
            <el-empty v-if="normalPermissionTree.length === 0" description="该应用类型未配置普通权限池" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElTree, ElButton, ElIcon } from 'element-plus'
import { Key } from '@element-plus/icons-vue'
import type { ElTreeInstance } from '../../../types/element-plus'
import {
  ApiAppTypeGetPermissionPool,
  ApiRoleGetRolePermissions,
  ApiRoleAssignPermissions,
} from '../../../apis/sys'
import type { PermissionItemDto, PermissionTreeNodeDto } from '../../../apis/sys/schemas'
import type { PermissionTabType, PermissionTreeNodeWithState } from './types'
import { MfwPopup } from '../../feedback'
import MfwPermissionValuePopup from './MfwPermissionValuePopup.vue'

defineOptions({ name: 'RolePermissionPanel' })

/** Props 定义 - 支持直接使用和弹窗使用两种模式 */
interface Props {
  roleId?: string
  appTypeId?: string
  data?: {
    roleId: string
    appTypeId: string
  }
}

const props = defineProps<Props>()

// 兼容弹窗模式：优先使用 data 中的值
const roleId = computed(() => props.data?.roleId || props.roleId || '')
const appTypeId = computed(() => props.data?.appTypeId || props.appTypeId || '')

/** 状态 */
const loading = ref(true)
const activeTab = ref<PermissionTabType>('pc')
const pcTreeRef = ref<ElTreeInstance>()
const normalTreeRef = ref<ElTreeInstance>()

/** 权限池数据 */
const permissionPool = ref<PermissionTreeNodeDto[]>([])
/** 角色当前权限（含 permissionValue） */
const rolePermissions = ref<PermissionItemDto[]>([])
/** 已勾选的节点 ID 集合（用于快速判断） */
const checkedNodeIds = ref<Set<string>>(new Set())

/** 树节点属性配置 */
const treeProps = {
  children: 'children',
  label: 'permName',
}

/**
 * 判断节点类型是否可以配置操作权限
 */
function canSetPermissionValue(nodeType?: string): boolean {
  return nodeType === 'PAGE' || nodeType === 'TAG'
}

/**
 * 配置操作权限
 */
function handleConfigPermissionValue(data: PermissionTreeNodeWithState) {
  MfwPopup.open({
    title: `配置操作权限 - ${data.permName}`,
    type: 'dialog',
    component: MfwPermissionValuePopup,
    data: {
      appTypeId: appTypeId.value,
      nodeId: data.id,
      nodeName: data.permName,
      nodeCode: data.permCode,
      permissionValue: data.permissionValue || '0',
    },
    popupProps: { width: 500 },
    on: {
      confirm: async (componentInstance: any) => {
        const result = await componentInstance.onConfirm()
        if (!result) return

        // 更新节点的 permissionValue（不保存，等待用户点击"保存"按钮）
        const updateNodePerm = (nodes: PermissionTreeNodeWithState[]): boolean => {
          for (const node of nodes) {
            if (node.id === result.nodeId) {
              node.permissionValue = result.permissionValue
              return true
            }
            if (node.children && updateNodePerm(node.children)) {
              return true
            }
          }
          return false
        }

        // 在两个树中查找并更新
        if (!updateNodePerm(pcPermissionTree.value)) {
          updateNodePerm(normalPermissionTree.value)
        }
      },
    },
  })
}

/** 构建 PC 权限树 */
const pcPermissionTree = computed<PermissionTreeNodeWithState[]>(() => {
  const pcItems = permissionPool.value.filter(p => p.permissionType === 'PC')
  return buildPermissionTree(pcItems)
})

/** 构建普通权限树 */
const normalPermissionTree = computed<PermissionTreeNodeWithState[]>(() => {
  const normalItems = permissionPool.value.filter(p => p.permissionType === 'NORMAL')
  return buildPermissionTree(normalItems)
})

/**
 * 将权限池数据转换为树形结构（带勾选状态）
 * 保留 API 返回的原始树形结构，只添加 checked 状态
 * 仅展示在权限池中的节点（inPool === true）
 */
function buildPermissionTree(items: PermissionTreeNodeDto[]): PermissionTreeNodeWithState[] {
  function processTree(nodes: PermissionTreeNodeDto[]): PermissionTreeNodeWithState[] {
    const result: PermissionTreeNodeWithState[] = []

    for (const node of nodes) {
      const children = node.children ? processTree(node.children) : []
      const isInPool = node.inPool === true
      const hasChildrenInPool = children.length > 0

      // 只有节点本身在池中，或者有子节点在池中，才展示该节点
      if (isInPool || hasChildrenInPool) {
        const rolePerm = rolePermissions.value.find(p => p.permissionId === node.id)
        result.push({
          ...node,
          checked: isInPool && !!rolePerm,
          expanded: false,
          permissionValue: rolePerm?.permissionValue ? String(rolePerm.permissionValue) : node.permissionValue,
          children,
        })
      }
    }

    return result
  }

  return processTree(items)
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
      ...(result.permissionTrees.pcTree || []),
      ...(result.permissionTrees.normalTree || []),
    ]
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
    rolePermissions.value = result || []
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    ElMessage.error(err?.response?.data?.message || '加载角色权限失败')
    throw error
  }
}

/**
 * 初始化数据
 */
async function initData() {
  loading.value = true
  try {
    await Promise.all([loadPermissionPool(), loadRolePermissions()])
    await nextTick()
    setTreeCheckedKeys()
  } finally {
    loading.value = false
  }
}

/**
 * 设置树的勾选状态
 */
function setTreeCheckedKeys() {
  const getCheckedIds = (permissionType: 'PC' | 'NORMAL') => {
    return rolePermissions.value
      .filter(p => permissionPool.value.some(pool => pool.id === p.permissionId && pool.permissionType === permissionType))
      .map(p => p.permissionId)
  }

  const pcIds = getCheckedIds('PC')
  const normalIds = getCheckedIds('NORMAL')

  // 更新已勾选 ID 集合
  checkedNodeIds.value = new Set([...pcIds, ...normalIds])

  if (pcTreeRef.value) {
    pcTreeRef.value.setCheckedKeys(pcIds, false)
  }
  if (normalTreeRef.value) {
    normalTreeRef.value.setCheckedKeys(normalIds, false)
  }
}

/**
 * 判断节点是否已勾选（用于显示"配置操作权限"按钮）
 */
function getIsChecked(nodeId: string): boolean {
  return checkedNodeIds.value.has(nodeId)
}

/**
 * 收集勾选的权限（支持 PC 和普通权限）
 */
function collectCheckedPermissions(treeRef: ElTreeInstance | undefined): PermissionItemDto[] {
  const permissions: PermissionItemDto[] = []

  if (!treeRef) return permissions

  const checkedNodes = treeRef.getCheckedNodes(false, false) as PermissionTreeNodeWithState[]
  for (const node of checkedNodes) {
    const poolItem = permissionPool.value.find(p => p.id === node.id)
    if (poolItem?.inPool !== true) {
      ElMessage.warning(`权限"${node.permName}"不在权限池中，已自动过滤`)
      continue
    }
    permissions.push({
      permissionId: node.id,
      permissionValue: node.permissionValue || '0',
    })
  }

  return permissions
}

/**
 * 收集所有勾选的权限
 */
function collectAllCheckedPermissions(): PermissionItemDto[] {
  const pcPerms = collectCheckedPermissions(pcTreeRef.value)
  const normalPerms = collectCheckedPermissions(normalTreeRef.value)
  return [...pcPerms, ...normalPerms]
}

/**
 * 确认保存（供 MfwPopup 调用）
 */
async function onConfirm() {
  const permissions = collectAllCheckedPermissions()

  if (permissions.length === 0) {
    ElMessage.warning('请至少选择一个权限')
    throw new Error('请至少选择一个权限')
  }

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
}

.loading-container {
  padding: 20px;
}

.permission-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.permission-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;

  .el-tabs__content {
    flex: 1;
    overflow: auto;
  }
}

.permission-tree-container {
  padding: 12px;
  max-height: 400px;
  overflow: auto;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: space-between;

  .node-label {
    display: flex;
    align-items: center;
    gap: 8px;

    .node-type-tag {
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;
      color: #fff;

      &.menu {
        background-color: var(--el-color-primary);
      }

      &.page {
        background-color: var(--el-color-success);
      }

      &.tag {
        background-color: var(--el-color-warning);
      }
    }
  }

  .node-code {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}
</style>