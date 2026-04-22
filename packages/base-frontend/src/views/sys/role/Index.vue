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
    <MfwCardListPage ref="cardListPage" :search-template="searchTemplate" :load-data="loadData" render-mode="card"
      :card-grid="{ cols: 3, gap: 16 }" empty-text="暂无角色">
      <template #card-item="{ item }">
        <RoleCard :data="item" @refresh="cardListPage?.refresh()" />
      </template>
    </MfwCardListPage>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { MfwPageWrapper, MfwCardListPage } from '../../../components';
import type { MfwCardListPageInstance } from '../../../components/page/card-list-page/types';
import { MfwPopup } from '../../../components/feedback';
import { ApiRoleFindAll } from '../../../apis/sys';
import { RoleForm, RoleCard } from '../../../components/business';
import { useAuthStore } from '../../../store/auth-store';

const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'MfwRoleList' });

const authStore = useAuthStore();
const cardListPage = ref<MfwCardListPageInstance>();
const appId = computed(() => authStore.currentApp?.appId || '');

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

const handleAdd = () => {
  MfwPopup.open({
    title: '新建角色',
    type: 'dialog',
    component: RoleForm,
    data: { appId: appId.value },
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        cardListPage.value?.refresh();
      },
    },
  });
};
</script>
