<!--
/**
 * @fileoverview PermissionValue 配置弹窗
 * @description 用于配置权限节点的 permissionValue，内部直接调用 API
 */
-->
<template>
  <div class="permission-value-form">
    <p class="node-code">权限编码：{{ nodeCode }}</p>
    <el-divider />
    <div class="permission-actions">
      <el-checkbox-group v-model="selectedActions">
        <el-checkbox
          v-for="action in permissionActions"
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
import { View, CircleCheck, Edit, CircleClose, Download, Upload } from '@element-plus/icons-vue';
import { ApiPermissionUpdate } from '../../../apis/sys';

interface PermissionValueFormProps {
  data?: {
    nodeId: string;
    nodeName?: string;
    nodeCode?: string;
    permissionValue?: string | number;
  };
}

const props = defineProps<PermissionValueFormProps>();

// 从 data 中解构属性
const nodeId = computed(() => props.data?.nodeId || '');
const nodeCode = computed(() => props.data?.nodeCode || '');
const permissionValue = computed(() => props.data?.permissionValue);

// 权限操作选项
const permissionActions = [
  { label: '查看', value: 32, icon: View },
  { label: '新增', value: 1, icon: CircleCheck },
  { label: '编辑', value: 2, icon: Edit },
  { label: '删除', value: 4, icon: CircleClose },
  { label: '导出', value: 8, icon: Download },
  { label: '导入', value: 16, icon: Upload },
];

const selectedActions = ref<number[]>([]);

onMounted(() => {
  // 兼容字符串和数字类型
  const currentValue = typeof permissionValue.value === 'string'
    ? parseInt(permissionValue.value, 10)
    : (permissionValue.value || 0);
  selectedActions.value = permissionActions
    .filter((action) => (currentValue & action.value) !== 0)
    .map((action) => action.value);
});

const onConfirm = async () => {
  const newValue = selectedActions.value.reduce((acc, val) => acc | val, 0);

  await new ApiPermissionUpdate({
    query: { id: nodeId.value },
    params: { permissionValue: newValue },
  });

  ElMessage.success('操作权限已更新');
};

defineExpose({ onConfirm });
</script>

<style scoped lang="scss">
.permission-value-form {
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