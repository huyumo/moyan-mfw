<template>
  <el-tree
    :data="refData"
    show-checkbox
    node-key="id"
    :default-checked-keys="checkedKeys"
    :default-expanded-keys="expandedKeys"
    @check="handleCheck"
  >
    <template #default="{ data }">
      <div class="custom-tree-node">
        <div class="custom-tree-node_left">
          <div class="perm-name">{{ data.permName }}</div>
        </div>
        <div v-if="data.checked && (data.nodeType === 'PAGE' || data.nodeType === 'TAG')" class="custom-tree-node_right" @click.stop>
          <el-checkbox
            v-for="action in getPermissionOptions(data.parentPermissionValue)"
            :key="action.value"
            :model-value="!!(getPermissionValue(data) & action.value)"
            @update:model-value="(val: boolean) => handlePermissionValueChange(data, action.value, val)"
            class="inline-permission-checkbox"
          >
            <span>{{ action.label }}</span>
          </el-checkbox>
        </div>
      </div>
    </template>
  </el-tree>
</template>
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { PropType } from 'vue';
import { CheckedInfo, ElTree, TreeKey } from 'element-plus';
import type { PermissionTreeNodeDto } from '../../../apis/sys/schemas';
import { getPermissionOptions } from '../../../utils/permissions';

defineOptions({ name: 'MfwPermissionTree' });
const emit = defineEmits(['update:modelValue']);
const { modelValue } = defineProps({
  modelValue: {
    type: Object as PropType<PermissionTreeNodeDto[]>,
    default: () => [],
  },
});

const refData = ref<PermissionTreeNodeDto[]>([]);
const checkedKeys = ref<TreeKey[]>([]);
const expandedKeys = ref<TreeKey[]>([]);

watch(
  () => modelValue,
  (newVal) => {
    refData.value = newVal;
    nextTick(() => {
      checkedKeys.value = initCheckedKeys();
      expandedKeys.value = initExpandedKeys();
    });
  },
);

/**
 * 递归构建选中节点的ID列表
 * @param node 节点数据
 * @returns 选中的节点ID列表
 */
const buildCheckedKeys = (node: PermissionTreeNodeDto[]) => {
  const checkedKeys: TreeKey[] = [];
  node.forEach((item) => {
    if (item.children) {
      checkedKeys.push(...buildCheckedKeys(item.children));
    } else if (item.checked) {
      checkedKeys.push(item.id);
    }
  });
  return checkedKeys;
};

const handleCheckedKeys = (checkedKeys: TreeKey[], tree: PermissionTreeNodeDto[]) => {
  tree.forEach((item) => {
    if (item.children) {
      handleCheckedKeys(checkedKeys, item.children);
    }
    item.checked = checkedKeys.includes(item.id);
  });
};

const handleCheck = (_: PermissionTreeNodeDto, e: CheckedInfo) => {
  const { checkedKeys: newCheckedKeys, halfCheckedKeys } = e;
  handleCheckedKeys([...newCheckedKeys, ...halfCheckedKeys], refData.value);
  nextTick(() => {
    emit('update:modelValue', refData.value);
  });
};

/** 初始化选中节点的ID列表 */
const initCheckedKeys = () => {
  const checkedKeys: TreeKey[] = buildCheckedKeys(refData.value);
  return checkedKeys;
};

/** 初始化展开节点的ID列表（展开第一级，显示第二级） */
const initExpandedKeys = () => {
  return refData.value.map((node) => node.id);
};

/**
 * 获取节点的权限值
 * @param data 节点数据
 */
const getPermissionValue = (data: PermissionTreeNodeDto): number => {
  return typeof data.permissionValue === 'string' ? parseInt(data.permissionValue, 10) : (data.permissionValue || 0);
};

/**
 * 处理权限值变化
 * @param data 节点数据
 * @param actionValue 操作权限值
 * @param checked 是否选中
 */
const handlePermissionValueChange = (data: PermissionTreeNodeDto, actionValue: number, checked: boolean) => {
  let currentValue = getPermissionValue(data);
  if (checked) {
    currentValue = currentValue | actionValue;
  } else {
    currentValue = currentValue & ~actionValue;
  }
  data.permissionValue = String(currentValue);
  emit('update:modelValue', refData.value);
};
</script>

<style scoped lang="scss">
.custom-tree-node {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.custom-tree-node_left {
  flex: 1;
  display: flex;
  align-items: center;
  .perm-name {
    padding-left: 8px;
  }
}
.custom-tree-node_right {
  display: flex;
  align-items: center;
  gap: 4px;

  .inline-permission-checkbox {
    margin-right: 0;
    --el-checkbox-height: 20px;
    --el-checkbox-font-size: 12px;

    :deep(.el-checkbox__label) {
      font-size: 12px;
    }
  }
}
</style>
