<!--
/**
 * @fileoverview 应用详情面板组件
 * @description 以卡片类型展示应用实例详情信息
 */
-->
<template>
  <MfwDetailPanel
    :data="data"
    :items="detailItems"
    :columns="2"
    bordered
  >
    <template #logo="{ value }">
      <el-image
        v-if="getImageSrc(value)"
        :src="getImageSrc(value)"
        :preview-src-list="[getImageSrc(value)!]"
        fit="cover"
        style="width: 80px; height: 80px; border-radius: 8px;"
      />
      <span v-else>{{ '--' }}</span>
    </template>
    <template #appStatus="{ value }">
      <el-tag :type="value === STATUS.ENABLED ? 'success' : 'danger'" size="small">
        {{ value === STATUS.ENABLED ? '启用' : '禁用' }}
      </el-tag>
    </template>
    <template #appType="{ value }">
      {{ (value as any)?.typeName || '--' }}
    </template>
    <template #owner="{ value }">
      {{ (value as any)?.nickname || (value as any)?.username || '--' }}
    </template>
  </MfwDetailPanel>
</template>

<script setup lang="ts">
import { MfwDetailPanel } from '../../../components';
import type { DetailItem } from '../../../components/display/mfw-detail/types';
import type { AppDetailResponseDto } from '../../../apis/sys/schemas';
import { getImageSrc } from '../../../utils/image';

const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

interface Props {
  data?: AppDetailResponseDto;
}

defineProps<Props>();
defineOptions({ name: 'AppDetail' });

const detailItems: DetailItem[] = [
  { label: '应用Logo', key: 'logo', span: 2 },
  { label: '应用名称', key: 'appName' },
  { label: '应用编码', key: 'appCode' },
  { label: '应用类型', key: 'appType' },
  { label: '状态', key: 'appStatus' },
  { label: '拥有者', key: 'owner' },
  { label: '排序号', key: 'sortOrder' },
  { label: '应用描述', key: 'appDesc', span: 2 },
  { label: '创建时间', key: 'createdAt', format: 'date' },
  { label: '更新时间', key: 'updateAt', format: 'date' },
];
</script>
