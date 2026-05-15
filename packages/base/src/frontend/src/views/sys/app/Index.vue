?<!--
/**
 * @fileoverview Ӧ��ʵ�������б�ҳ��
 * @description ����Ӧ��ʵ���Ĵ������༭��ɾ����ӵ���߹���
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" data-testid="app-create-btn" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        �½�Ӧ��
      </el-button>
    </template>

    <MfwListPage
      ref="listPage"
      :search-template="searchTemplate"
      :columns="columns"
      :action-column="actionColumn"
      :load-data="loadData"
    />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { ElMessageBox, ElTag, ElAvatar } from 'element-plus';
import { Plus, View, Edit, Delete, User, Picture } from '@element-plus/icons-vue';
import { MfwPageWrapper, MfwListPage, MfwDateFormat, MfwDictFormat } from '../../../../components';
import type { MfwListPageInstance } from '../../../../components/page/list-page/types';
import { MfwPopup } from '../../../../components/feedback';
import { renderActionButtons } from '../../../../components/table/action-buttons';
import {
  ApiAppFindAll,
  ApiAppDelete,
  ApiAppTypeFindAllList,
  ApiAppFindById,
} from '../../../../apis/sys';
import type { AppDetailResponseDto, AppTypeResponseDto } from '../../../../apis/sys/schemas';
import AppForm from './AppForm.vue';
import AppDetail from './AppDetail.vue';
import { OwnerChanger } from '../../../../components/business';
import { getImageSrc } from '../../../../utils/image';
import { toItems, StatusDict } from '../../../../../shared/src';

defineOptions({ name: 'MfwAppList' });

const listPage = ref<MfwListPageInstance>();

/** Ӧ�������б�����������ģ�壩 */
const appTypeList = ref<AppTypeResponseDto[]>([]);

/** ����ģ�� */
const searchTemplate = ref([
  {
    key: 'appName',
    label: 'Ӧ������',
    type: 'input' as const,
    testId: 'app-search-name',
    placeholder: '������Ӧ������',
  },
  {
    key: 'appCode',
    label: 'Ӧ�ñ���',
    type: 'input' as const,
    testId: 'app-search-code',
    placeholder: '������Ӧ�ñ���',
  },
  {
    key: 'appTypeId',
    label: 'Ӧ������',
    type: 'select' as const,
    testId: 'app-search-type',
    placeholder: '��ѡ��Ӧ������',
    elProps: {
      options: [] as { label: string; value: string }[],
    },
  },
  {
    key: 'appStatus',
    label: '״̬',
    type: 'select' as const,
    testId: 'app-search-status',
    placeholder: '��ѡ��״̬',
    elProps: {
      options: toItems(StatusDict),
    },
  },
]);

/** ������ */
const columns = [
  {
    prop: 'logo',
    label: 'Logo',
    width: 60,
    align: 'center' as const,
    render: ({ row }: { row: AppDetailResponseDto }) => h(ElAvatar, { size: 36, src: getImageSrc(row.logo), icon: Picture, shape: 'square' }),
  },
  { prop: 'appName', label: 'Ӧ������', minWidth: 150 },
  { prop: 'appCode', label: 'Ӧ�ñ���', minWidth: 120 },
  {
    prop: 'appType',
    label: 'Ӧ������',
    minWidth: 120,
    render: ({ row }: { row: AppDetailResponseDto }) => (row.appType as any)?.typeName || '-',
  },
  {
    prop: 'owner',
    label: 'ӵ����',
    minWidth: 120,
    render: ({ row }: { row: AppDetailResponseDto }) => (row.owner as any)?.nickname || (row.owner as any)?.username || '-',
  },
  {
    prop: 'appStatus',
    label: '״̬',
    width: 80,
    render: ({ row }: { row: AppDetailResponseDto }) => h(MfwDictFormat, { value: row.appStatus, dict: toItems(StatusDict), asTag: true }),
  },
  { prop: 'sortOrder', label: '����', width: 80 },
  {
    prop: 'createdAt',
    label: '����ʱ��',
    width: 180,
    render: ({ row }: { row: AppDetailResponseDto }) => h(MfwDateFormat, { value: row.createdAt }),
  },
];

/** ������ */
const actionColumn = {
  prop: 'action',
  label: '����',
  width: 200,
  fixed: 'right' as const,
  render: ({ row }: { row: AppDetailResponseDto }) => renderActionButtons([
    { label: '����', type: 'primary', icon: View, onClick: handleDetail, testId: 'app-detail-btn' },
    { label: '�༭', type: 'primary', icon: Edit, onClick: handleEdit, permission: ['�༭'], testId: 'app-edit-btn' },
    { label: 'ӵ����', type: 'warning', icon: User, onClick: handleOwner, permission: ['�༭'], testId: 'app-owner-btn', visible: (row: AppDetailResponseDto) => row.appCode !== 'system-instance' },
    { label: 'ɾ��', type: 'danger', icon: Delete, onClick: handleDelete, permission: ['ɾ��'], testId: 'app-delete-btn', visible: (row: AppDetailResponseDto) => row.appCode !== 'system-instance' },
  ], { maxVisible: 2 }, row),
};

/** ����Ӧ�������б� */
const loadAppTypes = async () => {
  const result = await new ApiAppTypeFindAllList({});
  appTypeList.value = result || [];

  // ��������ģ���Ӧ������ѡ��
  const typeOptions = (result || []).map((item: AppTypeResponseDto) => ({
    label: item.typeName,
    value: item.id,
  }));
  if (searchTemplate.value[2]?.elProps) {
    searchTemplate.value[2].elProps.options = typeOptions;
  }
};

/** �������� */
const loadData = async (params: Record<string, unknown>) => {
  return await new ApiAppFindAll({
    query: {
      page: params.page as number,
      pageSize: params.pageSize as number,
      appName: params.appName as string,
      appCode: params.appCode as string,
      appTypeId: params.appTypeId as string,
      appStatus: params.appStatus as number,
    },
  });
};

/** �鿴���� */
const handleDetail = async (row: AppDetailResponseDto) => {
  const detail = await new ApiAppFindById({ params: { id: row.id } });
  MfwPopup.open({
    title: 'Ӧ������',
    type: 'drawer',
    component: AppDetail,
    data: detail,
    footer: false,
    popupProps: { size: 500 },
  });
};

/** �½� */
const handleAdd = () => {
  MfwPopup.open({
    title: '�½�Ӧ��',
    type: 'dialog',
    component: AppForm,
    popupProps: { width: 550 },
    on: { confirm: listPage.value?.refresh },
  });
};

/** �༭ */
const handleEdit = (row: AppDetailResponseDto) => {
  MfwPopup.open({
    title: '�༭Ӧ��',
    type: 'dialog',
    component: AppForm,
    data: { ...row },
    popupProps: { width: 550 },
    on: { confirm: listPage.value?.refresh },
  });
};

/** ɾ�� */
const handleDelete = async (row: AppDetailResponseDto) => {
  try {
    await ElMessageBox.confirm(
      `ȷ��Ҫɾ��Ӧ�á�${row.appName}����`,
      'ȷ��ɾ��',
      { type: 'warning' }
    );
  } catch {
    return;
  }
  await new ApiAppDelete({ params: { id: row.id } }, { hintSuccess: true });
  listPage.value?.refresh();
};

/** ӵ���߹��� */
const handleOwner = (row: AppDetailResponseDto) => {
  const owner = (row.owner as any) || {};
  MfwPopup.open({
    title: `���ӵ���� �� ${row.appName}`,
    type: 'dialog',
    component: OwnerChanger,
    data: {
      appId: row.id,
      appName: row.appName,
      currentOwnerId: owner.id || row.ownerId,
      currentOwnerName: owner.nickname || owner.username || '',
    },
    popupProps: { width: 480 },
    on: { confirm: listPage.value?.refresh },
  });
};

onMounted(() => {
  loadAppTypes();
});
</script>

