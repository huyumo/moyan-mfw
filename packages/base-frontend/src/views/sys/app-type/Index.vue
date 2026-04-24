<!--
/**
 * @fileoverview 应用类型管理页面
 * @description 使用卡片网格布局展示应用类型列表
 */
-->
<template>
  <MfwPageWrapper>
    <div class="app-type-content-wrapper">
      <MfwCardListPage ref="cardListPage" :show-search="false" :show-pagination="false" :load-data="loadData"
        render-mode="card" :card-grid="{ minWidth: 400, gap: 24 }" empty-text="暂无应用类型">
        <template #card-item="{ item }">
          <AppTypeCard :data="item" @edit="handleEdit" @permission="handleConfigPermissionPool"
            @role="handleConfigBuiltinRoles" />
        </template>
      </MfwCardListPage>
    </div>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { MfwPageWrapper, MfwCardListPage } from '../../../components';
import type { MfwCardListPageInstance } from '../../../components/page/card-list-page/types';
import { MfwPopup } from '../../../components/feedback';
import { ApiAppTypeFindAllList } from '../../../apis/sys';
import type { AppTypeResponseDto } from '../../../apis/sys/schemas';
import AppTypeCard from './AppTypeCard.vue';
import EditForm from './EditForm.vue';
import AddForm from './AddForm.vue';
import { PermissionPoolPanel } from '../../../components/business/permission-pool-panel';
import { BuiltinRoleDialog } from '../../../components/business/builtin-role-dialog/mod';

defineOptions({ name: 'MfwAppTypeList' });

const cardListPage = ref<MfwCardListPageInstance>();

const loadData = async () => {
  try {
    const result = await new ApiAppTypeFindAllList({});
    return {
      list: result || [],
      total: result?.length || 0,
    };
  } catch (error) {
    ElMessage.error('加载应用类型列表失败');
    return { list: [], total: 0 };
  }
};

const handleEdit = (row: AppTypeResponseDto) => {
  MfwPopup.open({
    title: '编辑应用类型',
    type: 'drawer',
    position: 'rtl',
    component: EditForm,
    data: { ...row },
    popupProps: { size: 400 },
    on: { confirm: cardListPage.value?.refresh }
  });
};

const handleConfigPermissionPool = (row: AppTypeResponseDto) => {
  if (!row.id) {
    ElMessage.warning('请先保存应用类型');
    return;
  }
  MfwPopup.open({
    title: '配置权限池',
    type: 'dialog',
    component: PermissionPoolPanel,
    data: { appTypeId: row.id },
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
      },
    },
  });
};

const handleConfigBuiltinRoles = (row: AppTypeResponseDto) => {
  if (!row.id) {
    ElMessage.warning('请先保存应用类型');
    return;
  }
  MfwPopup.open({
    title: '配置内置角色',
    type: 'dialog',
    component: BuiltinRoleDialog,
    data: { appTypeId: row.id, typeName: row.typeName },
    popupProps: {
      width: '600px',
      top: '10vh',
    },
  });
};
</script>

<style scoped lang="scss">
.app-type-content-wrapper {
  width: min(100%, var(--mfw-content-max-width));
  margin: 0 auto;
}
</style>