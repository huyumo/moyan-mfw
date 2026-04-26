/**
 * @fileoverview 应用类型配置
 */

import { AppTypeConfig } from 'moyan-base-backend';

export const appTypesConfig: AppTypeConfig[] = [
  {
    typeName: '供应商',
    typeCode: 'supplier',
    typeDesc: '供应商应用类型',
    multiAppEnabled: 1,
    builtinRole: [
      { roleCode: 'supplier_admin', roleName: '供应商管理员' },
      { roleCode: 'supplier_member', roleName: '供应商成员' },
    ],
  },
];