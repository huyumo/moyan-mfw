<!--
**
 * @fileoverview - 头部用户头像面板组件（参考 Vben Admin 设计）
 *
 * 该组件是墨焱管理后台顶部导航栏的用户操作区，提供用户信息和快捷操作菜单。
 *
 * 功能说明：
 * 1. 用户信息展示
 *    - 显示用户头像：圆形头像，显示"墨"字，尺寸 32px
 *    - 简洁设计：无边框、无箭头、无文字
 *
 * 2. 下拉菜单操作
 *    - 我的资料（profile）：跳转到 /business/orders
 *    - 站内消息（message）：跳转到 /monitor/overview
 *    - 主题偏好（setting）：跳转到 /business/reports
 *    - 退出登录（logout）：清除本地 token 并跳转到登录页
 *
 * 交互逻辑：
 * - 点击用户区域触发下拉菜单
 * - 选择菜单项后执行相应操作
 * - 退出登录时清除 localStorage 中的认证令牌
 *
 * 样式设计：
 * - 圆形头像，尺寸 32px
 * - 鼠标悬停时显示缩放效果
 *
 * 技术实现：
 * - 使用 Vue 3 Composition API（script setup）
 * - 使用 Element Plus UI 组件库（el-dropdown、el-dropdown-menu、el-avatar）
 * - 使用 SCSS 进行样式编写
 * - 通过 window.location.href 实现页面跳转
 *
 * @author moyan
 * @since 1.0.0
-->

<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <div class="user-avatar-panel">
      <el-avatar :size="32" class="avatar">墨</el-avatar>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="profile">我的资料</el-dropdown-item>
        <el-dropdown-item command="message">站内消息</el-dropdown-item>
        <el-dropdown-item command="setting">主题偏好</el-dropdown-item>
        <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

/**
 * 路由器实例
 */
const router = useRouter();

/**
 * 处理下拉菜单命令
 * @param command - 菜单命令值
 */
function handleCommand(command: string | number | object) {
  const action = String(command);

  if (action === 'logout') {
    window.localStorage.removeItem('mfw:admin:token');
    router.push('/login');
    return;
  }

  if (action === 'profile') {
    router.push('/business/orders');
    return;
  }

  if (action === 'message') {
    router.push('/monitor/overview');
    return;
  }

  router.push('/business/reports');
}
</script>

<style scoped lang="scss">
.user-avatar-panel {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;

  .avatar {
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}
</style>
