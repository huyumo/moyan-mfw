<!--
/**
 * @fileoverview MfwPermissionTree 权限树通用组件
 * @description 纯 UI 组件，用于展示和选择权限树，支持 permissionValue 配置
 *
 * @example
 * ```vue
 * <MfwPermissionTree
 *   :tree-data="treeData"
 *   :checked-ids="checkedIds"
 *   mode="pool"
 *   @check-change="handleCheckChange"
 *   @permission-value-change="handlePermissionValueChange"
 * />
 * ```
 */
-->

<script setup lang="tsx">
import { ref, computed, watch } from 'vue'
import { ElTree, ElButton, ElEmpty, ElIcon, ElTabs, ElTabPane } from 'element-plus'
import { Key } from '@element-plus/icons-vue'
import type { PermissionTreeNodeDto } from '../../../apis/sys/schemas'
import { MfwPopup } from '../../feedback'
import { MfwPermissionValuePopup } from '../permission-value-popup'

// ========== 类型定义 ==========

export type PermissionTreeMode = 'pool' | 'role'

export interface PermissionTreeProps {
  /** PC 权限树数据 */
  pcTreeData: PermissionTreeNodeDto[]
  /** 普通权限树数据 */
  normalTreeData: PermissionTreeNodeDto[]
  /** 权限池数据（用于 role 模式，过滤可选权限） */
  poolData?: PermissionTreeNodeDto[]
  /** 已勾选的权限 ID 集合 */
  checkedIds?: string[]
  /** 模式：pool=权限池配置，role=角色权限分配 */
  mode: PermissionTreeMode
  /** 是否只读 */
  readonly?: boolean
  /** 加载中 */
  loading?: boolean
}

export interface PermissionTreeEmits {
  /** 勾选变化 */
  (e: 'check-change', checkedIds: string[]): void
  /** permissionValue 变化 */
  (e: 'permission-value-change', nodeId: string, permissionValue: string): void
}

// ========== Props & Emits ==========

const props = withDefaults(defineProps<PermissionTreeProps>(), {
  checkedIds: () => [],
  poolData: () => [],
  readonly: false,
  loading: false,
})

const emit = defineEmits<PermissionTreeEmits>()

defineOptions({ name: 'MfwPermissionTree' })

// ========== 状态 ==========

const activeTab = ref<'pc' | 'normal'>('pc')
const pcTreeRef = ref<InstanceType<typeof ElTree>>()
const normalTreeRef = ref<InstanceType<typeof ElTree>>()

// 处理后的树数据（含勾选状态和 permissionValue）
const pcTreeNodes = ref<PermissionTreeNodeDto[]>([])
const normalTreeNodes = ref<PermissionTreeNodeDto[]>([])

// ========== 辅助函数 ==========

/**
 * 判断节点类型是否可以配置操作权限
 */
function canSetPermissionValue(nodeType?: string): boolean {
  return nodeType === 'PAGE' || nodeType === 'TAG'
}

/**
 * 获取节点类型对应的 Tag 类型
 */
function getNodeTypeTagType(nodeType: string): 'primary' | 'success' | 'warning' | 'info' {
  switch (nodeType) {
    case 'MENU': return 'primary'
    case 'PAGE': return 'success'
    case 'TAG': return 'warning'
    default: return 'info'
  }
}

/**
 * 构建树节点（优先使用后端返回的 checked 字段）
 * @description 如果后端已返回 checked 字段，直接使用；否则从 checkedIds 映射
 */
function buildTreeNodes(
  nodes: PermissionTreeNodeDto[],
  checkedIds: string[]
): (PermissionTreeNodeDto & { checked: boolean; children?: (PermissionTreeNodeDto & { checked: boolean })[] })[] {
  return nodes.map(node => {
    // 优先使用后端返回的 checked 字段，否则从 checkedIds 映射
    const checked = node.checked !== undefined ? node.checked : checkedIds.includes(node.id)
    return {
      ...node,
      checked,
      children: node.children ? buildTreeNodes(node.children, checkedIds) : [],
    }
  })
}

/**
 * 收集所有已勾选的节点 ID（包括子节点）
 */
function collectCheckedIds(nodes: (PermissionTreeNodeDto & { checked?: boolean })[]): string[] {
  const ids: string[] = []
  const collect = (list: (PermissionTreeNodeDto & { checked?: boolean })[]) => {
    for (const node of list) {
      if (node.checked) {
        ids.push(node.id)
      }
      if (node.children && node.children.length > 0) {
        collect(node.children as (PermissionTreeNodeDto & { checked?: boolean })[])
      }
    }
  }
  collect(nodes)
  return ids
}

/**
 * 展开节点及其所有父节点
 */
function expandNodeAndParents(treeRef: InstanceType<typeof ElTree> | undefined, nodeId: string) {
  if (!treeRef) return
  const node = treeRef.getNode(nodeId)
  if (!node) return

  // 展开当前节点
  treeRef.expand(nodeId)

  // 递归展开父节点
  let parent = node.parent
  while (parent && parent.id !== node.root) {
    treeRef.expand(parent.id)
    parent = parent.parent
  }
}

/**
 * 配置操作权限
 */
function handleConfigPermissionValue(data: PermissionTreeNodeDto, treeType: 'pc' | 'normal') {
  MfwPopup.open({
    title: `配置操作权限 - ${data.permName}`,
    type: 'dialog',
    component: MfwPermissionValuePopup,
    data: {
      nodeId: data.id,
      nodeName: data.permName,
      nodeCode: data.permCode,
      permissionValue: data.permissionValue || '0',
      mode: props.mode,
      poolData: props.poolData,
    },
    popupProps: { width: 500 },
    on: {
      confirm: async (componentInstance: any) => {
        const result = await componentInstance.onConfirm()
        if (!result) return
        emit('permission-value-change', result.nodeId, result.permissionValue)
      },
    },
  })
}

// ========== 监听数据变化 ==========

watch(
  () => [props.pcTreeData, props.checkedIds] as const,
  ([newTreeData]) => {
    pcTreeNodes.value = buildTreeNodes(newTreeData, props.checkedIds || [])
  },
  { immediate: true }
)

watch(
  () => [props.normalTreeData, props.checkedIds] as const,
  ([newTreeData]) => {
    normalTreeNodes.value = buildTreeNodes(newTreeData, props.checkedIds || [])
  },
  { immediate: true }
)

// 监听 checkedIds 变化，同步更新 ElTree 的勾选状态
// 注意：不使用 setCheckedKeys 避免重置树的展开状态

// ========== 暴露方法 ==========

defineExpose({
  /** 获取 PC 权限树引用 */
  pcTreeRef,
  /** 获取普通权限树引用 */
  normalTreeRef,
  /** 设置勾选状态 */
  setCheckedKeys: (keys: string[]) => {
    pcTreeRef.value?.setCheckedKeys(keys)
    normalTreeRef.value?.setCheckedKeys(keys)
  },
})
</script>

<template>
  <div class="mfw-permission-tree">
    <!-- 加载状态 -->
    <el-skeleton v-if="loading" animated :rows="10" />

    <!-- 空状态 -->
    <el-empty
      v-else-if="!loading && pcTreeData.length === 0 && normalTreeData.length === 0"
      description="暂无权限数据"
    />

    <!-- 主内容 -->
    <div v-else class="tree-content">
      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" class="permission-tabs">
        <!-- PC 权限 Tab -->
        <el-tab-pane label="PC 权限" name="pc">
          <div class="tree-container">
            <el-tree
              ref="pcTreeRef"
              :data="pcTreeNodes"
              :props="{ children: 'children', label: 'permName' }"
              node-key="id"
              show-checkbox
              :default-expand-all="false"
              :expand-on-click-node="false"
              :default-checked-keys="checkedIds"
              :disabled="readonly"
              @check="(_, { checkedKeys, node }) => {
                emit('check-change', checkedKeys as string[])
                // 展开被勾选的节点及其父节点
                if (node) {
                  expandNodeAndParents(pcTreeRef.value, node.id)
                }
              }"
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
                  <!-- 配置操作权限按钮 -->
                  <el-button
                    v-if="!readonly && canSetPermissionValue(data.nodeType) && data.checked"
                    type="primary"
                    link
                    size="small"
                    @click.stop="handleConfigPermissionValue(data, 'pc')"
                  >
                    <el-icon><Key /></el-icon>
                    <template v-if="$slots['permission-value-label']">
                      <slot name="permission-value-label" :node="data" />
                    </template>
                    <template v-else>
                      配置操作权限
                    </template>
                  </el-button>
                </div>
              </template>
            </el-tree>

            <!-- 空状态提示 -->
            <el-empty
              v-if="pcTreeData.length === 0"
              :description="mode === 'pool' ? '暂无 PC 权限数据' : '该应用类型未配置 PC 权限池'"
            />
          </div>
        </el-tab-pane>

        <!-- 普通权限 Tab -->
        <el-tab-pane label="普通权限" name="normal">
          <div class="tree-container">
            <el-tree
              ref="normalTreeRef"
              :data="normalTreeNodes"
              :props="{ children: 'children', label: 'permName' }"
              node-key="id"
              show-checkbox
              :default-expand-all="false"
              :expand-on-click-node="false"
              :default-checked-keys="checkedIds"
              :disabled="readonly"
              @check="(_, { checkedKeys, node }) => {
                emit('check-change', checkedKeys as string[])
                // 展开被勾选的节点及其父节点
                if (node) {
                  expandNodeAndParents(normalTreeRef.value, node.id)
                }
              }"
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
                  <!-- 配置操作权限按钮 -->
                  <el-button
                    v-if="!readonly && canSetPermissionValue(data.nodeType) && data.checked"
                    type="primary"
                    link
                    size="small"
                    @click.stop="handleConfigPermissionValue(data, 'normal')"
                  >
                    <el-icon><Key /></el-icon>
                    <template v-if="$slots['permission-value-label']">
                      <slot name="permission-value-label" :node="data" />
                    </template>
                    <template v-else>
                      配置操作权限
                    </template>
                  </el-button>
                </div>
              </template>
            </el-tree>

            <!-- 空状态提示 -->
            <el-empty
              v-if="normalTreeData.length === 0"
              :description="mode === 'pool' ? '暂无普通权限数据' : '该应用类型未配置普通权限池'"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mfw-permission-tree {
  height: 100%;
  display: flex;
  flex-direction: column;

  .tree-content {
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
        gap: 8px;
        width: 100%;
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
    }
  }
}
</style>
