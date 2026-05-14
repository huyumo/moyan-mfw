<!--
/**
 * @fileoverview 登录页面组件 - 传统后台管理风格。
 * 
 * 设计风格：传统后台式（参考 Ant Design Pro / Arco Design Pro）
 * - 居中表单卡片，无左右分栏
 * - 简洁功能导向，无多余装饰
 * - 紧凑布局，专业感强
 */
-->
<template>
  <div class="mfw-login-page">
    <ParticleBackground
      :particle-color="particleColor"
      :line-color="lineColor"
      :particle-count="60"
      :line-distance="100"
    />
    <div class="mfw-login-card" :class="{ 'mfw-login-card--app': selectingApp }">
      <!-- 登录表单 -->
      <template v-if="!selectingApp">
        <div class="mfw-login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="10" class="mfw-logo-bg"/>
            <path d="M24 12L32 20V28L24 36L16 28V20L24 12Z" class="mfw-logo-path"/>
            <circle cx="24" cy="24" r="4" class="mfw-logo-circle"/>
          </svg>
        </div>

        <h1 class="mfw-login-title">{{ layoutStore.navigation.brandName || '墨焱管理后台' }}</h1>

        <div class="mfw-login-methods">
          <component :is="methodsExtensionComponent" v-if="methodsExtensionComponent" />
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large" @submit.prevent="submit">
          <el-form-item prop="username">
            <el-input
              ref="usernameInputRef"
              v-model="form.username"
              placeholder="请输入用户名"
              clearable
              :disabled="loading"
              aria-label="用户名"
              data-testid="login-username-input"
              @keyup.enter="submit"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              ref="passwordInputRef"
              v-model="form.password"
              show-password
              placeholder="请输入密码"
              :disabled="loading"
              aria-label="密码"
              data-testid="login-password-input"
              @keyup.enter="submit"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="mfw-login-submit"
              native-type="submit"
              :loading="loading"
              :disabled="loading"
              aria-label="登录"
              data-testid="login-submit-btn"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="mfw-login-footer">
          <component :is="footerExtensionComponent" v-if="footerExtensionComponent" />
        </div>
      </template>

      <!-- 应用选择面板 -->
      <AppSelectorPanel
        v-else
        :apps="loginApps"
        :loading="false"
        :selected-app-id="selectingAppId"
        @select="handleAppSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { computed, defineAsyncComponent, markRaw, nextTick, onMounted, reactive, ref, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore, type AppInstance } from '../../store/auth-store';
import { useLayoutStore } from '../../store/layout-store';
import { useColorMode, useThemeSwitch } from '../../composables';
import { ParticleBackground } from '../../components/display';
import AppSelectorPanel from '../../components/business/app-selector-panel/Index.vue';
import type { AsyncExtensionComponent, ExtensionComponentInput } from '../../types/layout-types';

interface LoginFormState {
  username: string;
  password: string;
}

interface InputFocusInstance {
  focus: () => void;
}

type ValidateFieldsError = Record<string, unknown[]>;

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const layoutStore = useLayoutStore();
const { initColorMode, isDark } = useColorMode();
const { initTheme } = useThemeSwitch();
const formRef = ref<FormInstance>();
const usernameInputRef = ref<InputFocusInstance>();
const passwordInputRef = ref<InputFocusInstance>();
const loading = ref(false);
const selectingApp = ref(false);
const selectingAppId = ref<string>('');

const particleColor = computed(() => isDark.value ? 'rgba(255, 255, 255, 0.6)' : 'rgba(64, 158, 255, 0.6)');
const lineColor = computed(() => isDark.value ? 'rgba(255, 255, 255, 0.3)' : 'rgba(64, 158, 255, 0.3)');

const asyncExtensionCache = new WeakMap<AsyncExtensionComponent, Component>();
let lastSubmitAt = 0;

const form = reactive<LoginFormState>({
  username: '',
  password: '',
});

const rules: FormRules<LoginFormState> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const methodsExtensionComponent = computed(() => normalizeExtensionComponent(layoutStore.loginExtensions.methods));
const footerExtensionComponent = computed(() => normalizeExtensionComponent(layoutStore.loginExtensions.footer));

const extensionLoadingComponent = markRaw({
  template: '<div style="text-align:center;padding:8px;color:#999;font-size:13px;">加载中...</div>',
});

const extensionErrorComponent = markRaw({
  template: '<div style="text-align:center;padding:8px;color:#f56c6c;font-size:13px;">加载失败</div>',
});

function isAsyncExtensionComponent(input: ExtensionComponentInput): input is AsyncExtensionComponent {
  return typeof input === 'object' && input !== null && 'loader' in input && typeof input.loader === 'function';
}

function normalizeLoadedComponent(loaded: Component | { default: Component }): Component {
  if (typeof loaded === 'object' && loaded !== null && 'default' in loaded) {
    return loaded.default;
  }
  return loaded;
}

function resolveAsyncExtensionComponent(config: AsyncExtensionComponent): Component {
  const cached = asyncExtensionCache.get(config);
  if (cached) return cached;
  const asyncComponent = defineAsyncComponent({
    loader: async () => normalizeLoadedComponent(await config.loader()),
    delay: 120,
    timeout: config.timeout ?? 10000,
    suspensible: false,
    loadingComponent: extensionLoadingComponent,
    errorComponent: extensionErrorComponent,
  });
  const resolved = markRaw(asyncComponent);
  asyncExtensionCache.set(config, resolved);
  return resolved;
}

function normalizeExtensionComponent(input?: ExtensionComponentInput): Component | null {
  if (!input) return null;
  if (isAsyncExtensionComponent(input)) return resolveAsyncExtensionComponent(input);
  return input;
}

function focusFirstInvalidField(fields?: ValidateFieldsError) {
  if (fields?.username) { usernameInputRef.value?.focus(); return; }
  if (fields?.password) { passwordInputRef.value?.focus(); return; }
  usernameInputRef.value?.focus();
}

async function submit() {
  if (loading.value) return;
  const now = Date.now();
  if (now - lastSubmitAt < 800) return;
  lastSubmitAt = now;

  if (!formRef.value) return;

  const valid = await formRef.value.validate().then(() => true).catch((fields: ValidateFieldsError) => {
    focusFirstInvalidField(fields);
    return false;
  });

  if (!valid) return;

  loading.value = true;
  try {
    await authStore.login({ username: form.username, password: form.password });
    console.log('=======成功=======');
    await authStore.fetchUserInfo();
    await authStore.fetchUserApps();

    ElMessage.success('登录成功');

    if (authStore.apps.length === 0) {
      // 无应用时清空侧边栏菜单，防止暴露 createBaseAdminApp 初始化的全量默认菜单
      layoutStore.setNavigation({ sideMenu: [] }, { clearTabs: true });
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
      await router.replace(redirect);
      return;
    }

    const autoSelected = await authStore.autoSelectApp();
    if (autoSelected) {
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
      await router.replace(redirect);
      return;
    }

    // 多个应用需要选择 → 在登录页内嵌展示选择面板
    selectingApp.value = true;
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || '登录失败');
  } finally {
    loading.value = false;
  }
}

/** 登录页应用列表（转换为 AppListItem 格式） */
const loginApps = computed(() =>
  authStore.apps.map((app: AppInstance) => ({
    appId: app.appId,
    appName: app.appName,
    appCode: app.appCode,
    appLogo: app.appLogo,
    isOwner: app.isOwner,
    role: app.isOwner ? 'owner' : 'member',
    appTypeName: app.appTypeName,
  }))
);

/** 处理应用选择 */
async function handleAppSelect(app: { appId: string; appName: string; appCode: string; appLogo?: string; isOwner: boolean; appTypeName?: string }) {
  selectingAppId.value = app.appId;
  try {
    await authStore.selectApp({
      appId: app.appId,
      appName: app.appName,
      appCode: app.appCode,
      appLogo: app.appLogo,
      isOwner: app.isOwner,
      appTypeName: app.appTypeName,
    });
    ElMessage.success(`已进入应用: ${app.appName}`);
    await router.replace('/');
  } catch (error: any) {
    selectingAppId.value = '';
    ElMessage.error(error?.response?.data?.message || error?.message || '切换应用失败');
  }
}

initColorMode();

onMounted(async () => {
  initTheme();

  // 已登录但尚未选择应用 → 初始化认证并展示选择面板
  if (authStore.isLoggedIn && authStore.needSelectApp) {
    if (authStore.apps.length === 0) {
      try {
        await authStore.fetchUserInfo();
        await authStore.fetchUserApps();
      } catch {
        // 获取失败则回退到登录表单
      }
    }
    if (authStore.apps.length > 0) {
      const autoSelected = await authStore.autoSelectApp();
      if (autoSelected) {
        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
        await router.replace(redirect);
        return;
      }
      selectingApp.value = true;
      return;
    }
  }

  void nextTick(() => { usernameInputRef.value?.focus(); });
});
</script>

<style scoped src="./login-page.scss" lang="scss"></style>