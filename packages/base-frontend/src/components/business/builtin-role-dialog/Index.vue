<!--
/**
 * @fileoverview 内置角色配置弹窗组件
 * @description 用于应用类型详情页的内置角色配置
 */
-->
<template>
  <div class="builtin-role-dialog">
    <el-alert title="内置角色说明" type="info" :closable="false" show-icon class="mb-4">
      <p>内置角色是与应用类型绑定的预设角色，用于快速分配权限。</p>
      <p>每个应用类型可以配置多个内置角色，例如：管理员、普通用户等。</p>
    </el-alert>
    <MfwTableList :data="roleList" :columns="columns" :loading="loading" :action-column="actionColumn" />
    <div class="builtin-role-footer">
      <el-button type="primary" @click="handleAddAndEditRole()">新增内置角色</el-button>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { MfwPopup } from '../../feedback';
import { ApiRoleFindAll, ApiRoleDelete } from '../../../apis/sys';
import type { CreateRoleDto, RoleResponseDto } from '../../../apis/sys/schemas';
import { RolePermissionPanel } from '../role-permission-panel';
import { ActionColumnConfig, MfwTableList, TableColumnConfig } from '../../table';
import { RoleForm } from '..';

defineOptions({ name: 'BuiltinRoleDialog' });

const { appTypeId } = defineProps<{
  appTypeId: string;
}>();

const roleList = ref<RoleResponseDto[]>([]);
const loading = ref(false);
const columns: TableColumnConfig[] = [
  { prop: 'roleName', label: '角色名称', width: 120 },
  { prop: 'roleCode', label: '角色编码', width: 120 },
  { prop: 'roleDesc', label: '角色描述', width: 200 },
  { prop: 'roleStatus', label: '状态', width: 80 },
  { prop: 'action', label: '操作', width: 120, fixed: 'right' },
];

const actionColumn: ActionColumnConfig = {
  label: '操作',
  width: 120,
  fixed: 'right' as const,
  render: ({ row }: { row: RoleResponseDto }) => (
    <div>
      <el-button type="primary" link size="small" onClick={() => handleAssignPermissions(row)}>
        配置权限
      </el-button>
      <el-button type="danger" link size="small" onClick={() => handleDeleteRole(row)}>
        删除
      </el-button>
      <el-button type="info" link size="small" onClick={() => handleAddAndEditRole(row)}>
        编辑
      </el-button>
    </div>
  ),
};

/** 加载内置角色列表 */
const loadRoles = async () => {
  if (!appTypeId) return;
  const result = await new ApiRoleFindAll({
    query: {
      page: 1,
      pageSize: 100,
      appTypeId: appTypeId,
    }
  },{loading:loading.value});
  roleList.value = result.list || [];
};

/** 配置权限 */
const handleAssignPermissions = (row: RoleResponseDto) => {
  MfwPopup.open({
    title: `配置角色权限 - ${row.roleName}`,
    type: 'dialog',
    component: RolePermissionPanel,
    data: {
      roleId: row.id,
      appTypeId: appTypeId,
    },
    popupProps: {
      size: '800px',
      top: '10vh',
    },
    footer: {
      cancelText: '关闭',
      confirmText: '保存',
    },
    on: {
      confirm: () => {
        ElMessage.success('权限配置成功');
        loadRoles();
      },
    },
  });
};

/** 新增角色 */
const handleAddAndEditRole = (row?: RoleResponseDto) => {
  MfwPopup.open({
    title: '新增内置角色',
    type: 'dialog',
    component: RoleForm,
    data: { id: row?.id, role: row, appTypeId },
    popupProps: {
      size: '500px',
    },
    footer: {
      cancelText: '取消',
      confirmText: '确定',
    },
    on: {
      confirm: async () => {
        loadRoles();
      },
    },
  });
};

/** 删除角色 */
const handleDeleteRole = async (row: RoleResponseDto) => {
  await new ApiRoleDelete({ params: { id: row.id } });
};

onMounted(() => {
  loadRoles();
});
</script>

<style scoped lang="scss">
.builtin-role-dialog {
  height: 500px;
  display: flex;
  flex-direction: column;

  .mb-4 {
    margin-bottom: 16px;
  }

  .builtin-role-footer {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-light);
    display: flex;
    justify-content: flex-end;
  }
}
</style>
