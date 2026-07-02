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
    <div class="mfw-login-card">
      <div class="mfw-login-logo">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="10" class="mfw-logo-bg"/>
          <path d="M24 12L32 20V28L24 36L16 28V20L24 12Z" class="mfw-logo-path"/>
          <circle cx="24" cy="24" r="4" class="mfw-logo-circle"/>
        </svg>
      </div>

      <h1 class="mfw-login-title">{{ layoutStore.navigation.brandName || '墨焱管理后台' }}</h1>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLoginPage } from '../../composables/use-login-page'
import { useLayoutStore } from '../../store/layout-store'
import { ParticleBackground } from '../../components/display'

const layoutStore = useLayoutStore()
const {
  formContext: { form, loading, rules, submit, formRef, usernameInputRef, passwordInputRef },
  isDark,
} = useLoginPage()

const particleColor = computed(() => isDark.value ? 'rgba(255, 255, 255, 0.6)' : 'rgba(64, 158, 255, 0.6)')
const lineColor = computed(() => isDark.value ? 'rgba(255, 255, 255, 0.3)' : 'rgba(64, 158, 255, 0.3)')
</script>

<style scoped src="./login-page.scss" lang="scss"></style>
