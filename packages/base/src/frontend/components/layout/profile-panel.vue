<template>
  <div class="mfw-profile-panel">
    <div class="profile-header">
      <el-avatar :size="48" :src="avatarUrl" class="profile-avatar">
        {{ displayName?.charAt(0) }}
      </el-avatar>
      <div class="header-info">
        <span class="header-name">{{ displayName }}</span>
        <span class="header-status">
          <el-icon><CircleCheck /></el-icon>
          <MfwDictFormat :value="userInfo?.userStatus" :dict="toItems(StatusDict)" />
        </span>
      </div>
    </div>

    <div class="info-list">
      <div class="list-row">
        <el-icon class="row-icon"><User /></el-icon>
        <span class="row-label">昵称</span>
        <span class="row-value">{{ userInfo?.nickname || '--' }}</span>
      </div>
      <div class="list-row">
        <el-icon class="row-icon"><Phone /></el-icon>
        <span class="row-label">手机号</span>
        <span class="row-value">{{ userInfo?.phone || '--' }}</span>
      </div>
      <div class="list-row">
        <el-icon class="row-icon"><Message /></el-icon>
        <span class="row-label">邮箱</span>
        <span class="row-value">{{ userInfo?.email || '--' }}</span>
      </div>
      <div class="list-row">
        <el-icon class="row-icon"><Avatar /></el-icon>
        <span class="row-label">性别</span>
        <span class="row-value">{{ genderText }}</span>
      </div>
      <div class="list-row">
        <el-icon class="row-icon"><Calendar /></el-icon>
        <span class="row-label">注册时间</span>
        <span class="row-value">{{ formatDateTime(userInfo?.createdAt) }}</span>
      </div>
    </div>

    <slot name="extra" :user-info="userInfo" />

    <div class="profile-actions">
      <el-button type="primary" data-testid="profile-edit-btn" @click="handleEditProfile">
        <el-icon><Edit /></el-icon>
        编辑资料
      </el-button>
      <el-button data-testid="profile-password-btn" @click="handleChangePassword">
        <el-icon><Lock /></el-icon>
        修改密码
      </el-button>
      <slot name="actions" :user-info="userInfo" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Edit, Lock, User, Phone, Message, Avatar, CircleCheck, Calendar } from '@element-plus/icons-vue';
import { MfwPopup } from '../feedback/popup';
import { useAuthStore } from '../../store/auth-store';
import { ApiUserFindById } from '../../apis/sys';
import type { UserResponseDto } from '../../apis/sys/schemas';
import UserForm from '../../views/sys/user/UserForm.vue';
import PasswordChangeForm from './password-change-form.vue';
import { MfwDictFormat } from '..';
import { toItems, StatusDict } from 'moyan-mfw-base/shared';

defineOptions({ name: 'ProfilePanel' });

const GENDER_MAP: Record<number, string> = { 0: '未知', 1: '男', 2: '女' };

function formatDateTime(val: string | undefined): string {
  if (!val) return '--';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const authStore = useAuthStore();
const userInfo = ref<UserResponseDto | null>(null);

const displayName = computed(() => userInfo.value?.nickname || userInfo.value?.username || '用户');

const avatarUrl = computed(() => {
  const avatar = userInfo.value?.avatar;
  if (!avatar) return undefined;
  return typeof avatar === 'string' ? avatar : (avatar as any).src;
});

const genderText = computed(() => GENDER_MAP[userInfo.value?.gender ?? 0] || '未知');

async function fetchUserInfo() {
  const userId = authStore.user?.id;
  if (!userId) return;
  try {
    userInfo.value = await new ApiUserFindById({ params: { id: userId } });
  } catch (e) {
    console.error('获取用户信息失败:', e);
  }
}

function handleEditProfile() {
  if (!userInfo.value) return;
  MfwPopup.open({
    title: '编辑资料',
    type: 'dialog',
    component: UserForm,
    data: { ...userInfo.value },
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        fetchUserInfo();
        authStore.fetchUserInfo();
      },
    },
  });
}

function handleChangePassword() {
  MfwPopup.open({
    title: '修改密码',
    type: 'dialog',
    component: PasswordChangeForm,
    popupProps: { width: 420 },
  });
}

onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped lang="scss">
.mfw-profile-panel {
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 16px;
}

.profile-avatar {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.header-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-color-success);

  .el-icon {
    width: 14px;
    height: 14px;
  }
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.row-icon {
  width: 16px;
  height: 16px;
  color: var(--el-text-color-secondary);
}

.row-label {
  width: 70px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.row-value {
  flex: 1;
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
</style>