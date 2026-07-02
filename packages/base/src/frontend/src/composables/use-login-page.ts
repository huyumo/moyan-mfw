/**
 * @fileoverview 登录页逻辑 composable
 * @description 将登录页状态、登录编排、Token 持久化等逻辑提取为可复用单元。
 * 框架内置登录页与自定义登录页均使用此 composable。
 */

import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth-store'
import { useLayoutStore } from '../store/layout-store'
import { useColorMode } from './use-color-mode'
import { useThemeSwitch } from './use-theme-switch'
import { MfwPopup } from '../components/feedback'
import AppSelectorDialog from '../components/business/app-selector-dialog/Index.vue'

interface LoginFormState {
  username: string
  password: string
}

interface InputFocusInstance {
  focus: () => void
}

type ValidateFieldsError = Record<string, unknown[]>

export function useLoginPage() {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const layoutStore = useLayoutStore()
  const { initColorMode, isDark } = useColorMode()
  const { initTheme } = useThemeSwitch()

  // ── 表单状态 ──
  const formRef = ref<FormInstance>()
  const usernameInputRef = ref<InputFocusInstance>()
  const passwordInputRef = ref<InputFocusInstance>()
  const loading = ref(false)

  let lastSubmitAt = 0

  const form = reactive<LoginFormState>({
    username: '',
    password: '',
  })

  const rules: FormRules<LoginFormState> = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  }

  // ── 辅助函数 ──
  function focusFirstInvalidField(fields?: ValidateFieldsError) {
    if (fields?.username) {
      usernameInputRef.value?.focus()
      return
    }
    if (fields?.password) {
      passwordInputRef.value?.focus()
      return
    }
    usernameInputRef.value?.focus()
  }

  // ── 登录后编排 ──
  function saveToken(token: string, refreshToken: string, expiresIn: number) {
    authStore.saveToken(token, refreshToken, expiresIn)
  }

  /** 弹出应用选择弹窗 */
  function showAppSelectorPopup() {
    MfwPopup.open({
      title: '选择应用',
      type: 'dialog',
      component: AppSelectorDialog,
      popupProps: { width: '600px', closeOnClickModal: false },
      footer: false,
    })
  }

  async function handlePostLogin() {
    await authStore.fetchUserInfo()
    await authStore.fetchUserApps()

    ElMessage.success('登录成功')

    if (authStore.apps.length === 0) {
      layoutStore.setNavigation({ sideMenu: [] }, { clearTabs: true })
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      await router.replace(redirect)
      return
    }

    const autoSelected = await authStore.autoSelectApp()
    if (autoSelected) {
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      await router.replace(redirect)
      return
    }

    showAppSelectorPopup()
  }

  // ── 内置账密登录 ──
  async function submit() {
    if (loading.value) return
    const now = Date.now()
    if (now - lastSubmitAt < 800) return
    lastSubmitAt = now

    if (!formRef.value) return

    const valid = await formRef.value.validate().then(() => true).catch((fields: ValidateFieldsError) => {
      focusFirstInvalidField(fields)
      return false
    })

    if (!valid) return

    loading.value = true
    try {
      await authStore.login({ username: form.username, password: form.password })
      await handlePostLogin()
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || error?.message || '登录失败')
    } finally {
      loading.value = false
    }
  }

  // ── 生命周期 ──
  initColorMode()

  onMounted(async () => {
    initTheme()

    if (authStore.isLoggedIn && authStore.needSelectApp) {
      if (authStore.apps.length === 0) {
        try {
          await authStore.fetchUserInfo()
          await authStore.fetchUserApps()
        } catch {
          // 获取失败则回退到登录表单
        }
      }
      if (authStore.apps.length > 0) {
        const autoSelected = await authStore.autoSelectApp()
        if (autoSelected) {
          const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
          await router.replace(redirect)
          return
        }
        showAppSelectorPopup()
        return
      }
    }

    void nextTick(() => { usernameInputRef.value?.focus() })
  })

  return {
    formContext: {
      form,
      loading,
      rules,
      submit,
      formRef,
      usernameInputRef,
      passwordInputRef,
    },
    postLoginContext: {
      saveToken,
      handlePostLogin,
    },
    isDark,
  }
}
