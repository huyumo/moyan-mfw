<!--
/**
 * @fileoverview 用户菜单面板组件。
 */
-->
<template>
  <slot name="header-avatar">
    <component :is="layoutExtensions.headerAvatar" v-if="layoutExtensions.headerAvatar" />
    <el-dropdown v-else trigger="click" @command="handleUserCommand">
      <button class="mfw-admin-avatar-trigger" type="button" aria-label="Open user menu">
        <el-avatar :size="30">A</el-avatar>
        <strong>Admin</strong>
        <el-icon><ArrowDown /></el-icon>
      </button>
      <template #dropdown>
        <slot name="header-user-menu">
          <component :is="layoutExtensions.headerUserMenu" v-if="layoutExtensions.headerUserMenu" />
          <el-dropdown-menu v-else>
            <el-dropdown-item command="profile">Profile</el-dropdown-item>
            <el-dropdown-item command="message">Messages</el-dropdown-item>
            <el-dropdown-item command="settings">Settings</el-dropdown-item>
            <el-dropdown-item command="logout" divided>Logout</el-dropdown-item>
          </el-dropdown-menu>
        </slot>
      </template>
    </el-dropdown>
  </slot>
</template>

<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue';
import type { LayoutExtensionComponents } from '../../types/layout-types';

defineProps<{
  /** 布局扩展组件 */
  layoutExtensions: LayoutExtensionComponents;
}>();

const emit = defineEmits<{
  /** 用户菜单命令 */
  (e: 'user-command', command: string | number | object): void;
}>();

function handleUserCommand(command: string | number | object) {
  emit('user-command', command);
}
</script>
