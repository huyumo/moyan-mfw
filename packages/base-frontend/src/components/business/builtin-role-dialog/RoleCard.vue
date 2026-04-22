<!--
/**
 * @fileoverview 内置角色卡片组件
 * @description 用于内置角色管理弹窗的卡片展示
 */
-->
<template>
  <div class="role-card">
    <div class="role-card__header">
      <div class="role-card__icon">
        <el-icon :size="20"><User /></el-icon>
      </div>
      <span class="role-card__name">{{ data.roleName }}</span>
    </div>
    
    <div class="role-card__body">
      <div class="role-card__code">{{ data.roleCode }}</div>
      <p class="role-card__desc">{{ data.roleDesc || '暂无描述' }}</p>
      <el-tag :type="data.roleStatus === STATUS.ENABLED ? 'success' : 'danger'" size="small">
        {{ data.roleStatus === STATUS.ENABLED ? '启用' : '禁用' }}
      </el-tag>
    </div>
    
    <div class="role-card__footer">
      <el-button type="primary" size="small" link @click="$emit('permission', data)">配置权限</el-button>
      <el-button size="small" link @click="$emit('edit', data)">编辑</el-button>
      <el-button type="danger" size="small" link @click="$emit('delete', data)">删除</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User } from '@element-plus/icons-vue';
import type { RoleResponseDto } from '../../../apis/sys/schemas';

const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'RoleCard' });

defineProps<{
  data: RoleResponseDto;
}>();

defineEmits<{
  (e: 'permission', data: RoleResponseDto): void;
  (e: 'edit', data: RoleResponseDto): void;
  (e: 'delete', data: RoleResponseDto): void;
}>();
</script>

<style scoped lang="scss">
.role-card {
  width: 100%;
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  &__icon {
    width: 28px;
    height: 28px;
    background: var(--el-color-primary-light-9);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-color-primary);
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__body {
    margin-bottom: 6px;
  }

  &__code {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  &__desc {
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.4;
    margin: 0 0 4px 0;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>