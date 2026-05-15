<!--
/**
 * @fileoverview ��ɫ��Ƭ���
 * @description ���ڽ�ɫ����ҳ������ý�ɫ�����Ŀ�Ƭչʾ���ڲ������༭/Ȩ��/ɾ������
 */
-->
<template>
  <el-card class="role-card" shadow="hover">
    <div class="role-card__header">
      <div class="role-card__icon">
        <el-icon :size="20"><User /></el-icon>
      </div>
      <span class="role-card__name">{{ data.roleName }}</span>
      <MfwDictFormat v-if="data.isBuiltin === IsBuiltinDict.YES" :value="data.isBuiltin" :dict="toItems(IsBuiltinDict)" as-tag />
    </div>

    <div class="role-card__body">
      <div class="role-card__code">{{ data.roleCode }}</div>
      <p class="role-card__desc">{{ data.roleDesc || '��������' }}</p>
    </div>

    <div class="role-card__footer">
      <el-button type="primary" size="small" link :disabled="!canEdit" data-testid="role-permission-btn" v-permission="{ value: ['�༭'] }" @click="handlePermission">����Ȩ��</el-button>
      <el-button size="small" link :disabled="!canEdit" data-testid="role-edit-btn" v-permission="{ value: ['�༭'] }" @click="handleEdit">�༭</el-button>
      <el-button type="danger" size="small" link :disabled="isBuiltin || isOwner" data-testid="role-delete-btn" v-permission="{ value: ['ɾ��'] }" @click="handleDelete">ɾ��</el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { User } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import { MfwPopup } from '../../feedback';
import { ApiRoleDelete } from '../../../apis/sys';
import type { RoleResponseDto } from '../../../apis/sys/schemas';
import { RolePermissionPanel } from '../role-permission-panel';
import { RoleForm } from '..';
import { IsBuiltinDict, IsOwnerDict, toItems } from 'moyan-mfw-base/shared';
import { MfwDictFormat } from '../../../components';

defineOptions({ name: 'RoleCard' });

const props = defineProps<{
  data: RoleResponseDto;
  canEditBuiltin?: boolean;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const isBuiltin = computed(() => props.data.isBuiltin === IsBuiltinDict.YES);
const isOwner = computed(()=> props.data.isOwner === IsOwnerDict.YES)
const canEdit = computed(() => !isBuiltin.value || props.canEditBuiltin);

const handlePermission = () => {
  MfwPopup.open({
    title: `���ý�ɫȨ�� - ${props.data.roleName}`,
    type: 'dialog',
    component: RolePermissionPanel,
    data: {
      roleId: props.data.id,
      appTypeId: props.data.appTypeId,
    },
    popupProps: {
      size: '800px',
      top: '10vh',
    },
    footer: {
      cancelText: '�ر�',
      confirmText: '����',
    },
    on: {
      confirm: () => {
        emit('refresh');
      },
    },
  });
};

const handleEdit = () => {
  MfwPopup.open({
    title: '�༭��ɫ',
    type: 'dialog',
    component: RoleForm,
    data: {
      id: props.data.id,
      role: props.data,
      appTypeId: props.data.appTypeId,
      appId: props.data.appId,
    },
    popupProps: {
      size: '500px',
    },
    footer: {
      cancelText: 'ȡ��',
      confirmText: 'ȷ��',
    },
    on: {
      confirm: () => {
        emit('refresh');
      },
    },
  });
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `ȷ��Ҫɾ����ɫ��${props.data.roleName}����`,
      'ȷ��ɾ��',
      { type: 'warning' },
    );
    await new ApiRoleDelete({ params: { id: props.data.id } }, { hintSuccess: true });
    emit('refresh');
  } catch {
  }
};
</script>

<style scoped lang="scss">
.role-card {
  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__icon {
    width: 32px;
    height: 32px;
    background: var(--el-color-primary-light-9);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-color-primary);
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__body {
    margin-bottom: 12px;
  }

  &__code {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  &__desc {
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.4;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
