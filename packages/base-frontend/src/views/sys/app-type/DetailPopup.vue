<!--
/**
 * @fileoverview 应用类型详情弹窗组件
 * @description 使用弹窗组件显示应用类型基本信息、权限池配置、内置角色
 */
-->
<template>
  <div class="app-type-detail-popup">
    <el-descriptions :column="1" border size="small">
      <el-descriptions-item label="类型名称">
        {{ data?.typeName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="类型编码">
        {{ data?.typeCode || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="类型描述">
        {{ data?.typeDesc || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="图标">
        {{ data?.icon || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="支持多应用">
        <el-tag :type="data?.multiAppEnabled === STATUS.ENABLED ? 'success' : 'info'" size="small">
          {{ data?.multiAppEnabled === STATUS.ENABLED ? '是' : '否' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="data?.typeStatus === STATUS.ENABLED ? 'success' : 'danger'" size="small">
          {{ data?.typeStatus === STATUS.ENABLED ? '启用' : '禁用' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="排序">
        {{ data?.sortOrder || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ data?.createdAt || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ data?.updateAt || '-' }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="primary" :disabled="!data?.id" @click="handleConfigPermissionPool">
        配置权限池
      </el-button>
      <el-button :disabled="!data?.id" @click="handleConfigBuiltinRoles">
        配置内置角色
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { MfwPopup } from '../../../components/feedback';
import type { AppTypeResponseDto } from '../../../apis/sys/schemas';
import { PermissionPoolDialog } from '../../../components/business/permission-pool-dialog/mod';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

const props = defineProps<{
  data?: AppTypeResponseDto | null;
}>();

/** 配置权限池 */
const handleConfigPermissionPool = () => {
  if (!props.data?.id) {
    ElMessage.warning('请先保存应用类型');
    return;
  }
  MfwPopup.open({
    title: '配置权限池',
    type: 'dialog',
    component: PermissionPoolDialog,
    data: { appTypeId: props.data.id },
    popupProps: {
      size: '800px',
      top: '10vh',
    },
  });
};

/** 配置内置角色 */
const handleConfigBuiltinRoles = () => {
  if (!props.data?.id) {
    ElMessage.warning('请先保存应用类型');
    return;
  }
  ElMessage.info('内置角色配置功能开发中...');
  // TODO-TASK-2026-04-08-001: 打开内置角色配置弹窗
};
</script>

<style scoped lang="scss">
.app-type-detail-popup {
  padding: 20px;

  :deep(.el-descriptions__label) {
    width: 120px;
    font-weight: 500;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-light);
  }
}
</style>
