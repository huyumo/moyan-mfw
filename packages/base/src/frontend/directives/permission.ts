/**
 * @fileoverview 按钮级权限控制指令
 * @description 通过权限编码控制元素显示/隐藏
 */

import type { Directive, DirectiveBinding } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../store/auth-store';
import { buildPerValue, type PermissionName } from '../utils/permissions';

/**
 * 权限指令值接口（新格式）
 * @description 支持权限值检查的新格式
 */
interface PermissionDirectiveValue {
  permCode?: string;
  value: PermissionName[];
}

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
 * 检查按钮权限值
 * @param permCode 权限编码
 * @param permValues 权限值数组
 * @param authStore 认证 store
 * @returns 是否有权限
 */
function checkButtonPermission(
  permCode: string | undefined,
  permValues: PermissionName[],
  authStore: ReturnType<typeof useAuthStore>
): boolean {
  if (!permCode) {
    return false;
  }
  const userValue = authStore.permissionValueMap[permCode];
  if (!userValue) {
    return false;
  }
  const requiredValue = buildPerValue(permValues);
  return (BigInt(userValue) & requiredValue) !== 0n;
}

/**
 * 检查权限指令
 * @param el HTML 元素
 * @param binding 指令绑定
 */
function checkPermissionDirective(
  el: HTMLElement,
  binding: DirectiveBinding<PermissionDirectiveValue | string>
) {
  const authStore = useAuthStore();
  const route = useRoute();
  const value = binding.value;

  if (!value) {
    el.style.display = '';
    el.removeAttribute('data-permission-hidden');
    return;
  }

  let hasAccess = false;

  if (typeof value === 'string') {
    hasAccess = hasPermission(value);
  } else if (typeof value === 'object' && 'value' in value) {
    const permCode = value.permCode || authStore.getPermCodeByRoute(route.path);
    hasAccess = checkButtonPermission(permCode, value.value, authStore);
  }

  if (!hasAccess) {
    el.style.display = 'none';
    el.setAttribute('data-permission-hidden', 'true');
  } else {
    el.style.display = '';
    el.removeAttribute('data-permission-hidden');
  }
}

/**
 * 权限指令
 * @example
 * ```vue
 * <!-- 传统用法：权限编码 -->
 * <el-button v-permission="sys:user:create">新建用户</el-button>
 *
 * <!-- 新用法：权限值检查 -->
 * <el-button v-permission="{ value: ['添加'] }">添加</el-button>
 * <el-button v-permission="{ permCode: 'sys:user', value: ['编辑', '删除'] }">操作</el-button>
 * ```
 */
export const vPermission: Directive<HTMLElement, PermissionDirectiveValue | string> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionDirectiveValue | string>) {
    checkPermissionDirective(el, binding);
  },

  updated(el: HTMLElement, binding: DirectiveBinding<PermissionDirectiveValue | string>) {
    checkPermissionDirective(el, binding);
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