<!--
  @fileoverview MfwPermissionPoolPanel 权限池配置面板
  @description 用于应用类型详情页的权限池配置，支持 PC 权限树和普通权限两个 Tab

  @example
  ```vue
  <MfwPermissionPoolPanel
    app-type-id="app-type-uuid"
    @saved="onSaved"
  />
  ```
-->

<script setup lang="tsx">
import { ref, watch, onMounted, nextTick } from 'vue'
import { ElTabs, ElTabPane, ElTree, ElCheckbox, ElButton, ElMessage, ElSkeleton, ElEmpty, ElIcon } from 'element-plus'
import type { CheckboxValueType } from 'element-plus'
import { Check, Key } from '@element-plus/icons-vue'
import type { PermissionTreeNodeDto, PermissionTreePayloadDto } from '../../../apis/sys/schemas'
import {
  PermBit,
  PermBitDesc,
  type MfwPermissionPoolPanelProps,
  type MfwPermissionPoolPanelEmits,
  type MfwPermissionPoolPanelInstance,
  type PermissionTreeNodeState,
} from './types'
import { ApiAppTypeGetPermissionPool, ApiAppTypeUpdatePermissionPool } from '../../../apis/sys'
import { MfwPopup } from '../../feedback'
import PermissionValuePoolPopup from './PermissionValuePoolPopup.vue'

// ========== Props & Emits ==========

const props = defineProps<MfwPermissionPoolPanelProps>()
const emit = defineEmits<MfwPermissionPoolPanelEmits>()

// ========== 状态 ==========

const loading = ref(false)
const saving = ref(false)
const activeTab = ref<'pc' | 'normal'>('pc')

// ElTree 引用
const pcTreeRef = ref<InstanceType<typeof ElTree>>()
const normalTreeRef = ref<InstanceType<typeof ElTree>>()

// 原始数据（从 API 加载）
const rawPcTree = ref<PermissionTreeNodeDto[]>([])
const rawNormalTree = ref<PermissionTreeNodeDto[]>([])

// 处理后的树数据（含选中状态）
const pcTreeData = ref<PermissionTreeNodeState[]>([])
const normalTreeData = ref<PermissionTreeNodeState[]>([])

// ========== 辅助函数 ==========

/**
 * 判断节点类型是否可以配置操作权限
 */
function canSetPermissionValue(nodeType?: string): boolean {
  return nodeType === 'PAGE' || nodeType === 'TAG'
}

/**
 * 配置操作权限
 */
function handleConfigPermissionValue(data: PermissionTreeNodeState, treeType: 'pc' | 'normal') {
  MfwPopup.open({
    title: `配置操作权限 - ${data.permName}`,
    type: 'dialog',
    component: PermissionValuePoolPopup,
    data: {
      appTypeId: props.appTypeId,
      nodeId: data.id,
      nodeName: data.permName,
      nodeCode: data.permCode,
      permissionValue: data.permissionValueBigInt ? String(data.permissionValueBigInt) : '0',
      treeType,
    },
    popupProps: { width: 500 },
    on: {
      confirm: async () => {
        // 重新加载数据以获取最新状态
        await loadPermissionPool()
      },
    },
  })
}

/**
 * 获取节点可用的权限位
 */
function getNodeAvailableBits(_node: PermissionTreeNodeState): bigint[] {
  // 返回所有定义的权限位，让复选框显示所有选项
  return Object.values(PermBit) as bigint[]
}

/**
 * 处理节点权限位变化
 */
function handleNodePermBitChange(
  nodeId: string,
  permBit: bigint,
  checked: boolean,
  treeType: 'pc' | 'normal'
) {
  const treeData = treeType === 'pc' ? pcTreeData.value : normalTreeData.value
  updateNodePermValue(treeData, nodeId, permBit, checked)
}

/**
 * 将 PermissionTreeNodeDto 转换为 PermissionTreeNodeState
 */
function transformTreeNode(node: PermissionTreeNodeDto): PermissionTreeNodeState {
  const permissionValueBigInt = node.permissionValue ? BigInt(String(node.permissionValue)) : undefined
  const { children, ...rest } = node

  const result: PermissionTreeNodeState = {
    ...rest,
    checked: node.inPool,
    permissionValueBigInt,
  }

  if (children && children.length > 0) {
    result.children = children.map(transformTreeNode)
  }

  return result
}

/**
 * 获取所有可选的权限位
 */
function getAvailablePermBits(value: bigint | undefined): bigint[] {
  if (!value) return []
  const bits: bigint[] = []
  for (const bit of Object.values(PermBit)) {
    if (typeof bit === 'bigint' && (value & bit) !== 0n) {
      bits.push(bit)
    }
  }
  return bits
}

/**
 * 将树节点转换为提交格式
 */
function transformToPayload(nodes: PermissionTreeNodeState[]): PermissionTreePayloadDto[] {
  return nodes.map(node => {
    const result: PermissionTreePayloadDto = {
      permissionId: node.id,
      checked: node.checked,
      permissionValue: node.checked && node.permissionValueBigInt
        ? String(node.permissionValueBigInt)
        : undefined,
    }
    if (node.children && node.children.length > 0) {
      result.children = transformToPayload(node.children)
    }
    return result
  })
}

/**
 * 处理节点勾选事件 - 勾选父节点时全选子节点
 * ElTree @check 事件：(checkedKeys, { checkedKeys, halfCheckedKeys, nodes })
 */
function handlePcTreeCheck(checkedKeys: string[] | { checkedKeys: string[] }, obj: {
  checkedKeys: string[]
  halfCheckedKeys: string[]
  nodes: any
}) {
  // 兼容处理：如果第一个参数是对象，使用 obj.checkedKeys
  const actualCheckedKeys = Array.isArray(checkedKeys) ? checkedKeys : obj?.checkedKeys || []

  // 同步 PC Tree 内部数据状态（用于提交时的数据）
  const updateNodesCheckedState = (nodes: PermissionTreeNodeState[]) => {
    nodes.forEach(node => {
      const newChecked = actualCheckedKeys.includes(node.id)
      node.checked = newChecked
      if (!newChecked) {
        node.permissionValueBigInt = undefined
      }
      if (node.children && node.children.length > 0) {
        updateNodesCheckedState(node.children)
      }
    })
  }

  updateNodesCheckedState(pcTreeData.value)
}

/**
 * 处理节点勾选事件 - 勾选父节点时全选子节点
 */
function handleNormalTreeCheck(checkedKeys: string[] | { checkedKeys: string[] }, obj: {
  checkedKeys: string[]
  halfCheckedKeys: string[]
  nodes: any
}) {
  // 兼容处理：如果第一个参数是对象，使用 obj.checkedKeys
  const actualCheckedKeys = Array.isArray(checkedKeys) ? checkedKeys : obj?.checkedKeys || []

  // 同步 Normal Tree 内部数据状态（用于提交时的数据）
  const updateNodesCheckedState = (nodes: PermissionTreeNodeState[]) => {
    nodes.forEach(node => {
      const newChecked = actualCheckedKeys.includes(node.id)
      node.checked = newChecked
      if (!newChecked) {
        node.permissionValueBigInt = undefined
      }
      if (node.children && node.children.length > 0) {
        updateNodesCheckedState(node.children)
      }
    })
  }

  updateNodesCheckedState(normalTreeData.value)
}

/**
 * 递归更新节点的 checked 状态
 */
function updateNodeCheckedState(node: PermissionTreeNodeState, checkedKeys: string[]) {
  node.checked = checkedKeys.includes(node.id)
  if (!node.checked) {
    node.permissionValueBigInt = undefined
  }
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      updateNodeCheckedState(child, checkedKeys)
    }
  }
}

/**
 * 递归更新节点的 checked 状态
 * 勾选父节点时自动全选子节点
 */
function updateNodeChecked(nodes: PermissionTreeNodeState[], nodeId: string, checked: boolean): boolean {
  const updateNode = (node: PermissionTreeNodeState): boolean => {
    if (node.id === nodeId) {
      node.checked = checked
      // 如果取消勾选，清空 permissionValue
      if (!checked) {
        node.permissionValueBigInt = undefined
      }
      // 勾选父节点时，全选所有子节点
      if (checked && node.children && node.children.length > 0) {
        setAllChildrenChecked(node.children, true)
      }
      return true
    }
    if (node.children) {
      for (const child of node.children) {
        if (updateNode(child)) return true
      }
    }
    return false
  }

  for (const node of nodes) {
    if (updateNode(node)) return true
  }
  return false
}

/**
 * 递归设置所有子节点为勾选状态
 */
function setAllChildrenChecked(nodes: PermissionTreeNodeState[], checked: boolean): void {
  for (const node of nodes) {
    node.checked = checked
    if (!checked) {
      node.permissionValueBigInt = undefined
    }
    if (node.children && node.children.length > 0) {
      setAllChildrenChecked(node.children, checked)
    }
  }
}

/**
 * 更新节点的 permissionValue
 */
function updateNodePermValue(
  nodes: PermissionTreeNodeState[],
  nodeId: string,
  permBit: bigint,
  checked: boolean
): boolean {
  for (const node of nodes) {
    if (node.id === nodeId) {
      // 只有勾选了节点才能设置 permissionValue
      if (!node.checked) return true

      // 获取原始定义的 permissionValue（限制范围）
      const originalValue = node.permissionValue ? BigInt(String(node.permissionValue)) : 0n

      // 更新 permissionValue
      if (checked) {
        // 添加权限位
        node.permissionValueBigInt = (node.permissionValueBigInt || 0n) | permBit
      } else {
        // 移除权限位
        node.permissionValueBigInt = (node.permissionValueBigInt || 0n) & ~permBit
      }

      // 确保不超过原始定义范围
      if (node.permissionValueBigInt && (node.permissionValueBigInt & originalValue) !== node.permissionValueBigInt) {
        node.permissionValueBigInt = node.permissionValueBigInt & originalValue
      }

      return true
    }
    if (node.children && updateNodePermValue(node.children, nodeId, permBit, checked)) {
      return true
    }
  }
  return false
}

// ========== 加载数据 ==========

async function loadPermissionPool() {
  if (!props.appTypeId) return

  loading.value = true
  try {
    const response = await new ApiAppTypeGetPermissionPool({
      query: { appTypeId: props.appTypeId },
    })

    rawPcTree.value = response.permissionTrees?.pcTree || []
    rawNormalTree.value = response.permissionTrees?.normalTree || []

    // 转换为内部状态
    pcTreeData.value = rawPcTree.value.map(transformTreeNode)
    normalTreeData.value = rawNormalTree.value.map(transformTreeNode)

    emit('loaded', {
      pcTree: rawPcTree.value,
      normalTree: rawNormalTree.value,
    })

    // 下一帧设置 ElTree 的 checked 状态（确保 DOM 已渲染）
    nextTick(() => {
      const pcCheckedKeys = pcTreeData.value.filter(n => n.checked).map(n => n.id)
      const normalCheckedKeys = normalTreeData.value.filter(n => n.checked).map(n => n.id)
      pcTreeRef.value?.setCheckedKeys(pcCheckedKeys)
      normalTreeRef.value?.setCheckedKeys(normalCheckedKeys)
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error('加载权限池失败')
    emit('error', err)
    ElMessage.error(err.message)
  } finally {
    loading.value = false
  }
}

// ========== 保存数据 ==========

async function savePermissionPool() {
  if (!props.appTypeId) return
  if (!validate()) return

  saving.value = true
  try {
    const response = await new ApiAppTypeUpdatePermissionPool({
      params: {
        appTypeId: props.appTypeId,
        permissionTrees: {
          pcTree: transformToPayload(pcTreeData.value),
          normalTree: transformToPayload(normalTreeData.value),
        },
      },
    })

    ElMessage.success('保存成功')
    emit('saved', {
      appTypeId: response.appTypeId,
      updatedCount: response.updatedCount,
    })
    // 重新加载以获取最新状态
    await loadPermissionPool()
  } catch (error) {
    const err = error instanceof Error ? error : new Error('保存权限池失败')
    emit('error', err)
    ElMessage.error(err.message)
  } finally {
    saving.value = false
  }
}

// ========== 验证 ==========

function validate(): boolean {
  // 检查是否有勾选的权限
  const hasChecked = (nodes: PermissionTreeNodeState[]): boolean => {
    return nodes.some(node => node.checked || (node.children && hasChecked(node.children)))
  }

  const pcHasChecked = hasChecked(pcTreeData.value)
  const normalHasChecked = hasChecked(normalTreeData.value)

  if (!pcHasChecked && !normalHasChecked) {
    ElMessage.warning('请至少选择一个权限')
    return false
  }

  return true
}

// ========== 重置 ==========

function reset() {
  pcTreeData.value = rawPcTree.value.map(transformTreeNode)
  normalTreeData.value = rawNormalTree.value.map(transformTreeNode)
}

// ========== 获取配置 ==========

function getConfig() {
  return {
    pcTree: transformToPayload(pcTreeData.value),
    normalTree: transformToPayload(normalTreeData.value),
  }
}

// ========== 暴露实例方法 ==========

defineExpose<MfwPermissionPoolPanelInstance>({
  load: loadPermissionPool,
  save: savePermissionPool,
  reset,
  getConfig,
  validate,
})

// ========== 监听 appTypeId 变化 ==========

watch(
  () => props.appTypeId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadPermissionPool()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.appTypeId) {
    loadPermissionPool()
  }
})

// ========== Tree 配置 ==========

const treeProps = {
  children: 'children',
  label: 'permName',
}
</script>

<template>
  <div class="mfw-permission-pool-panel">
    <!-- 加载状态 -->
    <ElSkeleton v-if="loading" animated :rows="10" />

    <!-- 空状态 -->
    <ElEmpty
      v-else-if="!loading && pcTreeData.length === 0 && normalTreeData.length === 0"
      description="暂无权限数据"
    />

    <!-- 主内容 -->
    <div v-else class="panel-content">
      <!-- Tab 切换 -->
      <ElTabs v-model="activeTab" class="permission-tabs">
        <ElTabPane label="PC 权限树" name="pc">
          <div class="tree-container">
            <ElTree
              ref="pcTreeRef"
              :data="pcTreeData"
              :props="treeProps"
              node-key="id"
              show-checkbox
              default-expand-all
              :expand-on-click-node="false"
              :disabled="readonly"
              @check="handlePcTreeCheck"
            >
              <template #default="{ node, data }">
                <div class="tree-node-content">
                  <span class="node-label">
                    <span class="node-type-tag" :class="data.nodeType.toLowerCase()">
                      {{ data.nodeType }}
                    </span>
                    {{ data.permName }}
                  </span>
                  <!-- 配置操作权限按钮 - 只有已勾选的 PAGE/TAG 节点显示 -->
                  <div v-if="canSetPermissionValue(data.nodeType) && node.checked" class="perm-config-action">
                    <ElButton
                      type="primary"
                      link
                      size="small"
                      @click.stop="handleConfigPermissionValue(data, 'pc')"
                    >
                      <el-icon><Key /></el-icon> 配置操作权限
                    </ElButton>
                  </div>
                </div>
              </template>
            </ElTree>
          </div>
        </ElTabPane>

        <!-- 普通权限 Tab -->
        <ElTabPane label="普通权限" name="normal">
          <div class="tree-container">
            <ElTree
              ref="normalTreeRef"
              :data="normalTreeData"
              :props="treeProps"
              node-key="id"
              show-checkbox
              default-expand-all
              :expand-on-click-node="false"
              :disabled="readonly"
              @check="handleNormalTreeCheck"
            >
              <template #default="{ node, data }">
                <div class="tree-node-content">
                  <span class="node-label">
                    <span class="node-type-tag" :class="data.nodeType.toLowerCase()">
                      {{ data.nodeType }}
                    </span>
                    {{ data.permName }}
                  </span>
                  <!-- 配置操作权限按钮 - 只有已勾选的 PAGE/TAG 节点显示 -->
                  <div v-if="canSetPermissionValue(data.nodeType) && node.checked" class="perm-config-action">
                    <ElButton
                      type="primary"
                      link
                      size="small"
                      @click.stop="handleConfigPermissionValue(data, 'normal')"
                    >
                      <el-icon><Key /></el-icon> 配置操作权限
                    </ElButton>
                  </div>
                </div>
              </template>
            </ElTree>
          </div>
        </ElTabPane>
      </ElTabs>
    </div>

    <!-- 操作按钮 -->
    <div v-if="!readonly" class="panel-footer">
      <ElButton @click="reset">重置</ElButton>
      <ElButton type="primary" :loading="saving" :icon="Check" @click="savePermissionPool">
        保存配置
      </ElButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mfw-permission-pool-panel {
  height: 100%;
  display: flex;
  flex-direction: column;

  .panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .permission-tabs {
      flex: 1;
      overflow: hidden;

      :deep(.el-tabs__content) {
        flex: 1;
        overflow: auto;
      }
    }

    .tree-container {
      padding: 12px;
      overflow: auto;

      :deep(.el-tree-node) {
        margin-bottom: 4px;
      }

      :deep(.el-tree-node__content) {
        height: auto;
        padding: 4px 0;
      }

      .tree-node-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;

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

        .perm-config-action {
          display: flex;
          align-items: center;
          gap: 4px;

          :deep(.el-button) {
            padding: 4px 8px;
            font-size: 12px;
          }
        }
      }
    }

    .panel-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 12px 16px;
      border-top: 1px solid var(--el-border-color-light);
      background: var(--el-bg-color);
    }
  }
}
</style>