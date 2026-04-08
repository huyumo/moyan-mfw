<!--
/**
 * @fileoverview 权限池权限值配置弹窗
 * @description 用于配置权限池中节点的 permissionValue
 * 可选值范围来自权限管理页面配置的 permissionValue
 */
-->
<template>
  <div class="permission-value-pool-popup">
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
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { PermBit, PermBitDesc, getPermissionOptions } from '../../../utils/permissions';
import { ApiAppTypeUpdatePermissionPool, ApiAppTypeGetPermissionPool, ApiPermissionFindById } from '../../../apis/sys';
import type { PermissionTreePayloadDto } from '../../../apis/sys/schemas';

interface PermissionValuePoolPopupProps {
  data?: {
    appTypeId: string;
    nodeId: string;
    nodeName?: string;
    nodeCode?: string;
    permissionValue?: string;
    treeType: 'pc' | 'normal';
  };
}

const props = defineProps<PermissionValuePoolPopupProps>();

const nodeCode = computed(() => props.data?.nodeCode || '');
const permissionValue = computed(() => props.data?.permissionValue);
const appTypeId = computed(() => props.data?.appTypeId || '');
const nodeId = computed(() => props.data?.nodeId || '');
const treeType = computed(() => props.data?.treeType || 'pc');

const selectedActions = ref<number[]>([]);
const availablePermissionValues = ref<number[]>([]);

// 根据权限管理页面配置的 permissionValue 生成可选的权限选项
const availablePermissionOptions = computed(() => {
  const allOptions = getPermissionOptions();
  if (availablePermissionValues.value.length === 0) {
    return allOptions;
  }
  return allOptions.filter(option => availablePermissionValues.value.includes(option.value));
});

onMounted(async () => {
  // 1. 先获取权限详情，得到权限管理页面配置的 permissionValue
  try {
    const permissionDetail = await new ApiPermissionFindById({
      query: { id: nodeId.value },
    });

    // 解析 permissionValue，获取已配置的权限位
    const permValue = permissionDetail?.permissionValue ? BigInt(String(permissionDetail.permissionValue)) : 0n;

    // 提取所有已配置的权限位
    for (const [bitStr, _label] of Object.entries(PermBit)) {
      const bit = BigInt(bitStr);
      if ((permValue & bit) !== 0n) {
        availablePermissionValues.value.push(Number(bit));
      }
    }
  } catch (error) {
    console.error('获取权限详情失败:', error);
    // 如果获取失败，使用所有权限位作为备选
    availablePermissionValues.value = Object.values(PermBit).map(Number);
  }

  // 2. 初始化选中的权限位
  const currentValue = typeof permissionValue.value === 'string'
    ? parseInt(permissionValue.value, 10)
    : (permissionValue.value || 0);

  selectedActions.value = availablePermissionValues.value.filter(value => (currentValue & value) !== 0);
});

/**
 * 更新权限池中的权限值
 */
const onConfirm = async () => {
  if (!appTypeId.value || !nodeId.value) {
    ElMessage.error('参数不完整');
    return;
  }

  const newValue = selectedActions.value.reduce((acc, val) => acc | val, 0);

  try {
    // 先获取当前权限池数据
    const currentPool = await new ApiAppTypeGetPermissionPool({
      query: { appTypeId: appTypeId.value },
    });

    // 更新对应节点的 permissionValue
    const updateTree = (
      nodes: PermissionTreePayloadDto[],
      targetNodeId: string
    ): PermissionTreePayloadDto[] => {
      return nodes.map(node => {
        if (node.permissionId === targetNodeId) {
          return {
            ...node,
            permissionValue: String(newValue),
          };
        }
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: updateTree(node.children, targetNodeId),
          };
        }
        return node;
      });
    };

    const updatedTrees = {
      pcTree: treeType.value === 'pc'
        ? updateTree(currentPool.permissionTrees.pcTree || [], nodeId.value)
        : (currentPool.permissionTrees.pcTree || []),
      normalTree: treeType.value === 'normal'
        ? updateTree(currentPool.permissionTrees.normalTree || [], nodeId.value)
        : (currentPool.permissionTrees.normalTree || []),
    };

    // 更新权限池
    await new ApiAppTypeUpdatePermissionPool({
      params: {
        appTypeId: appTypeId.value,
        permissionTrees: updatedTrees,
      },
    });

    ElMessage.success('操作权限已更新');
  } catch (error) {
    ElMessage.error('更新失败');
    throw error; // 抛出错误，让弹窗不关闭
  }
};

defineExpose({ onConfirm });
</script>

<style scoped lang="scss">
.permission-value-pool-popup {
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
