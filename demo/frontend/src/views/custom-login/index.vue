<!--
/**
 * @fileoverview 自定义登录页 — 左右分栏布局（测试 loginComponent 注入 + useLoginPage composable）
 *
 * 测试目标：
 * - 通过 createBaseAdminApp({ loginComponent }) 注入自定义登录页
 * - 复用 useLoginPage() 的 formContext（账密登录 + 表单状态）
 * - 自定义 UI 渲染（左品牌区 + 右表单区）
 */
-->
<template>
  <div class="custom-login-page">
    <!-- 左侧品牌展示区 -->
    <div class="custom-login-banner">
      <div class="banner-content">
        <div class="banner-logo">
          <svg width="64" height="64" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="10" fill="var(--el-color-primary)"/>
            <path d="M24 12L32 20V28L24 36L16 28V20L24 12Z" fill="#fff"/>
            <circle cx="24" cy="24" r="4" fill="var(--el-color-primary-light-9)"/>
          </svg>
        </div>
        <h1 class="banner-title">{{ layoutStore.navigation.brandName || '墨焱管理后台' }}</h1>
        <p class="banner-desc">高效 · 安全 · 可扩展的企业管理平台</p>
      </div>
    </div>

    <!-- 右侧登录表单区 -->
    <div class="custom-login-form-area">
      <div class="form-wrapper">
        <h2 class="form-title">欢迎回来</h2>
        <p class="form-subtitle">请输入您的账号密码登录系统</p>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          class="login-form"
          @submit.prevent="submit"
        >
          <el-form-item prop="username" label="用户名">
            <el-input
              ref="usernameInputRef"
              v-model="form.username"
              placeholder="请输入用户名"
              :prefix-icon="UserIcon"
              clearable
              :disabled="loading"
              @keyup.enter="submit"
            />
          </el-form-item>

          <el-form-item prop="password" label="密码">
            <el-input
              ref="passwordInputRef"
              v-model="form.password"
              type="password"
              show-password
              placeholder="请输入密码"
              :prefix-icon="LockIcon"
              :disabled="loading"
              @keyup.enter="submit"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="login-submit-btn"
              native-type="submit"
              :loading="loading"
              :disabled="loading"
              size="large"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <p class="form-footer-text">
          测试自定义登录页 — 使用 useLoginPage() composable
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Lock } from '@element-plus/icons-vue'
import { useLoginPage } from 'moyan-mfw-base/frontend'
import { useLayoutStore } from 'moyan-mfw-base/frontend'

const UserIcon = User
const LockIcon = Lock

const layoutStore = useLayoutStore()
const {
  formContext: { form, loading, rules, submit, formRef, usernameInputRef, passwordInputRef },
} = useLoginPage()
</script>

<style scoped>
.custom-login-page {
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;
}

/* 左侧品牌区 */
.custom-login-banner {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.custom-login-banner::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
}

.banner-content {
  position: relative;
  text-align: center;
  color: #fff;
}

.banner-logo {
  margin-bottom: 24px;
}

.banner-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  letter-spacing: 2px;
}

.banner-desc {
  font-size: 16px;
  opacity: 0.85;
  margin: 0;
}

/* 右侧表单区 */
.custom-login-form-area {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 40px;
}

.form-wrapper {
  width: 100%;
  max-width: 360px;
}

.form-title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.form-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0 0 32px 0;
}

.login-form {
  width: 100%;
}

.login-submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 2px;
}

.form-footer-text {
  text-align: center;
  font-size: 12px;
  color: #bbb;
  margin: 24px 0 0 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .custom-login-banner {
    display: none;
  }

  .custom-login-form-area {
    width: 100%;
    padding: 24px;
  }
}
</style>
