<!--
/**
 * @fileoverview 角色分配表单组件
 * @description 用于 MfwPopup 弹窗的角色分配表单
 */
-->
<template>
  <div class="role-assign-form">
    <el-checkbox-group v-model="selectedRoleIds">
      <div v-for="role in availableRoles" :key="role.id" class="role-item">
        <el-checkbox
          :label="role.id"
          :disabled="role.isOwner === STATUS.ENABLED"
        >
          {{ role.roleName }}
          <el-tag v-if="role.isBuiltin === STATUS.ENABLED" type="warning" size="small">内置</el-tag>
        </el-checkbox>
      </div>
    </el-checkbox-group>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ApiMemberGetAvailableRoles, ApiMemberUpdateRoles } from '../../../apis/sys';
import type { MemberResponseDto, AvailableRoleDto } from '../../../apis/sys/schemas';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

/** Props */
interface Props {
  data?: {
    appId: string;
    member: MemberResponseDto;
  };
}

const props = defineProps<Props>();

/** 可选角色 */
const availableRoles = ref<AvailableRoleDto[]>([]);

/** 选中的角色 ID */
const selectedRoleIds = ref<string[]>([]);

/** 加载可选角色 */
const loadAvailableRoles = async () => {
  if (!props.data?.appId) return;
  const result = await new ApiMemberGetAvailableRoles({
    params: { appId: props.data.appId },
  });
  availableRoles.value = result || [];
};

/** 初始化 */
onMounted(async () => {
  await loadAvailableRoles();

  // 设置当前角色
  if (props.data?.member?.roles) {
    selectedRoleIds.value = props.data.member.roles.map((r) => r.roleId);
  }
});

/** 确认提交 */
const onConfirm = async () => {
  if (!props.data) return;

  await new ApiMemberUpdateRoles({
    query: {
      appId: props.data.appId,
      userId: props.data.member.userId,
    },
    params: { roleIds: selectedRoleIds.value as any }, // API 类型定义有误
  });
};

defineExpose({ onConfirm });
</script>

<style scoped lang="scss">
.role-assign-form {
  max-height: 400px;
  overflow-y: auto;
}

.role-item {
  margin-bottom: 12px;
}
</style>