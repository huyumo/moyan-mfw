<!--
/**
 * @fileoverview ��Ա�����б�ҳ��
 * @description ����Ӧ��ʵ���µĳ�Ա�����ɫ����
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
        <el-button type="primary" data-testid="member-create-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          ���ӳ�Ա
        </el-button>
      </template>
    <MfwListPage
      ref="listPage"
      :show-search="false"
      :columns="columns"
      :action-column="actionColumn"
      :load-data="loadData"
    >
    </MfwListPage>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h, computed } from 'vue';
import { ElMessageBox, ElTag, ElAvatar } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { MfwPageWrapper, MfwListPage, MfwDictFormat } from '../../../../components';
import type { MfwListPageInstance } from '../../../../components/page/list-page/types';
import { MfwPopup } from '../../../../components/feedback';
import { renderActionButtons } from '../../../../components/table/action-buttons';
import type { ImageResource } from '../../../../components/upload/types';
import {
  ApiAppMemberGetMembers,
  ApiAppMemberRemoveMember,
} from '../../../../apis/sys';
import type { MemberResponseDto } from '../../../../apis/sys/schemas';
import AddMemberForm from './AddMemberForm.vue';
import RoleAssignForm from './RoleAssignForm.vue';
import { useAuthStore } from '../../../../store/auth-store';
import { IsBuiltinDict, IsOwnerDict, toItems } from '../../../../../shared/src';
import { useRoute, useRouter } from 'vue-router';

function extractAvatarUrl(avatar: string | ImageResource | undefined): string | undefined {
  if (!avatar) return undefined;
  if (typeof avatar === 'string') return avatar;
  return avatar.src;
}

defineOptions({ name: 'MfwMemberList' });
const route = useRoute();

const authStore = useAuthStore();
const listPage = ref<MfwListPageInstance>();
const appId = computed(() => 
  route.query.appId as string | undefined || 
  authStore.currentApp?.appId || ''
);

/** ������ */
const columns = [
  {
    prop: 'avatar',
    label: 'ͷ��',
    width: 80,
    render: ({ row }: { row: MemberResponseDto }) => h(ElAvatar, {
      size: 40,
      src: extractAvatarUrl(row.avatar),
    }, () => row.nickname?.charAt(0) || row.username?.charAt(0) || '?'),
  },
  {
    prop: 'nickname',
    label: '�ǳ�',
    minWidth: 120,
    render: ({ row }: { row: MemberResponseDto }) => row.nickname || '-',
  },
  {
    prop: 'username',
    label: '�û���',
    minWidth: 120,
    render: ({ row }: { row: MemberResponseDto }) => row.username || '-',
  },
  {
    prop: 'phone',
    label: '�ֻ���',
    minWidth: 120,
    render: ({ row }: { row: MemberResponseDto }) => row.phone || '-',
  },
  {
    prop: 'roles',
    label: '��ɫ',
    minWidth: 200,
    render: ({ row }: { row: MemberResponseDto }) => h('div', { class: 'role-tags' },
      (row.roles || []).map((r) =>
        h(MfwDictFormat, {
          value: r.isBuiltin,
          dict: toItems(IsBuiltinDict),
          asTag: true,
          key: r.roleId,
          style: 'margin-right: 4px',
        }, () => r.roleName)
      ),
    ),
  },
];

/** ������ */
const isNotOwner = (row: MemberResponseDto) => Number(row.isOwner) === IsOwnerDict.YES;

const actionColumn = {
  prop: 'action',
  label: '����',
  width: 150,
  fixed: 'right' as const,
  render: ({ row }: { row: MemberResponseDto }) => renderActionButtons([
    { label: '�����ɫ', type: 'primary', icon: Edit, onClick: handleEditRoles, permission: ['�༭'], disabled: isNotOwner, testId: 'member-assign-role-btn' },
    { label: '�Ƴ�', type: 'danger', icon: Delete, onClick: handleRemove, permission: ['ɾ��'], disabled: isNotOwner, testId: 'member-remove-btn' },
  ], {}, row),
};

/** �������� */
const loadData = async (params: Record<string, any>) => {
  if (!appId.value) {
    return { list: [], total: 0 };
  }
  return await new ApiAppMemberGetMembers({
    params: { appId: appId.value },
    query: {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      ...params,
    },
  });
};

/** ���ӳ�Ա */
const handleAdd = () => {
  MfwPopup.open({
    title: '���ӳ�Ա',
    type: 'dialog',
    component: AddMemberForm,
    data: { appId: appId.value },
    popupProps: { width: 500 },
    on: { confirm: listPage.value?.refresh },
  });
};

/** �����ɫ */
const handleEditRoles = (row: MemberResponseDto) => {
  MfwPopup.open({
    title: '�����ɫ',
    type: 'dialog',
    component: RoleAssignForm,
    data: { appId: appId.value, member: row },
    popupProps: { width: 500 },
    on: { confirm: listPage.value?.refresh },
  });
};

/** �Ƴ���Ա */
const handleRemove = async (row: MemberResponseDto) => {
  try {
    await ElMessageBox.confirm(
      `ȷ��Ҫ����${row.nickname || row.username}����Ӧ�����Ƴ���`,
      'ȷ���Ƴ�',
      { type: 'warning' }
    );
  } catch {
    return;
  }
  await new ApiAppMemberRemoveMember({
    params: { appId: appId.value, userId: row.userId },
  }, { hintSuccess: true });
  listPage.value?.refresh();
};
</script>

<style scoped lang="scss">
.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>