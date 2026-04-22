<!--
/**
 * @fileoverview 内置角色配置弹窗组件
 * @description 使用卡片网格布局展示内置角色列表
 */
-->
<template>
  <div class="builtin-role-dialog">
    <el-alert title="内置角色说明" type="info" :closable="false" show-icon class="mb-4">
      <p>内置角色是与应用类型绑定的预设角色，创建应用实例时自动继承。</p>
    </el-alert>

    <div class="builtin-role-header">
      <span class="builtin-role-title">{{ typeName }} - 内置角色</span>
      <el-button type="primary" size="small" @click="handleAddRole">新增角色</el-button>
    </div>

    <div v-loading="loading" class="builtin-role-grid">
      <RoleCard
        v-for="role in roleList"
        :key="role.id"
        :data="role"
        @refresh="loadRoles"
      />
      <el-empty v-if="!loading && roleList.length === 0" description="暂无内置角色" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { MfwPopup } from '../../feedback';
import { ApiRoleFindAll } from '../../../apis/sys';
import type { RoleResponseDto } from '../../../apis/sys/schemas';
import { RoleForm } from '..';
import { RoleCard } from '../role-card';

defineOptions({ name: 'BuiltinRoleDialog' });

const props = defineProps<{
  appTypeId: string;
  typeName?: string;
}>();

const typeName = props.typeName || '应用类型';
const roleList = ref<RoleResponseDto[]>([]);
const loading = ref(false);

const loadRoles = async () => {
  if (!props.appTypeId) return;
  loading.value = true;
  try {
    const result = await new ApiRoleFindAll({
      query: {
        page: 1,
        pageSize: 100,
        appTypeId: props.appTypeId,
      }
    });
    roleList.value = result.list || [];
  } catch (error) {
    ElMessage.error('加载内置角色失败');
    roleList.value = [];
  } finally {
    loading.value = false;
  }
};

const handleAddRole = () => {
  MfwPopup.open({
    title: '新增内置角色',
    type: 'dialog',
    component: RoleForm,
    data: { appTypeId: props.appTypeId, isBuiltin: 1 },
    popupProps: {
      size: '500px',
    },
    footer: {
      cancelText: '取消',
      confirmText: '确定',
    },
    on: {
      confirm: () => {
        loadRoles();
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
  display: flex;
  flex-direction: column;

  .mb-4 {
    margin-bottom: 16px;
  }

  .builtin-role-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .builtin-role-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .builtin-role-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 12px;
    align-items: start;
  }
}
</style>