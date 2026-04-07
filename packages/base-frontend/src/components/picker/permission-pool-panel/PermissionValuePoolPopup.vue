<!--
/**
 * @fileoverview 权限池权限值配置弹窗
 * @description 用于配置权限池中节点的 permissionValue
 */
-->
<template>
  <div class="permission-value-pool-popup">
    <p class="node-code">权限编码：{{ nodeCode }}</p>
    <el-divider />
    <div class="permission-actions">
      <el-checkbox-group v-model="selectedActions">
        <el-checkbox
          v-for="action in permissionOptions"
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
import { getPermissionOptions } from '../../../utils/permissions';
import { ApiAppTypeUpdatePermissionPool, ApiAppTypeGetPermissionPool } from '../../../apis/sys';
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

const permissionOptions = computed(() => getPermissionOptions());
const selectedActions = ref<number[]>([]);

onMounted(() => {
  const currentValue = typeof permissionValue.value === 'string'
    ? parseInt(permissionValue.value, 10)
    : (permissionValue.value || 0);

  selectedActions.value = permissionOptions.value
    .filter((action) => (currentValue & action.value) !== 0)
    .map((action) => action.value);
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
    margin: 0 0 16px;
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
