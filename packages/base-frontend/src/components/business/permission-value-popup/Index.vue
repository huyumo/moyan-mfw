<!--
/**
 * @fileoverview 权限值配置通用弹窗组件
 * @description 用于配置 permissionValue，支持权限池和角色权限两种模式
 *
 * - pool 模式：从权限定义中选择 permissionValue
 * - role 模式：从权限池的 permissionValue 中选择子集
 */
-->
<template>
  <div class="permission-value-popup">
    <p class="node-code">权限编码：{{ nodeCode }}</p>
    <p class="permission-range" v-if="availablePermissionValues.length > 0">
      可选权限：{{ availablePermissionValues.map(v => PermBitDesc[String(v)]).join('、') }}
    </p>
    <el-divider />
    <div class="permission-actions">
      <el-checkbox-group v-model="selectedActions">
        <el-checkbox
          v-for="action in availablePermissionOptions"
          :key="action.value"
          :label="action.value"
          border
          class="permission-checkbox"
        >
          <div class="checkbox-content">
            <el-icon><component :is="action.icon" /></el-icon>
            <span>{{ action.label }}</span>
          </div>
        </el-checkbox>
      </el-checkbox-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPermissionOptions } from '../../../utils/permissions'
import { ApiPermissionFindById, ApiAppTypeGetPermissionPool } from '../../../apis/sys'
import { PermBit, PermBitDesc } from '../../picker/permission-pool-panel/types'

defineOptions({ name: 'MfwPermissionValuePopup' })

interface PermissionValuePopupProps {
  data?: {
    nodeId: string
    nodeName?: string
    nodeCode?: string
    permissionValue?: string
    mode?: 'pool' | 'role'
    appTypeId?: string
    poolData?: any[]
  }
}

const props = defineProps<PermissionValuePopupProps>()

const nodeCode = computed(() => props.data?.nodeCode || '')
const permissionValue = computed(() => props.data?.permissionValue)
const mode = computed(() => props.data?.mode || 'pool')
const nodeId = computed(() => props.data?.nodeId || '')
const appTypeId = computed(() => props.data?.appTypeId || '')

const selectedActions = ref<number[]>([])
const availablePermissionValues = ref<number[]>([])

// 根据模式生成可选权限选项
const availablePermissionOptions = computed(() => {
  const allOptions = getPermissionOptions()
  if (availablePermissionValues.value.length === 0) {
    return allOptions
  }
  return allOptions.filter(option => availablePermissionValues.value.includes(option.value))
})

onMounted(async () => {
  // pool 模式：从权限定义获取 permissionValue
  if (mode.value === 'pool') {
    try {
      const permissionDetail = await new ApiPermissionFindById({
        query: { id: nodeId.value },
      })

      const permValue = permissionDetail?.permissionValue ? BigInt(String(permissionDetail.permissionValue)) : 0n

      // 提取所有已配置的权限位
      for (const bit of Object.values(PermBit)) {
        if ((permValue & bit) !== 0n) {
          availablePermissionValues.value.push(Number(bit))
        }
      }
    } catch (error) {
      console.error('获取权限详情失败:', error)
      availablePermissionValues.value = Object.values(PermBit).map(Number)
    }
  }
  // role 模式：从权限池获取 permissionValue
  else if (mode.value === 'role' && appTypeId.value) {
    try {
      const poolResult = await new ApiAppTypeGetPermissionPool({
        query: { appTypeId: appTypeId.value },
      })

      // 递归查找节点在权限池中的 permissionValue
      const findNodeInPool = (nodes: any[], targetId: string): bigint | null => {
        for (const node of nodes) {
          if (node.id === targetId) {
            return node.permissionValue ? BigInt(String(node.permissionValue)) : null
          }
          if (node.children) {
            const result = findNodeInPool(node.children, targetId)
            if (result !== null) return result
          }
        }
        return null
      }

      const allNodes = [
        ...(poolResult.permissionTrees?.pcTree || []),
        ...(poolResult.permissionTrees?.normalTree || []),
      ]

      const poolPermissionValue = findNodeInPool(allNodes, nodeId.value)

      if (poolPermissionValue !== null) {
        // 提取权限池中该节点的所有权限位
        for (const bit of Object.values(PermBit)) {
          if ((poolPermissionValue & bit) !== 0n) {
            availablePermissionValues.value.push(Number(bit))
          }
        }
      } else {
        availablePermissionValues.value = Object.values(PermBit).map(Number)
      }
    } catch (error) {
      console.error('获取权限池配置失败:', error)
      availablePermissionValues.value = Object.values(PermBit).map(Number)
    }
  }

  // 初始化选中的权限位
  const currentValue = typeof permissionValue.value === 'string'
    ? parseInt(permissionValue.value, 10)
    : (permissionValue.value || 0)

  selectedActions.value = availablePermissionValues.value.filter(value => (currentValue & value) !== 0)
})

/**
 * 更新权限值
 */
const onConfirm = async () => {
  if (!nodeId.value) {
    ElMessage.error('参数不完整')
    return
  }

  const newValue = selectedActions.value.reduce((acc, val) => acc | val, 0)

  return {
    nodeId: nodeId.value,
    permissionValue: String(newValue),
  }
}

defineExpose({ onConfirm })
</script>

<style scoped lang="scss">
.permission-value-popup {
  .node-code {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    margin: 0 0 8px;
  }

  .permission-range {
    color: var(--el-color-primary);
    font-size: 12px;
    margin: 0 0 16px;
    padding: 8px 12px;
    background: var(--el-color-primary-light-9);
    border-radius: 4px;
  }

  .permission-actions {
    .el-checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .permission-checkbox {
      margin-right: 0;

      .checkbox-content {
        display: flex;
        align-items: center;
        gap: 4px;

        .el-icon {
          font-size: 14px;
        }
      }
    }
  }
}
</style>
