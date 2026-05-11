/**
 * @fileoverview 应用类型验证器
 */

import { AppTypeConfig } from '../types/app-config.types';

/** 内置应用类型 typeCode */
export const BUILTIN_APP_TYPES = ['system', 'admin'];

/**
 * 验证使用者配置的应用类型是否与内置类型冲突
 */
export function validateAppTypes(userAppTypes: AppTypeConfig[]): void {
  if (!userAppTypes || userAppTypes.length === 0) {
    return;
  }

  for (const appType of userAppTypes) {
    if (BUILTIN_APP_TYPES.includes(appType.typeCode)) {
      throw new Error(
        `应用类型 typeCode "${appType.typeCode}" 是内置类型，不可覆盖。内置类型: ${BUILTIN_APP_TYPES.join(', ')}`,
      );
    }

    validateOwnerRole(appType);
  }
}

/**
 * 验证内置角色中有且仅有一个拥有者角色
 */
export function validateOwnerRole(appType: AppTypeConfig): void {
  const { typeCode, typeName, builtinRole } = appType;

  if (!builtinRole || builtinRole.length === 0) {
    throw new Error(
      `应用类型 "${typeName}" (${typeCode}) 至少需要配置一个内置角色`,
    );
  }

  const ownerRoles = builtinRole.filter((r) => r.isOwner === 1);

  if (ownerRoles.length === 0) {
    throw new Error(
      `应用类型 "${typeName}" (${typeCode}) 必须指定一个拥有者角色（isOwner: 1）`,
    );
  }

  if (ownerRoles.length > 1) {
    throw new Error(
      `应用类型 "${typeName}" (${typeCode}) 只能有一个拥有者角色，当前有 ${ownerRoles.length} 个：${ownerRoles.map((r) => r.roleCode).join(', ')}`,
    );
  }
}

/**
 * 获取内置应用类型配置
 */
export function getBuiltinAppTypes(): AppTypeConfig[] {
  return [
    {
      typeName: '系统管理',
      typeCode: 'system',
      typeDesc: '系统管理员，拥有全部权限',
      multiAppEnabled: 0,
      builtinRole: [
        { roleCode: 'system_admin', roleName: '系统管理员', isOwner: 1 },
      ],
    },
    {
      typeName: '管理员',
      typeCode: 'admin',
      typeDesc: '应用管理员，管理单个应用',
      multiAppEnabled: 1,
      builtinRole: [
        { roleCode: 'app_admin', roleName: '应用管理员', isOwner: 1 },
      ],
    },
  ];
}