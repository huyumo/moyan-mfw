<!--
/**
 * @fileoverview 同步预览组件
 * @description 用于 MfwPopup 弹窗的路由同步预览
 */
-->
<template>
  <el-table :data="syncDetails" max-height="400" data-testid="sync-preview-table">
    <el-table-column prop="type" label="类型" width="100">
      <template #default="{ row }">
        <el-tag :type="getSyncTypeTag(row.type)">{{ row.type }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="permName" label="权限名称" />
    <el-table-column prop="permCode" label="权限编码" />
    <el-table-column prop="message" label="说明" />
  </el-table>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

/** Props */
interface Props {
  data?: {
    details?: Array<{
      type: string;
      permName: string;
      permCode: string;
      message: string;
    }>;
  };
}

const props = defineProps<Props>();

/** 同步详情 */
const syncDetails = ref<Array<{
  type: string;
  permName: string;
  permCode: string;
  message: string;
}>>([]);

/** 初始化 */
onMounted(() => {
  if (props.data?.details) {
    syncDetails.value = props.data.details;
  }
});

/** 获取同步类型标签 */
const getSyncTypeTag = (type: string) => {
  switch (type) {
    case 'add': return 'success';
    case 'update': return 'warning';
    case 'remove': return 'danger';
    default: return 'info';
  }
};

/** 确认提交 */
const onConfirm = async () => {
  // TODO-TASK-2026-05-09-001: 实现同步确认逻辑
  await new Promise(resolve => setTimeout(resolve, 1000));
  ElMessage.success('同步成功');
};

defineExpose({ onConfirm });
</script>