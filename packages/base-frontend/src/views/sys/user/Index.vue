<!--
/**
 * @fileoverview 用户管理列表页面
 * @description 管理系统用户，支持新建、编辑、状态管理、密码重置
 */
-->
<template>
  <MfwPageWrapper>
    <MfwListPage ref="listPage" :search-template="searchTemplate" :columns="columns" :action-column="actionColumn"
      :load-data="loadData">
      <template #search-actions="{ loading }">
        <el-button type="primary" :loading="loading" data-testid="user-create-btn" @click="handleAdd">
          <el-icon>
            <Plus />
          </el-icon>
          新建用户
        </el-button>
      </template>
    </MfwListPage>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { ElMessage, ElMessageBox, ElTag, ElButton, ElSwitch } from 'element-plus';
import { Plus, Edit, Delete, Lock } from '@element-plus/icons-vue';
import MfwPageWrapper from '../../../components/page/page-wrapper';
import MfwListPage from '../../../components/page/list-page';
import type { MfwListPageInstance } from '../../../components/page/list-page/types';
import { MfwPopup } from '../../../components/feedback';
import {
  ApiUserFindAll,
  ApiUserDelete,
  ApiUserUpdateStatus,
  ApiUserResetPassword,
} from '../../../apis/sys';
import type { UserResponseDto } from '../../../apis/sys/schemas';
import UserForm from './UserForm.vue';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

/** 性别常量 */
const GENDER = {
  UNKNOWN: 0,
  MALE: 1,
  FEMALE: 2,
} as const;

/** 性别文本映射 */
const GENDER_TEXT = {
  [GENDER.UNKNOWN]: '未知',
  [GENDER.MALE]: '男',
  [GENDER.FEMALE]: '女',
} as const;

defineOptions({ name: 'MfwUserList' });

const listPage = ref<MfwListPageInstance>();

/** 搜索模板 */
const searchTemplate = [
  {
    key: 'username',
    label: '用户名',
    type: 'input' as const,
    placeholder: '请输入用户名',
  },
  {
    key: 'phone',
    label: '手机号',
    type: 'input' as const,
    placeholder: '请输入手机号',
  },
  {
    key: 'userStatus',
    label: '状态',
    type: 'select' as const,
    placeholder: '请选择状态',
    elProps: {
      options: [
        { label: '启用', value: STATUS.ENABLED },
        { label: '禁用', value: STATUS.DISABLED },
      ],
    },
  },
];

/** 表格列 */
const columns = [
  { prop: 'username', label: '用户名', minWidth: 120 },
  { prop: 'nickname', label: '昵称', minWidth: 120 },
  { prop: 'phone', label: '手机号', minWidth: 130 },
  { prop: 'email', label: '邮箱', minWidth: 180 },
  {
    prop: 'gender',
    label: '性别',
    width: 80,
    render: ({ row }: { row: UserResponseDto }) => GENDER_TEXT[row.gender as keyof typeof GENDER_TEXT] || '未知',
  },
  {
    prop: 'isDeveloper',
    label: '开发者',
    width: 80,
    render: ({ row }: { row: UserResponseDto }) => row.isDeveloper ? '是' : '否',
  },
  {
    prop: 'userStatus',
    label: '状态',
    width: 100,
    render: ({ row }: { row: UserResponseDto }) => h(ElSwitch, {
      modelValue: row.userStatus === STATUS.ENABLED,
      size: 'small',
      onChange: (val: string | number | boolean) => handleStatusChange(row, Boolean(val)),
    }),
  },
  { prop: 'createdAt', label: '创建时间', width: 180 },
];

/** 操作列 */
const actionColumn = {
  prop: 'action',
  label: '操作',
  width: 180,
  fixed: 'right' as const,
  render: ({ row }: { row: UserResponseDto }) => h('div', { class: 'action-buttons' }, [
    h(ElButton, {
      type: 'primary',
      link: true,
      icon: Edit,
      onClick: () => handleEdit(row),
    }, () => '编辑'),
    h(ElButton, {
      type: 'warning',
      link: true,
      icon: Lock,
      onClick: () => handleResetPassword(row),
    }, () => '重置密码'),
    h(ElButton, {
      type: 'danger',
      link: true,
      icon: Delete,
      onClick: () => handleDelete(row),
    }, () => '删除'),
  ]),
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
    on: {
      confirm: () => {
        ElMessage.success('创建成功');
        listPage.value?.refresh();
      },
    },
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
    on: {
      confirm: () => {
        ElMessage.success('更新成功');
        listPage.value?.refresh();
      },
    },
  });
};

/** 状态切换 */
const handleStatusChange = async (row: UserResponseDto, enabled: boolean) => {
  const status = enabled ? STATUS.ENABLED : STATUS.DISABLED;
  await new ApiUserUpdateStatus({
    params: { id: row.id },
    query: { status }
  }, { hintSuccess: true, successMsg: () => enabled ? '已启用' : '已禁用', hintFail: true, failMsg: '状态更新失败' });
  listPage.value?.refresh();
};

/** 重置密码 */
const handleResetPassword = async (row: UserResponseDto) => {
  try {
    const { value } = await ElMessageBox.prompt(
      `请输入用户「${row.username}」的新密码`,
      '重置密码',
      {
        inputPattern: /^.{6,20}$/,
        inputErrorMessage: '密码长度需为 6-20 个字符',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    );
    await new ApiUserResetPassword({
      params: { id: row.id },
      query: { password: value }
    },{hintSuccess:true,successMsg:'密码重置成功'});
  } catch {
    // 用户取消
  }
};

/** 删除 */
const handleDelete = async (row: UserResponseDto) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户「${row.username}」吗？`,
      '确认删除',
      { type: 'warning' }
    );
    await new ApiUserDelete({ params: { id: row.id } },{hintSuccess:true,successMsg:'删除成功'});
    listPage.value?.refresh();
  } catch {
    // 用户取消
  }
};
</script>

<style scoped lang="scss">
.action-buttons {
  display: flex;
  gap: 8px;
}
</style>