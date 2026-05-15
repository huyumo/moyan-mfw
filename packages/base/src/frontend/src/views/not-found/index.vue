<!--
/**
 * @fileoverview - 404 页面不存在
 *
 * 当用户访问的路由不存在时显示的异常页面。
 * 提供友好的错误提示和导航选项。
 *
 * 页面内容：
 * 1. 404 错误码显示
 * 2. 错误描述：提示用户访问的页面不存在
 * 3. 操作按钮：返回首页、前往登录
 *
 * 使用场景：
 * - 路由匹配失败时显示（通配符路由 *）
 * - 手动输入错误 URL 时显示
 *
 * @author moyan
 * @since 1.0.0
 */
-->
<template>
  <div class="mfw-exception-page">
    <el-card class="mfw-exception-card">
      <h1>404</h1>
      <p>你访问的页面不存在。</p>
      <el-space>
        <el-button type="primary" data-testid="not-found-home-btn" @click="go('/dashboard')">返回首页</el-button>
        <el-button data-testid="not-found-login-btn" @click="go('/login')">前往登录</el-button>
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

/** 路由器实例 */
const router = useRouter();

/**
 * 导航到指定路径
 * @param path - 目标路径
 */
function go(path: string) {
  router.push(path);
}
</script>
