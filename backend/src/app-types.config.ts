/**
 * @fileoverview 应用类型配置
 * @description 定义业务应用类型， */

import { AppTypeConfig } from 'moyan-base/backend';

/**
 * 业务应用类型配置
 * 注意：内置类型 system 和 admin 不可覆盖
 */
export const appTypesConfig: AppTypeConfig[] = [
  {
    typeName: '供应商',
    typeCode: 'supplier',
    typeDesc: '供应商应用类型，用于管理供应商相关业务',
    multiAppEnabled: 1,
    builtinRole: [
      { roleCode: 'supplier_admin', roleName: '供应商管理员', isOwner: 1 },
      { roleCode: 'supplier_member', roleName: '供应商成员' },
    ],
  },
];