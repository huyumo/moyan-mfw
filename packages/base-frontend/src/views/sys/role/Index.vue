<!--
/**
 * @fileoverview 角色管理列表页面
 * @description 管理应用级角色和内置角色
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd">
        <el-icon>
          <Plus />
        </el-icon>
        新建角色
      </el-button>
    </template>
    <MfwListPage ref="listPage" :search-template="searchTemplate" :columns="columns" :action-column="actionColumn"
      :load-data="loadData" />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h, computed } from 'vue';
import { ElMessageBox, ElTag } from 'element-plus';
import { Plus, Edit, Delete, Key } from '@element-plus/icons-vue';
import { MfwPageWrapper, MfwListPage } from '../../../components';
import type { MfwListPageInstance } from '../../../components/page/list-page/types';
import { MfwPopup } from '../../../components/feedback';
import { renderActionButtons } from '../../../components/table/action-buttons';
import { ApiRoleFindAll, ApiRoleDelete } from '../../../apis/sys';
import type { RoleResponseDto } from '../../../apis/sys/schemas';
import { RolePermissionPanel } from '../../../components/business/role-permission-panel';
import { useAuthStore } from '../../../store/auth-store';
import { RoleForm } from '../../../components/business';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'MfwRoleList' });

const authStore = useAuthStore();
const listPage = ref<MfwListPageInstance>();
const appId = computed(() => authStore.currentApp?.appId || '');

/** 搜索模板 */
const searchTemplate = [
  {
    key: 'roleName',
    label: '角色名称',
    type: 'input' as const,
    placeholder: '请输入角色名称',
  },
  {
    key: 'roleCode',
    label: '角色编码',
    type: 'input' as const,
    placeholder: '请输入角色编码',
  },
  {
    key: 'roleStatus',
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
  { prop: 'roleName', label: '角色名称', minWidth: 150 },
  { prop: 'roleCode', label: '角色编码', minWidth: 150 },
  {
    prop: 'isBuiltin',
    label: '类型',
    width: 100,
    render: ({ row }: { row: RoleResponseDto }) =>
      h(
        ElTag,
        {
          type: row.isBuiltin === STATUS.ENABLED ? 'warning' : 'primary',
          size: 'small',
        },
        () => (row.isBuiltin === STATUS.ENABLED ? '内置' : '应用级'),
      ),
  },
  {
    prop: 'isOwner',
    label: '拥有者',
    width: 80,
    render: ({ row }: { row: RoleResponseDto }) => (row.isOwner === STATUS.ENABLED ? '是' : '否'),
  },
  {
    prop: 'roleStatus',
    label: '状态',
    width: 80,
    render: ({ row }: { row: RoleResponseDto }) =>
      h(
        ElTag,
        {
          type: row.roleStatus === STATUS.ENABLED ? 'success' : 'danger',
          size: 'small',
        },
        () => (row.roleStatus === STATUS.ENABLED ? '启用' : '禁用'),
      ),
  },
  { prop: 'sortOrder', label: '排序', width: 80 },
  { prop: 'createdAt', label: '创建时间', width: 180 },
];

/** 操作列 */
const actionColumn = {
  prop: 'action',
  label: '操作',
  width: 200,
  fixed: 'right' as const,
  render: ({ row }: { row: RoleResponseDto }) => {
    const isBuiltin = row.isBuiltin === STATUS.ENABLED;
    const isOwner = row.isOwner === STATUS.ENABLED;
    return renderActionButtons([
      { label: '权限', type: 'primary', icon: Key, onClick: handlePermission, disabled: isBuiltin, permission: ['编辑'] },
      { label: '编辑', type: 'primary', icon: Edit, onClick: handleEdit, disabled: isBuiltin, permission: ['编辑'] },
      { label: '删除', type: 'danger', icon: Delete, onClick: handleDelete, disabled: isBuiltin || isOwner, permission: ['删除'] },
    ], { maxVisible: 2 }, row);
  },
};

/** 加载数据 */
const loadData = async (params: Record<string, unknown>) => {
  const result = await new ApiRoleFindAll({
    query: {
      page: params.page as number || 1,
      pageSize: params.pageSize as number || 20,
      appId: appId.value,
      ...params
    }
  });
  return {
    list: result.list || [],
    total: result.total || 0,
  };
};

/** 新建 */
const handleAdd = () => {
  MfwPopup.open({
    title: '新建角色',
    type: 'dialog',
    component: RoleForm,
    data: { appId: appId.value },
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        listPage.value?.refresh();
      },
    },
  });
};

/** 编辑 */
const handleEdit = (row: RoleResponseDto) => {
  MfwPopup.open({
    title: '编辑角色',
    type: 'dialog',
    component: RoleForm,
    data: { ...row },
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        listPage.value?.refresh();
      },
    },
  });
};

/** 分配权限 */
const handlePermission = (row: RoleResponseDto) => {
  MfwPopup.open({
    title: `分配权限 - ${row.roleName}`,
    type: 'drawer',
    position: 'rtl',
    component: RolePermissionPanel,
    data: { roleId: row.id, appTypeId: row.appTypeId },
    popupProps: { size: 500 },
    on: {
      confirm: () => {
        listPage.value?.refresh();
      },
    },
  });
};

/** 删除 */
const handleDelete = async (row: RoleResponseDto) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色「${row.roleName}」吗？`, '确认删除', { type: 'warning' });
    await new ApiRoleDelete({ params: { id: row.id } }, { hintSuccess: true });
    listPage.value?.refresh();
  } catch {
  }
};
</script>
