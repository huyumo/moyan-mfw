<!--
/**
 * @fileoverview Ӧ���������鵯�����
 * @description ʹ�õ��������ʾӦ�����ͻ�����Ϣ��Ȩ�޳����á����ý�ɫ
 */
-->
<template>
  <div class="app-type-detail-popup">
    <el-descriptions :column="1" border size="small">
      <el-descriptions-item label="��������">
        {{ data?.typeName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="���ͱ���">
        {{ data?.typeCode || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="��������">
        {{ data?.typeDesc || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="ͼ��">
        {{ data?.icon || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="֧�ֶ�Ӧ��">
        <MfwDictFormat :value="data?.multiAppEnabled" :dict="toItems(MultiAppEnabledDict)" as-tag />
      </el-descriptions-item>
      <el-descriptions-item label="״̬">
        <MfwDictFormat :value="data?.typeStatus" :dict="toItems(StatusDict)" as-tag />
      </el-descriptions-item>
      <el-descriptions-item label="����">
        {{ data?.sortOrder || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="����ʱ��">
        <mfw-date-format :value="data?.createdAt" />
      </el-descriptions-item>
      <el-descriptions-item label="����ʱ��">
        <mfw-date-format :value="data?.updateAt" />
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup lang="ts">
import type { AppTypeResponseDto } from '../../../../apis/sys/schemas';
import { MfwDictFormat } from '../../../../components';
import { toItems, StatusDict, MultiAppEnabledDict } from '../../../../../shared/src';

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
