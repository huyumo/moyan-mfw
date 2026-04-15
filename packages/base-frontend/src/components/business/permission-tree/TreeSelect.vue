<template>
  <el-tree :data="refData" show-checkbox node-key="id" :default-checked-keys="checkedKeys" @check="handleCheckChange">
    <template #default="{ node, data }">
      <div class="custom-tree-node">
        <div class="custom-tree-node_left">
          <div class="perm-name">{{ data.permName }}</div>
        </div>
        <div class="custom-tree-node_right">
          <el-button
            link
            type="primary"
            size="mini"
            v-if="data.checked"
            :icon="Key"
            @stop.click="handlePermissionValue(data)"
          >
          </el-button>
        </div>
      </div>
    </template>
  </el-tree>
</template>
<script setup lang="ts">
import { computed, PropType } from 'vue';
import { ElTree, TreeKey } from 'element-plus';
import type { PermissionTreeNodeDto } from '../../../apis/sys/schemas';
import { Key } from '@element-plus/icons-vue';
import { ref, watch ,nextTick} from 'vue';

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

watch(
  () => modelValue,
  (newVal) => {
    refData.value = newVal;
    nextTick(() => {
      checkedKeys.value = initCheckedKeys();
    });
  },
);

const buildCheckedKeys = (node: PermissionTreeNodeDto[], checkedKeys: TreeKey[] = []) => {
  checkedKeys = checkedKeys || [];
  node.forEach((item) => {
    if (item.checked) {
      checkedKeys.push(item.id);
    }
    if (item.children) {
      buildCheckedKeys(item.children, checkedKeys);
    }
  });
  return checkedKeys;
};

const handleCheckChange = (node: any, checkeds: any) => {
  console.log(checkeds);
  const checkedNodes = checkeds.checkedNodes;
  checkedNodes.forEach((item: any) => {
    item.checked = !item.checked;
  });
  checkedKeys.value = checkeds.checkedKeys;
  emit('update:modelValue', checkedNodes.value);
};

const initCheckedKeys = () => {
  const checkedKeys: TreeKey[] = [];
  buildCheckedKeys(refData.value, checkedKeys);
  return checkedKeys;
};

const handlePermissionValue = (data: PermissionTreeNodeDto) => {
  console.log(data);
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
}
.custom-tree-node_right {
  margin-right: 10px;
  .el-button {
    height: 22px;
  }
}
</style>
