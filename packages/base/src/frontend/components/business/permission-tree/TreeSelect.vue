<template>
  <el-tree :data="refData" show-checkbox node-key="id" :default-checked-keys="checkedKeys" :default-expanded-keys="expandedKeys" @check="handleCheck">
    <template #default="{ data }">
      <div class="custom-tree-node">
        <div class="custom-tree-node_left">
          <div class="perm-name">{{ data.permName }}</div>
        </div>
        <div class="custom-tree-node_right">
          <el-button
            link
            type="primary"
            size="mini"
            v-if="data.checked && (data.nodeType === 'PAGE' || data.nodeType === 'TAG')"
            :icon="Key"
            data-testid="tree-select-perm-btn"
            @click.stop="handlePermissionValue(data)"
          >
          </el-button>
        </div>
      </div>
    </template>
  </el-tree>
</template>
<script setup lang="ts">
import { computed, PropType } from 'vue';
import { CheckedInfo, ElTree, TreeKey } from 'element-plus';
import type { PermissionTreeNodeDto } from '../../../apis/sys/schemas';
import { Key } from '@element-plus/icons-vue';
import { ref, watch, nextTick } from 'vue';
import { MfwPopup } from '../../feedback';
import { MfwPermissionValuePanel } from '../permission-value-panel';

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
 * @param checkedKeys 已选中的节点ID列表
 * @returns 选中的节点ID列表
 */
const buildCheckedKeys = (node: PermissionTreeNodeDto[]) => {
  const checkedKeys: TreeKey[] = [];
  node.forEach((item) => {
    if (item.children) {
      checkedKeys.push(...buildCheckedKeys(item.children));
    } else if (item.checked) {
      console.log(item);
      checkedKeys.push(item.id);
    }
  });
  return checkedKeys;
};

const handleCheckedKeys = (checkedKeys: TreeKey[],tree:PermissionTreeNodeDto[]) => {
  tree.forEach((item) => {
    if (item.children) {
      handleCheckedKeys(checkedKeys,item.children)
    }
    item.checked = checkedKeys.includes(item.id);
  });
};

const handleCheck = (_: PermissionTreeNodeDto, e:CheckedInfo) => {
  const { checkedKeys,  halfCheckedKeys } = e;
  handleCheckedKeys([...checkedKeys,...halfCheckedKeys],refData.value);
  nextTick(() => {
    emit('update:modelValue', refData.value);
  });
};

/** 初始化选中节点的ID列表 */
const initCheckedKeys = () => {
  const checkedKeys: TreeKey[] = buildCheckedKeys(refData.value);
  console.log(checkedKeys);
  return checkedKeys;
};

/** 初始化展开节点的ID列表（展开第一级，显示第二级） */
const initExpandedKeys = () => {
  return refData.value.map((node) => node.id);
};

/**
 * 处理权限值配置
 * @description 点击操作权限按钮时，打开权限值配置弹窗
 * @param data 节点数据
 */
const handlePermissionValue = (data: PermissionTreeNodeDto) => {
  MfwPopup.open({
    title: `配置操作权限 - ${data.permName}`,
    type: 'dialog',
    component: MfwPermissionValuePanel,
    data: {
      permissiondData: {
        nodeId: data.id,
        nodeName: data.permName,
        nodeCode: data.permCode,
        permissionValue: data.permissionValue,
        parentPermissionValue: data.parentPermissionValue,
      },
    },
    on:{
      confirm: (ref) => {
        console.log('confirm',ref.newValue);
        data.permissionValue = ref.newValue;
      }
    }
  });
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
