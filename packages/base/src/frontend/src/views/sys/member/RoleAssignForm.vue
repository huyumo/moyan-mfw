<!--
/**
 * @fileoverview ��ɫ����������
 * @description ���� MfwPopup �����Ľ�ɫ�������
 */
-->
<template>
  <div class="role-assign-form">
    <el-checkbox-group v-model="selectedRoleIds" data-testid="role-assign-checkbox-group">
      <div
        v-for="role in availableRoles"
        :key="role.id"
        class="role-item"
        :class="{ 'is-builtin': role.isBuiltin === IsBuiltinDict.YES }"
      >
        <el-checkbox :label="role.id" :disabled="role.isOwner === IsOwnerDict.YES">
          {{ role.roleName }}
        </el-checkbox>
      </div>
    </el-checkbox-group>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ApiAppMemberGetAvailableRoles, ApiAppMemberUpdateRoles } from '../../../../apis/sys';
import type { MemberResponseDto, AvailableAvailableRoleDto } from '../../../../apis/sys/schemas';
import { IsBuiltinDict, IsOwnerDict } from '../../../../../shared/src';

/** Props */
interface Props {
  appId: string;
  member: MemberResponseDto;
}

const props = defineProps<Props>();

/** ��ѡ��ɫ */
const availableRoles = ref<AvailableAvailableRoleDto[]>([]);

/** ѡ�еĽ�ɫ ID */
const selectedRoleIds = ref<string[]>([]);

/** ���ؿ�ѡ��ɫ */
const loadAvailableRoles = async () => {
  if (!props.appId) return;
  const result = await new ApiAppMemberGetAvailableRoles({
    params: { appId: props.appId },
  });
  availableRoles.value = result || [];
};

/** ��ʼ�� */
onMounted(async () => {
  await loadAvailableRoles();

  // ���õ�ǰ��ɫ
  if (props.member?.roles) {
    selectedRoleIds.value = props.member.roles.map((r) => r.roleId);
  }
});

const isMemberOwner = computed(() => Number(props.member.isOwner) === IsOwnerDict.YES);

/** ȷ���ύ */
const onConfirm = async () => {
  if (!props.appId || isMemberOwner.value) return;

  await new ApiAppMemberUpdateRoles({
    params: {
      appId: props.appId,
      userId: props.member.userId,
    },
    body: { roleIds: selectedRoleIds.value as any },
  }, { hintSuccess: true });
};

defineExpose({ onConfirm });
</script>

<style scoped lang="scss">
.role-assign-form {
  max-height: 400px;
  overflow-y: auto;
}

.role-item {
  display: inline-block;
  margin-right: 16px;

  &.is-builtin :deep(.el-checkbox__label) {
    color: var(--el-color-success);
    font-weight: 500;
  }
}

:deep(.el-checkbox__label) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  vertical-align: middle;
}
</style>