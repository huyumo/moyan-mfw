/**
 * @fileoverview 权限检查 Hook
 * @description 提供按钮级权限检查功能
 */

import { useRoute } from 'vue-router';
import { useAuthStore } from '../store/auth-store';
import { buildPerValue } from '../utils/permissions';

/**
 * 权限检查选项
 */
export interface PermissionCheckOptions {
  /** 权限编码（可选，不传则自动推断） */
  permCode?: string;
  /** 权限值数组，如 ['添加', '编辑', '发货'] */
  value: string[];
}

/**
 * 权限检查 Hook
 * @description 提供按钮级权限检查功能
 *
 * @example
 * ```typescript
 * const { hasPermissionValue, hasAnyPermissionValue } = usePermission();
 *
 * // 检查单个权限
 * const canAdd = hasPermissionValue({ value: ['添加'] });
 *
 * // 检查多个权限（OR 逻辑）
 * const canAddOrEdit = hasAnyPermissionValue(['添加', '编辑']);
 * ```
 */
export function usePermission() {
  const route = useRoute();
  const authStore = useAuthStore();

  /**
   * 检查是否拥有指定权限
   * @param options 权限检查选项
   * @returns 是否有权限
   */
  function hasPermissionValue(options: PermissionCheckOptions): boolean {
    const { permCode, value } = options;

    const targetPermCode = permCode || authStore.getPermCodeByRoute(route.path);
    if (!targetPermCode) {
      console.warn('[usePermission] 无法获取 permCode，请显式指定');
      return false;
    }

    const userValue = authStore.permissionValueMap[targetPermCode];
    if (!userValue) {
      return false;
    }

    const requiredValue = buildPerValue(value);
    return (BigInt(userValue) & requiredValue) !== 0n;
  }

  /**
   * 检查是否拥有任意一个权限（OR 逻辑）
   * @param values 权限值数组
   * @param permCode 权限编码（可选）
   * @returns 是否有任意一个权限
   */
  function hasAnyPermissionValue(values: string[], permCode?: string): boolean {
    return values.some((v) => hasPermissionValue({ value: [v], permCode }));
  }

  /**
   * 检查是否拥有所有权限（AND 逻辑）
   * @param values 权限值数组
   * @param permCode 权限编码（可选）
   * @returns 是否拥有所有权限
   */
  function hasAllPermissionValues(values: string[], permCode?: string): boolean {
    return values.every((v) => hasPermissionValue({ value: [v], permCode }));
  }

  /**
   * 获取当前页面的 permCode
   * @returns 当前页面的 permCode
   */
  function getCurrentPermCode(): string | undefined {
    return authStore.getPermCodeByRoute(route.path);
  }

  return {
    hasPermissionValue,
    hasAnyPermissionValue,
    hasAllPermissionValues,
    getCurrentPermCode,
  };
}