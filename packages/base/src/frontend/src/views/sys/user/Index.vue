<!--
/**
 * @fileoverview �û������б�ҳ��
 * @description ����ϵͳ�û���֧���½����༭��״̬��������������
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" data-testid="user-create-btn" v-permission="{ value: ['����'] }" @click="handleAdd">
        <el-icon>
          <Plus />
        </el-icon>
        �½�
      </el-button>
    </template>

    <MfwListPage ref="listPage" :search-template="searchTemplate" :columns="columns" :action-column="actionColumn"
      :load-data="loadData" />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { ElMessageBox, ElSwitch, ElAvatar } from 'element-plus';
import { Plus, Edit, Delete, Lock, User } from '@element-plus/icons-vue';
import { MfwPageWrapper, MfwListPage, MfwDateFormat, MfwDictFormat } from '../../../../components';
import type { MfwListPageInstance } from '../../../../components/page/list-page/types';
import { toItems, StatusDict, GenderDict, DeveloperDict } from '../../../../../shared/src'
import { MfwPopup } from '../../../../components/feedback';
import { renderActionButtons } from '../../../../components/table/action-buttons';
import { getImageSrc } from '../../../../utils/image';
import {
  ApiUserFindAll,
  ApiUserDelete,
  ApiUserUpdateStatus,
  ApiUserResetPassword,
} from '../../../../apis/sys';
import type { UserResponseDto } from '../../../../apis/sys/schemas';
import UserForm from './UserForm.vue';

defineOptions({ name: 'MfwUserList' });

const listPage = ref<MfwListPageInstance>();

/** ����ģ�� */
const searchTemplate = [
  {
    key: 'username',
    label: '�û���',
    type: 'input' as const,
    testId: 'user-search-name',
    placeholder: '�������û���',
  },
  {
    key: 'phone',
    label: '�ֻ���',
    type: 'input' as const,
    testId: 'user-search-phone',
    placeholder: '�������ֻ���',
  },
  {
    key: 'userStatus',
    label: '״̬',
    type: 'select' as const,
    testId: 'user-search-status',
    placeholder: '��ѡ��״̬',
    elProps: {
      options: toItems(StatusDict)
    },
  },
];

/** ������ */
const columns = [
  {
    prop: 'avatar',
    label: 'ͷ��',
    width: 60,
    align: 'center' as const,
    render: ({ row }: { row: UserResponseDto }) => h(ElAvatar, { size: 36, src: getImageSrc(row.avatar), icon: User }),
  },
  { prop: 'username', label: '�û���', minWidth: 120 },
  { prop: 'nickname', label: '�ǳ�', minWidth: 120 },
  { prop: 'phone', label: '�ֻ���', minWidth: 130 },
  // { prop: 'email', label: '����', minWidth: 180 },
  {
    prop: 'gender',
    label: '�Ա�',
    width: 80,
    align: 'center' as const,
    render: ({ row }: { row: UserResponseDto }) => h(MfwDictFormat, { value: row.gender, dict: toItems(GenderDict), asTag: true }),
  },
  {
    prop: 'isDeveloper',
    label: '������',
    width: 80,
    align: 'center' as const,
    render: ({ row }: { row: UserResponseDto }) => h(MfwDictFormat, { value: Number(row.isDeveloper), dict: toItems(DeveloperDict), asTag: true }),
  },
  {
    prop: 'userStatus',
    label: '״̬',
    width: 100,
    render: ({ row }: { row: UserResponseDto }) => h(ElSwitch, {
      modelValue: row.userStatus === StatusDict.ENABLED,
      size: 'small',
      'data-testid': 'user-status-switch',
      onChange: (val: string | number | boolean) => handleStatusChange(row, Boolean(val)),
    }),
  },
  {
    prop: 'createdAt',
    label: '����ʱ��',
    width: 180,
    render: ({ row }: { row: UserResponseDto }) => h(MfwDateFormat, { value: row.createdAt }),
  },
];

/** ������ */
const actionColumn = {
  prop: 'action',
  label: '����',
  width: 200,
  fixed: 'right' as const,
  render: ({ row }: { row: UserResponseDto }) => renderActionButtons([
    { label: '�༭', type: 'primary', icon: Edit, onClick: handleEdit, permission: ['�༭'], testId: 'user-edit-btn' },
    { label: '��������', type: 'warning', icon: Lock, onClick: handleResetPassword, permission: ['�༭'], testId: 'user-reset-pwd-btn' },
    { label: 'ɾ��', type: 'danger', icon: Delete, onClick: handleDelete, permission: ['ɾ��'], testId: 'user-delete-btn', visible: (row: UserResponseDto) => row.username !== 'admin' },
  ], { maxVisible: 2 }, row),
};

/** �������� */
const loadData = async (params: Record<string, unknown>) => {
  return await new ApiUserFindAll({
    query: {
      page: params.page as number,
      pageSize: params.pageSize as number,
      username: params.username as string,
      phone: params.phone as string,
      userStatus: params.userStatus as number,
    },
  })
};

/** �½� */
const handleAdd = () => {
  MfwPopup.open({
    title: '�½��û�',
    type: 'dialog',
    component: UserForm,
    popupProps: { width: 500 },
    on: { confirm: listPage.value?.refresh },
  });
};

/** �༭ */
const handleEdit = (row: UserResponseDto) => {
  MfwPopup.open({
    title: '�༭�û�',
    type: 'dialog',
    component: UserForm,
    data: { ...row },
    popupProps: { width: 500 },
    on: { confirm: listPage.value?.refresh },
  });
};

/** ״̬�л� */
const handleStatusChange = async (row: UserResponseDto, enabled: boolean) => {
  const status = enabled ? StatusDict.ENABLED : StatusDict.DISABLED;
  await new ApiUserUpdateStatus({
    params: { id: row.id },
    body: { status }
  }, { hintSuccess: true, successMsg: () => enabled ? '������' : '�ѽ���', hintFail: true, failMsg: '״̬����ʧ��' });
  listPage.value?.refresh();
};

/** �������� */
const handleResetPassword = async (row: UserResponseDto) => {

  await ElMessageBox.prompt(
    `�������û���${row.username}����������`,
    '��������',
    {
      inputPattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, // ��������ĸ�����֣��20λ
      inputErrorMessage: '��������������һ����ĸ��һ�����֣��ҳ��Ȳ����� 6 λ',
      confirmButtonText: 'ȷ��',
      cancelButtonText: 'ȡ��',
    }
  ).then(async ({ value }) => {
    await new ApiUserResetPassword({
      params: { id: row.id },
      body: { password: value }
    }, { hintSuccess: true, successMsg: '�������óɹ�' });
  })
};

/** ɾ�� */
const handleDelete = async (row: UserResponseDto) => {
  try {
    await ElMessageBox.confirm(
      `ȷ��Ҫɾ���û���${row.username}����`,
      'ȷ��ɾ��',
      { type: 'warning' }
    );
  } catch {
    return;
  }
  await new ApiUserDelete({ params: { id: row.id } }, { hintSuccess: true, successMsg: 'ɾ���ɹ�' });
  listPage.value?.refresh();
};
</script>
