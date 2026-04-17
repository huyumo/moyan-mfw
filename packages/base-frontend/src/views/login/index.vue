<!--
/**
 * @fileoverview 登录页面组件。
 */
-->
<template>
  <div class="mfw-login-page">
    <div class="mfw-login-layout">
      <aside class="mfw-login-layout__aside">
        <component :is="asideExtensionComponent" v-if="asideExtensionComponent" />
        <template v-else>
          <div class="mfw-login-brand-card">
            <p class="mfw-login-brand-card__badge">MFW BASE FRONTEND</p>
            <h2>Unified Admin Sign-In</h2>
            <p>
              Supports future expansion for SMS login, QR login, and third-party SSO while keeping a consistent visual
              experience.
            </p>
            <ul>
              <li>Extensible login methods region</li>
              <li>Extensible side branding region</li>
              <li>Extensible footer helper region</li>
            </ul>
          </div>
        </template>
      </aside>

      <section class="mfw-login-layout__panel">
        <div class="mfw-login-header">
          <h1>Moyan Admin Console</h1>
          <p>Frontend foundation for admin business applications.</p>
        </div>

        <div class="mfw-login-methods">
          <component :is="methodsExtensionComponent" v-if="methodsExtensionComponent" />
          <p v-else class="mfw-login-extension-empty">No extra login methods configured.</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
          <el-form-item label="Username" prop="username">
            <el-input
              ref="usernameInputRef"
              v-model="form.username"
              placeholder="Enter username"
              size="large"
              clearable
              :disabled="loading"
              aria-label="Username"
              @keyup.enter="submit"
            />
          </el-form-item>

          <el-form-item label="Password" prop="password">
            <el-input
              ref="passwordInputRef"
              v-model="form.password"
              show-password
              placeholder="Enter password"
              size="large"
              :disabled="loading"
              aria-label="Password"
              @keyup.enter="submit"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="mfw-login-submit"
              size="large"
              native-type="submit"
              :loading="loading"
              :disabled="loading"
              aria-label="Submit login"
            >
              Sign In
            </el-button>
          </el-form-item>
        </el-form>

        <div class="mfw-login-footer">
          <component :is="footerExtensionComponent" v-if="footerExtensionComponent" />
          <p v-else class="mfw-login-tip">Demo login mode: any valid values can enter the dashboard.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { computed, defineAsyncComponent, markRaw, nextTick, onMounted, reactive, ref, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth-store';
import { useLayoutStore } from '../../store/layout-store';
import type { AsyncExtensionComponent, ExtensionComponentInput } from '../../types/layout-types';

/** 登录表单状态。 */
interface LoginFormState {
  /** 用户名。 */
  username: string;
  /** 密码。 */
  password: string;
}

/** 输入框聚焦能力。 */
interface InputFocusInstance {
  /** 聚焦输入框。 */
  focus: () => void;
}

type ValidateFieldsError = Record<string, unknown[]>;

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const layoutStore = useLayoutStore();
const formRef = ref<FormInstance>();
const usernameInputRef = ref<InputFocusInstance>();
const passwordInputRef = ref<InputFocusInstance>();
const loading = ref(false);

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

const asideExtensionComponent = computed(() => normalizeExtensionComponent(layoutStore.loginExtensions.aside));
const methodsExtensionComponent = computed(() => normalizeExtensionComponent(layoutStore.loginExtensions.methods));
const footerExtensionComponent = computed(() => normalizeExtensionComponent(layoutStore.loginExtensions.footer));

const extensionLoadingComponent = markRaw({
  template: '<div class="mfw-login-extension-state">Loading extension...</div>',
});

const extensionErrorComponent = markRaw({
  template: '<div class="mfw-login-extension-state is-error">Extension failed to load.</div>',
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
  if (cached) {
    return cached;
  }

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
  if (!input) {
    return null;
  }
  if (isAsyncExtensionComponent(input)) {
    return resolveAsyncExtensionComponent(input);
  }
  return input;
}

function focusFirstInvalidField(fields?: ValidateFieldsError) {
  if (fields?.username) {
    usernameInputRef.value?.focus();
    return;
  }
  if (fields?.password) {
    passwordInputRef.value?.focus();
    return;
  }
  usernameInputRef.value?.focus();
}

async function submit() {
  if (loading.value) {
    return;
  }

  const now = Date.now();
  if (now - lastSubmitAt < 800) {
    return;
  }
  lastSubmitAt = now;

  if (!formRef.value) {
    return;
  }

  const valid = await formRef.value
    .validate()
    .then(() => true)
    .catch((fields: ValidateFieldsError) => {
      focusFirstInvalidField(fields);
      return false;
    });

  if (!valid) {
    return;
  }

  loading.value = true;
      // 调用真实登录 API
    await authStore.login({
      username: form.username,
      password: form.password,
    });

    ElMessage.success('登录成功');

    // 跳转到目标页面
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.replace(redirect);
  try {

  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || '登录失败，请检查用户名和密码';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void nextTick(() => {
    usernameInputRef.value?.focus();
  });
});
</script>

<style scoped src="./login-page.scss" lang="scss"></style>
