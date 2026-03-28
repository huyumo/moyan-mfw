<!--
/**
 * @fileoverview - 403 权限不足页面
 *
 * 当用户尝试访问没有权限的资源时显示的异常页面。
 * 提供友好的错误提示和导航选项。
 *
 * 页面内容：
 * 1. 403 错误码显示
 * 2. 错误描述：提示用户没有权限访问该资源
 * 3. 操作按钮：返回首页、切换账号
 *
 * 使用场景：
 * - 路由守卫检测到权限不足时重定向到此页面
 * - API 请求返回 403 状态码时跳转
 *
 * @author moyan
 * @since 1.0.0
 */
-->
<template>
  <div class="mfw-exception-page">
    <el-card class="mfw-exception-card">
      <h1>403</h1>
      <p>你没有权限访问该资源。</p>
      <el-space>
        <el-button type="primary" @click="go('/dashboard')">返回首页</el-button>
        <el-button @click="go('/login')">切换账号</el-button>
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
