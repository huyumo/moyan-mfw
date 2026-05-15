<!--
/**
 * @fileoverview Ӧ������������
 * @description �Կ�Ƭ����չʾӦ��ʵ��������Ϣ
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
  { key: 'appType', label: 'Ӧ������', icon: Folder },
  { key: 'owner', label: 'ӵ����', icon: User },
  { key: 'appDesc', label: 'Ӧ������', icon: Document },
  { key: 'sortOrder', label: '�����', icon: Sort },
  { key: 'createdAt', label: '����ʱ��', icon: Calendar, format: 'date' },
  { key: 'updateAt', label: '����ʱ��', icon: Calendar, format: 'date' },
];
</script>