<!--
/**
 * @fileoverview 用户管理列表页面
 * @description 管理系统用户，支持新建、编辑、状态管理、密码重置
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" data-testid="user-create-btn" v-permission="{ value: ['添加'] }" @click="handleAdd">
        <el-icon>
          <Plus />
        </el-icon>
        新建
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
import { MfwPageWrapper, MfwListPage, MfwDateFormat, MfwDictFormat } from '../../../components';
import type { MfwListPageInstance } from '../../../components/page/list-page/types';
import { toItems, StatusDict, GenderDict, DeveloperDict } from 'moyan-mfw-base/shared'
import { MfwPopup } from '../../../components/feedback';
import { renderActionButtons } from '../../../components/table/action-buttons';
import { getImageSrc } from '../../../utils/image';
import {
  ApiUserFindAll,
  ApiUserDelete,
  ApiUserUpdateStatus,
  ApiUserResetPassword,
} from '../../../apis/sys';
import type { UserResponseDto } from '../../../apis/sys/schemas';
import UserForm from './UserForm.vue';

defineOptions({ name: 'MfwUserList' });

const listPage = ref<MfwListPageInstance>();

/** 搜索模板 */
const searchTemplate = [
  {
    key: 'username',
    label: '用户名',
    type: 'input' as const,
    testId: 'user-search-name',
    placeholder: '请输入用户名',
  },
  {
    key: 'phone',
    label: '手机号',
    type: 'input' as const,
    testId: 'user-search-phone',
    placeholder: '请输入手机号',
  },
  {
    key: 'userStatus',
    label: '状态',
    type: 'select' as const,
    testId: 'user-search-status',
    placeholder: '请选择状态',
    elProps: {
      options: toItems(StatusDict)
    },
  },
];

/** 表格列 */
const columns = [
  {
    prop: 'avatar',
    label: '头像',
    width: 60,
    align: 'center' as const,
    render: ({ row }: { row: UserResponseDto }) => h(ElAvatar, { size: 36, src: getImageSrc(row.avatar), icon: User }),
  },
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'nickname', label: '昵称', minWidth: 120 },
  { prop: 'phone', label: '手机号', minWidth: 130 },
  // { prop: 'email', label: '邮箱', minWidth: 180 },
  {
    prop: 'gender',
    label: '性别',
    width: 80,
    align: 'center' as const,
    render: ({ row }: { row: UserResponseDto }) => h(MfwDictFormat, { value: row.gender, dict: toItems(GenderDict), asTag: true }),
  },
  {
    prop: 'isDeveloper',
    label: '开发者',
    width: 80,
    align: 'center' as const,
    render: ({ row }: { row: UserResponseDto }) => h(MfwDictFormat, { value: Number(row.isDeveloper), dict: toItems(DeveloperDict), asTag: true }),
  },
  {
    prop: 'userStatus',
    label: '状态',
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
    label: '创建时间',
    width: 180,
    render: ({ row }: { row: UserResponseDto }) => h(MfwDateFormat, { value: row.createdAt }),
  },
];

/** 操作列 */
const actionColumn = {
  prop: 'action',
  label: '操作',
  width: 200,
  fixed: 'right' as const,
  render: ({ row }: { row: UserResponseDto }) => renderActionButtons([
    { label: '编辑', type: 'primary', icon: Edit, onClick: handleEdit, permission: ['编辑'], testId: 'user-edit-btn' },
    { label: '重置密码', type: 'warning', icon: Lock, onClick: handleResetPassword, permission: ['编辑'], testId: 'user-reset-pwd-btn' },
    { label: '删除', type: 'danger', icon: Delete, onClick: handleDelete, permission: ['删除'], testId: 'user-delete-btn', visible: (row: UserResponseDto) => row.username !== 'admin' },
  ], { maxVisible: 2 }, row),
};

/** 加载数据 */
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

/** 新建 */
const handleAdd = () => {
  MfwPopup.open({
    title: '新建用户',
    type: 'dialog',
    component: UserForm,
    popupProps: { width: 500 },
    on: { confirm: listPage.value?.refresh },
  });
};

/** 编辑 */
const handleEdit = (row: UserResponseDto) => {
  MfwPopup.open({
    title: '编辑用户',
    type: 'dialog',
    component: UserForm,
    data: { ...row },
    popupProps: { width: 500 },
    on: { confirm: listPage.value?.refresh },
  });
};

/** 状态切换 */
const handleStatusChange = async (row: UserResponseDto, enabled: boolean) => {
  const status = enabled ? StatusDict.ENABLED : StatusDict.DISABLED;
  await new ApiUserUpdateStatus({
    params: { id: row.id },
    body: { status }
  }, { hintSuccess: true, successMsg: () => enabled ? '已启用' : '已禁用', hintFail: true, failMsg: '状态更新失败' });
  listPage.value?.refresh();
};

/** 重置密码 */
const handleResetPassword = async (row: UserResponseDto) => {

  await ElMessageBox.prompt(
    `请输入用户「${row.username}」的新密码`,
    '重置密码',
    {
      inputPattern: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, // 仅允许字母和数字，最长20位
      inputErrorMessage: '密码必须包含至少一个字母和一个数字，且长度不少于 6 位',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }
  ).then(async ({ value }) => {
    await new ApiUserResetPassword({
      params: { id: row.id },
      body: { password: value }
    }, { hintSuccess: true, successMsg: '密码重置成功' });
  })
};

/** 删除 */
const handleDelete = async (row: UserResponseDto) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户「${row.username}」吗？`,
      '确认删除',
      { type: 'warning' }
    );
  } catch {
    return;
  }
  await new ApiUserDelete({ params: { id: row.id } }, { hintSuccess: true, successMsg: '删除成功' });
  listPage.value?.refresh();
};
</script>
