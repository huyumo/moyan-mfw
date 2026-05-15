<!--
/**
 * @fileoverview 无应用空态面板
 * @description 用户已登录但未加入任何应用时显示的空态提示页
 */
-->
<template>
  <div class="mfw-admin-no-apps">
    <div class="mfw-admin-no-apps-card">
      <div class="mfw-admin-no-apps-icon">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="72" height="56" rx="8" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4" opacity="0.35"/>
          <rect x="12" y="12" width="56" height="40" rx="4" fill="currentColor" opacity="0.08"/>
          <rect x="18" y="22" width="28" height="4" rx="2" fill="currentColor" opacity="0.2"/>
          <rect x="18" y="30" width="20" height="4" rx="2" fill="currentColor" opacity="0.14"/>
          <rect x="50" y="20" width="14" height="14" rx="7" stroke="currentColor" stroke-width="2" opacity="0.25"/>
          <path d="M56 26 L60 30 L66 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.25"/>
        </svg>
      </div>
      <h2 class="mfw-admin-no-apps-title">欢迎使用 {{ title }}</h2>
      <p class="mfw-admin-no-apps-desc">您尚未加入任何应用</p>
      <div class="mfw-admin-no-apps-actions">
        <slot name="actions">
          <el-button type="primary" data-testid="no-apps-relogin-btn" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            重新登录
          </el-button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SwitchButton } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '../../../../store/auth-store';

const props = defineProps<{
  brandName?: string;
}>();

const emit = defineEmits<{
  (e: 'logout'): void;
}>();

const router = useRouter();

const title = computed(() => props.brandName || '墨研管理后台');

async function handleLogout() {
  // 先清除 token 再导航，防止路由守卫因 token 仍存在而重定向回首页
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  emit('logout');
  await router.replace('/login');
}
</script>

<style scoped lang="scss">
.mfw-admin-no-apps {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  box-sizing: border-box;
}

.mfw-admin-no-apps-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 420px;
}

.mfw-admin-no-apps-icon {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: var(--el-color-primary);
  opacity: 0.55;
}

.mfw-admin-no-apps-icon svg {
  width: 100%;
  height: 100%;
}

.mfw-admin-no-apps-title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.mfw-admin-no-apps-desc {
  margin: 0 0 28px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.mfw-admin-no-apps-actions {
  display: flex;
  gap: 12px;
}
</style>
