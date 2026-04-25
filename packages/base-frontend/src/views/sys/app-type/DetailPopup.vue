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
        <mfw-date-format :value="data?.createdAt" />
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        <mfw-date-format :value="data?.updateAt" />
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup lang="ts">
import type { AppTypeResponseDto } from '../../../apis/sys/schemas';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineProps<{
  data?: AppTypeResponseDto | null;
}>();
</script>

<style scoped lang="scss">
.app-type-detail-popup {
  padding: 20px;

  :deep(.el-descriptions__label) {
    width: 120px;
    font-weight: 500;
  }
}
</style>
