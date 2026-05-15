<!--
/**
 * @fileoverview 应用实例详情组件
 * @description 以卡片形式展示应用实例的详细信息
 */
-->
<template>
  <MfwCardPanel
    :header="headerConfig"
    :items="infoItems"
    :data="data"
    bordered
  >
    <template #appType="{ value }">
      {{ formatAppType(value) }}
    </template>
    <template #owner="{ value }">
      {{ value?.nickname || value?.username || '--' }}
    </template>
  </MfwCardPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { MfwCardPanel } from '../../../components';
import type { CardPanelHeader, CardPanelItem } from '../../../components/display/mfw-card-panel/types';
import type { AppDetailResponseDto } from '../../../apis/sys/schemas';
import { Folder, User, Calendar, Document, Sort } from '@element-plus/icons-vue';
import { toItems, getLabel, StatusDict } from 'moyan-mfw-base/shared';

interface Props {
  data?: AppDetailResponseDto;
}

const props = defineProps<Props>();
defineOptions({ name: 'AppDetail' });

const formatAppType = (value: any): string => {
  if (!value) return '--';
  if (typeof value === 'string') return value;
  return value?.typeName || value?.name || '--';
};

const headerConfig = computed<CardPanelHeader>(() => ({
  image: props.data?.logo,
  title: props.data?.appName || '--',
  subtitle: props.data?.appCode,
  status: props.data?.appStatus !== undefined ? {
    value: props.data.appStatus,
    type: (toItems(StatusDict).find(i => i.value === props.data!.appStatus)?.type || 'primary') as 'success' | 'warning' | 'danger' | 'info',
    text: getLabel(StatusDict, props.data.appStatus),
  } : undefined,
}));

const infoItems: CardPanelItem[] = [
  { key: 'appType', label: '应用类型', icon: Folder },
  { key: 'owner', label: '拥有者', icon: User },
  { key: 'appDesc', label: '应用描述', icon: Document },
  { key: 'sortOrder', label: '排序号', icon: Sort },
  { key: 'createdAt', label: '创建时间', icon: Calendar, format: 'date' },
  { key: 'updateAt', label: '更新时间', icon: Calendar, format: 'date' },
];
</script>
