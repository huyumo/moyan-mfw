/**
 * @fileoverview 按钮级权限控制指令
 * @description 通过权限编码控制元素显示/隐藏
 */

import type { Directive, DirectiveBinding } from 'vue';
import { useAuthStore } from '../store/auth-store';

/**
 * 检查是否有指定权限
 * @param permCode 权限编码
 * @returns 是否有权限
 */
function hasPermission(permCode: string): boolean {
  const authStore = useAuthStore();
  const permissionMenu = authStore.permissionMenu;

  if (!permissionMenu || permissionMenu.length === 0) {
    return true; // 无权限数据时暂时允许通过
  }

  return checkPermissionInMenu(permCode, permissionMenu);
}

/**
 * 递归检查权限是否在菜单中
 * @param permCode 权限编码
 * @param menu 权限菜单
 * @returns 是否有权限
 */
function checkPermissionInMenu(permCode: string, menu: any[]): boolean {
  for (const item of menu) {
    if (item.permCode === permCode) {
      return true;
    }
    if (item.children && item.children.length > 0) {
      if (checkPermissionInMenu(permCode, item.children)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 权限指令
 * @example
 * ```vue
 * <el-button v-permission="sys:user:create">新建用户</el-button>
 * <el-button v-permission="['sys:user:edit', 'sys:user:delete']">批量操作</el-button>
 * ```
 */
export const vPermission: Directive<HTMLElement, string | string[]> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const value = binding.value;

    if (!value) {
      return;
    }

    let hasAccess = false;

    if (typeof value === 'string') {
      hasAccess = hasPermission(value);
    } else if (Array.isArray(value)) {
      // 多个权限时，满足任一即可
      hasAccess = value.some(code => hasPermission(code));
    }

    if (!hasAccess) {
      el.style.display = 'none';
      el.setAttribute('data-permission-hidden', 'true');
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const value = binding.value;

    if (!value) {
      el.style.display = '';
      el.removeAttribute('data-permission-hidden');
      return;
    }

    let hasAccess = false;

    if (typeof value === 'string') {
      hasAccess = hasPermission(value);
    } else if (Array.isArray(value)) {
      hasAccess = value.some(code => hasPermission(code));
    }

    if (!hasAccess) {
      el.style.display = 'none';
      el.setAttribute('data-permission-hidden', 'true');
    } else {
      el.style.display = '';
      el.removeAttribute('data-permission-hidden');
    }
  },
};

/**
 * 安装权限指令
 * @param app Vue 应用实例
 */
export function setupPermissionDirective(app: any): void {
  app.directive('permission', vPermission);
}

export default vPermission;