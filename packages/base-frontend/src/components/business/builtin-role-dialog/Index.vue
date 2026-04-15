<!--
/**
 * @fileoverview 内置角色配置弹窗组件
 * @description 用于应用类型详情页的内置角色配置
 */
-->
<template>
  <div class="builtin-role-dialog">
    <el-alert
      title="内置角色说明"
      type="info"
      :closable="false"
      show-icon
      class="mb-4"
    >
      <p>内置角色是与应用类型绑定的预设角色，用于快速分配权限。</p>
      <p>每个应用类型可以配置多个内置角色，例如：管理员、普通用户等。</p>
    </el-alert>

    <el-table :data="roleList" border style="width: 100%">
      <el-table-column prop="roleName" label="角色名称" min-width="120" />
      <el-table-column prop="roleCode" label="角色编码" min-width="120" />
      <el-table-column prop="roleDesc" label="角色描述" min-width="200" />
      <el-table-column prop="roleStatus" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.roleStatus === 1 ? 'success' : 'danger'" size="small">
            {{ row.roleStatus === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            size="small"
            @click="handleAssignPermissions(row)"
          >
            配置权限
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="builtin-role-footer">
      <el-button type="primary" @click="handleAddRole">新增内置角色</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { MfwPopup } from '../../feedback';
import { ApiRoleFindAll, ApiRoleCreate, ApiRoleUpdate } from '../../../apis/sys';
import type { RoleResponseDto } from '../../../apis/sys/schemas';
import { RolePermissionPanel } from '../role-permission-panel';
import AddRoleForm from './MfwAddRoleForm.vue';

defineOptions({ name: 'BuiltinRoleDialog' });

const props = defineProps<{
  appTypeId: string;
}>();

const roleList = ref<RoleResponseDto[]>([]);
const loading = ref(false);

/** 加载内置角色列表 */
const loadRoles = async () => {
  if (!props.appTypeId) return;

  loading.value = true;
  try {
    const result = await new ApiRoleFindAll({
      params: {
        page: 1,
        pageSize: 100,
        appTypeId: props.appTypeId,
      },
    });

    roleList.value = result.list || [];
  } catch (error) {
    ElMessage.error('加载角色列表失败');
  } finally {
    loading.value = false;
  }
};

/** 配置权限 */
const handleAssignPermissions = (row: RoleResponseDto) => {
  MfwPopup.open({
    title: `配置角色权限 - ${row.roleName}`,
    type: 'dialog',
    component: RolePermissionPanel,
    data: {
      roleId: row.id,
      appTypeId: props.appTypeId,
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
const handleAddRole = () => {
  MfwPopup.open({
    title: '新增内置角色',
    type: 'dialog',
    component: AddRoleForm,
    data: {
      appTypeId: props.appTypeId,
    },
    popupProps: {
      size: '500px',
    },
    footer: {
      cancelText: '取消',
      confirmText: '确定',
    },
    on: {
      confirm: async (componentInstance: any) => {
        const isValid = await componentInstance.validate();
        if (!isValid) return;

        const formData = componentInstance.getFormData();
        try {
          await new ApiRoleCreate({
            params: formData,
          });
          ElMessage.success('角色创建成功');
          loadRoles();
        } catch (error) {
          ElMessage.error('创建角色失败');
        }
      },
    },
  });
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
