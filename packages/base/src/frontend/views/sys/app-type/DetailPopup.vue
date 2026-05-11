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
        <MfwDictFormat :value="data?.multiAppEnabled" :dict="toItems(MultiAppEnabledDict)" as-tag />
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <MfwDictFormat :value="data?.typeStatus" :dict="toItems(StatusDict)" as-tag />
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
import { MfwDictFormat } from '../../../components';
import { toItems, StatusDict, MultiAppEnabledDict } from 'moyan-mfw-base/shared';

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
