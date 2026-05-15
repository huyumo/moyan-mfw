<template>
  <slot name="header-avatar">
    <component :is="layoutExtensions.headerAvatar" v-if="layoutExtensions.headerAvatar" />
    <el-dropdown v-else trigger="click" @command="handleUserCommand">
      <button class="mfw-admin-avatar-trigger" type="button" aria-label="Open user menu" data-testid="user-avatar-trigger">
        <el-avatar :size="30" :src="avatarUrl">
          {{ displayName?.charAt(0) }}
        </el-avatar>
      </button>
      <template #dropdown>
        <slot name="header-user-menu">
          <component :is="layoutExtensions.headerUserMenu" v-if="layoutExtensions.headerUserMenu" />
          <el-dropdown-menu v-else>
            <el-dropdown-item command="profile" data-testid="user-profile-menu">我的资料</el-dropdown-item>
            <el-dropdown-item command="logout" divided data-testid="user-logout-menu">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </slot>
      </template>
    </el-dropdown>
  </slot>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import type { LayoutExtensionComponents } from '../../../types/layout-types';
import { useAuthStore } from '../../../store/auth-store';
import { MfwPopup } from '../../../components/feedback/popup';
import { ProfilePanel } from '../../../components/layout';
import { resetRouteGuard } from '../../../router/guard';

defineProps<{
  layoutExtensions: LayoutExtensionComponents;
}>();

const router = useRouter();
const authStore = useAuthStore();

const displayName = computed(() => {
  return authStore.user?.nickname || authStore.user?.username || 'Admin';
});

const avatarUrl = computed(() => {
  const avatar = authStore.user?.avatar;
  if (!avatar) return undefined;
  return typeof avatar === 'string' ? avatar : (avatar as any).src;
});

const emit = defineEmits<{
  (e: 'user-command', command: string | number | object): void;
}>();

function handleUserCommand(command: string | number | object) {
  const action = String(command);

  if (action === 'profile') {
    MfwPopup.open({
      title: '我的资料',
      type: 'dialog',
      component: ProfilePanel,
      footer: false,
      popupProps: { width: 480 },
    });
    return;
  }

  if (action === 'logout') {
    handleLogout();
    return;
  }

  emit('user-command', command);
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }

  await authStore.logout();
  resetRouteGuard();
  router.replace('/login');
}
</script>

<style scoped lang="scss">
.mfw-admin-avatar-trigger {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  color: var(--el-text-color-primary);
}
</style>
