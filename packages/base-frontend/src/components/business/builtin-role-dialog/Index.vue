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
      <el-button @click="handleAddRole">新增内置角色</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { ApiRoleFindAll } from '../../apis/sys';
import type { RoleResponseDto } from '../../apis/sys/schemas';

defineOptions({ name: 'BuiltinRoleDialog' });

const props = defineProps<{
  data?: {
    appTypeId: string;
  };
}>();

const roleList = ref<RoleResponseDto[]>([]);
const loading = ref(false);

/** 加载内置角色列表 */
const loadRoles = async () => {
  if (!props.data?.appTypeId) return;

  loading.value = true;
  try {
    const result = await new ApiRoleFindAll({
      params: {
        page: 1,
        pageSize: 100,
        appTypeId: props.data.appTypeId,
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
  ElMessage.info(`配置角色 "${row.roleName}" 的权限 - 功能开发中...`);
  // TODO-TASK-2026-04-08-002: 打开角色权限配置弹窗
};

/** 新增角色 */
const handleAddRole = () => {
  ElMessage.info('新增内置角色功能开发中...');
  // TODO-TASK-2026-04-08-002: 打开新增角色弹窗
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
