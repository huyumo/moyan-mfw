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
import { getPermissionOptions } from '../../../utils/permissions';
import { ApiAppTypeUpdatePermissionPool, ApiAppTypeGetPermissionPool, ApiPermissionFindById } from '../../../apis/sys';
import type { PermissionTreePayloadDto } from '../../../apis/sys/schemas';
import { PermBit, PermBitDesc } from './types'

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

    // 提取所有已配置的权限位（遍历 PermBit 的值）
    for (const bit of Object.values(PermBit)) {
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
 * 只返回修改后的 permissionValue，由主组件处理提交
 */
const onConfirm = async () => {
  if (!appTypeId.value || !nodeId.value) {
    ElMessage.error('参数不完整');
    return;
  }

  const newValue = selectedActions.value.reduce((acc, val) => acc | val, 0);

  // 返回修改后的值，由主组件处理提交
  return {
    nodeId: nodeId.value,
    permissionValue: String(newValue),
  };
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
