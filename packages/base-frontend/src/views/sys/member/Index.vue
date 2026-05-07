<!--
/**
 * @fileoverview 成员管理列表页面
 * @description 管理应用实例下的成员及其角色分配
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
        <el-button type="primary" data-testid="member-create-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          添加成员
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
import { MfwPageWrapper, MfwListPage } from '../../../components';
import type { MfwListPageInstance } from '../../../components/page/list-page/types';
import { MfwPopup } from '../../../components/feedback';
import { renderActionButtons } from '../../../components/table/action-buttons';
import type { ImageResource } from '../../../components/upload/types';
import {
  ApiAppMemberGetMembers,
  ApiAppMemberRemoveMember,
} from '../../../apis/sys';
import type { MemberResponseDto } from '../../../apis/sys/schemas';
import AddMemberForm from './AddMemberForm.vue';
import RoleAssignForm from './RoleAssignForm.vue';
import { useAuthStore } from '../../../store/auth-store';
import { IsBuiltinDict, IsOwnerDict } from 'moyan-shared-dict';

function extractAvatarUrl(avatar: string | ImageResource | undefined): string | undefined {
  if (!avatar) return undefined;
  if (typeof avatar === 'string') return avatar;
  return avatar.src;
}

defineOptions({ name: 'MfwMemberList' });

const authStore = useAuthStore();
const listPage = ref<MfwListPageInstance>();
const appId = computed(() => authStore.currentApp?.appId || '');

/** 表格列 */
const columns = [
  {
    prop: 'avatar',
    label: '头像',
    width: 80,
    render: ({ row }: { row: MemberResponseDto }) => h(ElAvatar, {
      size: 40,
      src: extractAvatarUrl(row.avatar),
    }, () => row.nickname?.charAt(0) || row.username?.charAt(0) || '?'),
  },
  {
    prop: 'nickname',
    label: '昵称',
    minWidth: 120,
    render: ({ row }: { row: MemberResponseDto }) => row.nickname || '-',
  },
  {
    prop: 'username',
    label: '用户名',
    minWidth: 120,
    render: ({ row }: { row: MemberResponseDto }) => row.username || '-',
  },
  {
    prop: 'phone',
    label: '手机号',
    minWidth: 120,
    render: ({ row }: { row: MemberResponseDto }) => row.phone || '-',
  },
  {
    prop: 'roles',
    label: '角色',
    minWidth: 200,
    render: ({ row }: { row: MemberResponseDto }) => h('div', { class: 'role-tags' },
      (row.roles || []).map((r) =>
        h(ElTag, {
          key: r.roleId,
          type: r.isBuiltin === IsBuiltinDict.YES ? 'warning' : 'primary',
          size: 'small',
          style: 'margin-right: 4px',
        }, () => r.roleName)
      ),
    ),
  },
];

/** 操作列 */
const isNotOwner = (row: MemberResponseDto) => Number(row.isOwner) === IsOwnerDict.YES;

const actionColumn = {
  prop: 'action',
  label: '操作',
  width: 150,
  fixed: 'right' as const,
  render: ({ row }: { row: MemberResponseDto }) => renderActionButtons([
    { label: '分配角色', type: 'primary', icon: Edit, onClick: handleEditRoles, permission: ['编辑'], disabled: isNotOwner, testId: 'member-assign-role-btn' },
    { label: '移除', type: 'danger', icon: Delete, onClick: handleRemove, permission: ['删除'], disabled: isNotOwner, testId: 'member-remove-btn' },
  ], {}, row),
};

/** 加载数据 */
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

/** 添加成员 */
const handleAdd = () => {
  MfwPopup.open({
    title: '添加成员',
    type: 'dialog',
    component: AddMemberForm,
    data: { appId: appId.value },
    popupProps: { width: 500 },
    on: { confirm: listPage.value?.refresh },
  });
};

/** 分配角色 */
const handleEditRoles = (row: MemberResponseDto) => {
  MfwPopup.open({
    title: '分配角色',
    type: 'dialog',
    component: RoleAssignForm,
    data: { appId: appId.value, member: row },
    popupProps: { width: 500 },
    on: { confirm: listPage.value?.refresh },
  });
};

/** 移除成员 */
const handleRemove = async (row: MemberResponseDto) => {
  try {
    await ElMessageBox.confirm(
      `确定要将「${row.nickname || row.username}」从应用中移除吗？`,
      '确认移除',
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