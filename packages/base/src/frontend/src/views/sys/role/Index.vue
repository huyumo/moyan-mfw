<!--
/**
 * @fileoverview ��ɫ�����б�ҳ��
 * @description ����Ӧ�ü���ɫ�����ý�ɫ
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" data-testid="role-create-btn" @click="handleAdd">
        <el-icon>
          <Plus />
        </el-icon>
        �½���ɫ
      </el-button>
    </template>
    <MfwCardListPage ref="cardListPage" :search-template="searchTemplate" :load-data="loadData" render-mode="card"
      empty-text="���޽�ɫ">
      <template #card-item="{ item }">
        <RoleCard :data="item" @refresh="cardListPage?.refresh()" />
      </template>
    </MfwCardListPage>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { MfwPageWrapper, MfwCardListPage } from '../../../../components';
import type { MfwCardListPageInstance } from '../../../../components/page/card-list-page/types';
import { MfwPopup } from '../../../../components/feedback';
import { ApiRoleFindAll } from '../../../../apis/sys';
import { RoleForm, RoleCard } from '../../../../components/business';
import { useAuthStore } from '../../../../store/auth-store';
import { toItems, StatusDict } from '../../../../../shared/src';

defineOptions({ name: 'MfwRoleList' });

const authStore = useAuthStore();
const cardListPage = ref<MfwCardListPageInstance>();
const appId = computed(() => authStore.currentApp?.appId || '');

const searchTemplate = [
  {
    key: 'roleName',
    label: '��ɫ����',
    type: 'input' as const,
    testId: 'role-search-name',
    placeholder: '�������ɫ����',
  },
  {
    key: 'roleCode',
    label: '��ɫ����',
    type: 'input' as const,
    testId: 'role-search-code',
    placeholder: '�������ɫ����',
  },
  {
    key: 'roleStatus',
    label: '״̬',
    type: 'select' as const,
    testId: 'role-search-status',
    placeholder: '��ѡ��״̬',
    elProps: {
      options: toItems(StatusDict),
    },
  },
];

const loadData = async (params: Record<string, unknown>) => {
  return await new ApiRoleFindAll({
    query: {
      page: params.page as number,
      pageSize: params.pageSize as number,
      appId: appId.value,
      ...params
    }
  });
};

const handleAdd = () => {
  MfwPopup.open({
    title: '�½���ɫ',
    type: 'dialog',
    component: RoleForm,
    data: { appId: appId.value },
    popupProps: { width: 500 },
    on: { confirm: cardListPage.value?.refresh },
  });
};
</script>
