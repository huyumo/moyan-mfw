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
      <el-checkbox-group v-model="selectedActions" data-testid="perm-value-checkbox-group">
        <el-checkbox v-for="action in slefPermissionOptions" :key="action.value" :label="action.value" border
          class="permission-checkbox">
          <div class="checkbox-content">
            <el-icon>
              <component :is="action.icon" />
            </el-icon>
            <span>{{ action.label }}</span>
          </div>
        </el-checkbox>
      </el-checkbox-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

defineOptions({ name: 'MfwPermissionValueForm' });
import { ElMessage } from 'element-plus';
import { ApiPermissionUpdate } from '../../../apis/sys';
import { getPermissionOptions } from '../../../utils/permissions';

interface PermissionValueFormProps {
  permissiondData?: {
    nodeId: string;
    nodeName?: string;
    nodeCode?: string;
    permissionValue?: string | number;
    parentPermissionValue?: string | number;
  };
  isRoot?: boolean;
  // 可选：传入自定义权限选项（支持业务项目覆盖）
  permissionOptions?: ReturnType<typeof getPermissionOptions>;
}

const newValue = ref<number>(0);

const { permissiondData, permissionOptions, isRoot } = defineProps<PermissionValueFormProps>();

// 从 data 中解构属性
const nodeId = computed(() => permissiondData?.nodeId || '');
const nodeCode = computed(() => permissiondData?.nodeCode || '');
const permissionValue = computed(() => permissiondData?.permissionValue);

// 权限操作选项（使用传入的或默认的）
const slefPermissionOptions = computed(() => permissionOptions || getPermissionOptions(permissiondData?.parentPermissionValue));

const selectedActions = ref<number[]>([]);

onMounted(() => {
  // 兼容字符串和数字类型
  const currentValue =
    typeof permissionValue.value === 'string' ? parseInt(permissionValue.value, 10) : permissionValue.value || 0;

  selectedActions.value = slefPermissionOptions.value
    .filter((action) => (currentValue & action.value) !== 0)
    .map((action) => action.value);
});

const onConfirm = async () => {
  newValue.value = selectedActions.value.reduce((acc, val) => acc | val, 0);
  if (isRoot) {
    await new ApiPermissionUpdate({
      params: { id: nodeId.value },
      body: { permissionValue: String(newValue.value) }, // 改为字符串格式
    }, { hintSuccess: true, successMsg: '操作权限已更新' });
  }
};
defineExpose({ onConfirm, newValue });
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
