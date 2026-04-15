<!--
/**
 * @fileoverview 角色管理列表页面
 * @description 管理应用级角色和内置角色
 */
-->
<template>
  <MfwPageScene
    ref="pageScene"
    :search-template="searchTemplate"
    :columns="columns"
    :action-column="actionColumn"
    :load-data="loadData"
  >
    <template #search-actions="{ loading }">
      <el-button type="primary" :loading="loading" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新建角色
      </el-button>
    </template>
  </MfwPageScene>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { ElMessage, ElMessageBox, ElTag, ElButton, ElTooltip } from 'element-plus';
import { Plus, Edit, Delete, Key } from '@element-plus/icons-vue';
import MfwPageScene from '../../../components/page/page-scene';
import type { MfwPageSceneInstance } from '../../../components/page/page-scene/types';
import { MfwPopup } from '../../../components/feedback';
import {
  ApiRoleFindAll,
  ApiRoleDelete,
} from '../../../apis/sys';
import type { RoleResponseDto } from '../../../apis/sys/schemas';
import RoleForm from './RoleForm.vue';
import { RolePermissionPanel } from '../../../components/business/role-permission-panel';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'MfwRoleList' });

const pageScene = ref<MfwPageSceneInstance>();

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
    render: ({ row }: { row: RoleResponseDto }) => h(ElTag, {
      type: row.isBuiltin === STATUS.ENABLED ? 'warning' : 'primary',
      size: 'small',
    }, () => row.isBuiltin === STATUS.ENABLED ? '内置' : '应用级'),
  },
  {
    prop: 'isOwner',
    label: '拥有者',
    width: 80,
    render: ({ row }: { row: RoleResponseDto }) => row.isOwner === STATUS.ENABLED ? '是' : '否',
  },
  {
    prop: 'roleStatus',
    label: '状态',
    width: 80,
    render: ({ row }: { row: RoleResponseDto }) => h(ElTag, {
      type: row.roleStatus === STATUS.ENABLED ? 'success' : 'danger',
      size: 'small',
    }, () => row.roleStatus === STATUS.ENABLED ? '启用' : '禁用'),
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
    return h('div', { class: 'action-buttons' }, [
      h(ElTooltip, {
        content: isBuiltin ? '内置角色请在应用类型管理页面分配权限' : '分配权限',
        placement: 'top',
      }, () => h(ElButton, {
        type: 'primary',
        link: true,
        icon: Key,
        disabled: isBuiltin,
        onClick: () => handlePermission(row),
      }, () => '权限')),
      h(ElButton, {
        type: 'primary',
        link: true,
        icon: Edit,
        disabled: isBuiltin,
        onClick: () => handleEdit(row),
      }, () => '编辑'),
      h(ElButton, {
        type: 'danger',
        link: true,
        icon: Delete,
        disabled: isBuiltin || row.isOwner === STATUS.ENABLED,
        onClick: () => handleDelete(row),
      }, () => '删除'),
    ]);
  },
};

/** 加载数据 */
const loadData = async (params: Record<string, unknown>) => {
  const result = await new ApiRoleFindAll({
    params: {
      page: params.page as number,
      pageSize: params.pageSize as number,
      roleName: params.roleName as string,
      roleCode: params.roleCode as string,
      roleStatus: params.roleStatus as number,
      appTypeId: params.appTypeId as string,
    },
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
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        ElMessage.success('创建成功');
        pageScene.value?.refresh();
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
        ElMessage.success('更新成功');
        pageScene.value?.refresh();
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
        ElMessage.success('权限分配成功');
        pageScene.value?.refresh();
      },
    },
  });
};

/** 删除 */
const handleDelete = async (row: RoleResponseDto) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色「${row.roleName}」吗？`,
      '确认删除',
      { type: 'warning' }
    );
    await new ApiRoleDelete({ params: { id: row.id } });
    ElMessage.success('删除成功');
    pageScene.value?.refresh();
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