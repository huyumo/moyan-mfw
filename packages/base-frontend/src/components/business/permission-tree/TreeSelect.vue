<template>
  <el-tree :data="refData" show-checkbox node-key="id" :default-checked-keys="checkedKeys" @check-change="handleCheckChange">
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
            v-if="data.checked && (data.nodeType ==='PAGE' || data.nodeType ==='TAG')"
            :icon="Key"
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
import { ElTree, TreeKey } from 'element-plus';
import type { PermissionTreeNodeDto } from '../../../apis/sys/schemas';
import { Key } from '@element-plus/icons-vue';
import { ref, watch ,nextTick} from 'vue';
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

watch(
  () => modelValue,
  (newVal) => {
    refData.value = newVal;
    nextTick(() => {
      checkedKeys.value = initCheckedKeys();
    });
  },
);

/**
 * 递归构建选中节点的ID列表
 * @param node 节点数据
 * @param checkedKeys 已选中的节点ID列表
 * @returns 选中的节点ID列表
 */
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

/**
 * 处理节点选中状态变化
 * @param data 节点数据
 * @param checked 是否选中
 */
const handleCheckChange = (data: PermissionTreeNodeDto, checked: boolean) => {
  data.checked = checked;
  nextTick(() => {
    emit('update:modelValue', refData.value);
  });
};
/** 初始化选中节点的ID列表 */
const initCheckedKeys = () => {
  const checkedKeys: TreeKey[] = [];
  buildCheckedKeys(refData.value, checkedKeys);
  return checkedKeys;
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
      permissiondData:{
        nodeId: data.id,
        nodeName: data.permName,
        nodeCode: data.permCode,
        permissionValue: data.permissionValue,
        parentPermissionValue: data.parentPermissionValue,
      }
    },
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
