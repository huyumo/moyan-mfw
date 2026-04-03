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
              @check="onPcTreeCheck"
            >
              <template #default="{ node, data }">
                <div class="tree-node-content">
                  <span class="node-label">{{ data.permName }}</span>
                  <span class="node-code">{{ data.permCode }}</span>
                  <el-tag size="small" :type="getNodeTypeTagType(data.nodeType)">
                    {{ data.nodeType }}
                  </el-tag>
                </div>
              </template>
            </el-tree>

            <!-- 提示：无权限池数据 -->
            <el-empty v-if="pcPermissionTree.length === 0" description="该应用类型未配置权限池" />
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
              @check="onNormalTreeCheck"
            >
              <template #default="{ node, data }">
                <div class="tree-node-content">
                  <span class="node-label">{{ data.permName }}</span>
                  <span class="node-code">{{ data.permCode }}</span>
                  <el-tag size="small" :type="getNodeTypeTagType(data.nodeType)">
                    {{ data.nodeType }}
                  </el-tag>
                </div>
              </template>
            </el-tree>

            <!-- 提示：无权限池数据 -->
            <el-empty v-if="normalPermissionTree.length === 0" description="该应用类型未配置权限池" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElTree } from 'element-plus'
import type { ElTreeInstance } from '../../../types/element-plus'
import {
  ApiAppTypeGetPermissionPool,
  ApiRoleGetRolePermissions,
  ApiRoleAssignPermissions,
} from '../../../apis/sys'
import type {
  PermissionPoolItemDto,
  PermissionItemDto,
} from '../../../apis/sys/schemas'
import type { PermissionTabType, PermissionTreeNodeWithState } from './types'

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

defineOptions({ name: 'RolePermissionPanel' })

// 兼容弹窗模式：优先使用 data 中的值
const roleId = computed(() => props.data?.roleId || props.roleId || '')
const appTypeId = computed(() => props.data?.appTypeId || props.appTypeId || '')

/** 状态 */
const loading = ref(true)
const activeTab = ref<PermissionTabType>('pc')
const pcTreeRef = ref<ElTreeInstance>()
const normalTreeRef = ref<ElTreeInstance>()

/** 权限池数据 */
const permissionPool = ref<PermissionPoolItemDto[]>([])
/** 角色当前权限 */
const rolePermissions = ref<PermissionItemDto[]>([])

/** 树节点属性配置 */
const treeProps = {
  children: 'children',
  label: 'permName',
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
 * 将权限池数据转换为树形结构
 */
function buildPermissionTree(items: PermissionPoolItemDto[]): PermissionTreeNodeWithState[] {
  // 创建节点映射
  const nodeMap = new Map<string, PermissionTreeNodeWithState>()
  const rootNodes: PermissionTreeNodeWithState[] = []

  // 先创建所有节点
  for (const item of items) {
    const rolePerm = rolePermissions.value.find(p => p.permissionId === item.permissionId)
    nodeMap.set(item.permissionId, {
      id: item.permissionId,
      permName: item.permName,
      permCode: item.permCode,
      permissionType: item.permissionType as 'PC' | 'NORMAL',
      nodeType: item.nodeType as 'MENU' | 'PAGE' | 'TAG',
      parentId: item.parentId,
      sortOrder: 0,
      inPool: true,
      checked: !!rolePerm,
      expanded: false,
      permissionValue: item.permissionValue,
      children: [],
    })
  }

  // 建立父子关系
  for (const item of items) {
    const node = nodeMap.get(item.permissionId)!
    if (item.parentId) {
      const parent = nodeMap.get(item.parentId)
      if (parent) {
        parent.children!.push(node)
      }
    } else {
      rootNodes.push(node)
    }
  }

  // 排序
  sortTreeNodes(rootNodes)

  return rootNodes
}

/**
 * 树节点排序
 */
function sortTreeNodes(nodes: PermissionTreeNodeWithState[]) {
  nodes.sort((a, b) => a.sortOrder - b.sortOrder)
  for (const node of nodes) {
    if (node.children?.length) {
      sortTreeNodes(node.children)
    }
  }
}

/**
 * 获取节点类型对应的 Tag 类型
 */
function getNodeTypeTagType(nodeType: string): 'primary' | 'success' | 'warning' | 'info' {
  switch (nodeType) {
    case 'MENU':
      return 'primary'
    case 'PAGE':
      return 'success'
    case 'TAG':
      return 'warning'
    default:
      return 'info'
  }
}

/**
 * 加载权限池数据
 */
async function loadPermissionPool() {
  try {
    const result = await new ApiAppTypeGetPermissionPool({
      params: { id: appTypeId.value },
    })
    permissionPool.value = result.permissions || []
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
  try {
    const result = await new ApiRoleGetRolePermissions({
      params: { id: roleId.value },
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
    // 设置树的勾选状态
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
  // 设置 PC 权限树
  if (pcTreeRef.value) {
    const checkedIds = rolePermissions.value
      .filter(p => permissionPool.value.some(pool => pool.permissionId === p.permissionId && pool.permissionType === 'PC'))
      .map(p => p.permissionId)
    pcTreeRef.value.setCheckedKeys(checkedIds, false)
  }

  // 设置普通权限树
  if (normalTreeRef.value) {
    const checkedIds = rolePermissions.value
      .filter(p => permissionPool.value.some(pool => pool.permissionId === p.permissionId && pool.permissionType === 'NORMAL'))
      .map(p => p.permissionId)
    normalTreeRef.value.setCheckedKeys(checkedIds, false)
  }
}

/**
 * PC 权限树勾选变化
 */
function onPcTreeCheck(data: PermissionTreeNodeWithState, _checkedInfo: { checkedNodes: unknown[] }) {
  // 可以在这里处理 permissionValue 的逻辑
}

/**
 * 普通权限树勾选变化
 */
function onNormalTreeCheck(data: PermissionTreeNodeWithState, _checkedInfo: { checkedNodes: unknown[] }) {
  // 可以在这里处理权限变化的逻辑
}

/**
 * 收集所有勾选的权限
 */
function collectCheckedPermissions(): PermissionItemDto[] {
  const permissions: PermissionItemDto[] = []

  // 收集 PC 权限
  if (pcTreeRef.value) {
    const checkedNodes = pcTreeRef.value.getCheckedNodes(false, false) as PermissionTreeNodeWithState[]
    for (const node of checkedNodes) {
      const poolItem = permissionPool.value.find(p => p.permissionId === node.id)
      permissions.push({
        permissionId: node.id,
        permissionValue: poolItem?.permissionValue || '0',
      })
    }
  }

  // 收集普通权限
  if (normalTreeRef.value) {
    const checkedNodes = normalTreeRef.value.getCheckedNodes(false, false) as PermissionTreeNodeWithState[]
    for (const node of checkedNodes) {
      const poolItem = permissionPool.value.find(p => p.permissionId === node.id)
      permissions.push({
        permissionId: node.id,
        permissionValue: poolItem?.permissionValue || '0',
      })
    }
  }

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

  .node-label {
    font-weight: 500;
  }

  .node-code {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}
</style>