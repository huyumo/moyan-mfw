/**
 * @fileoverview 借贷记账扩展包权限标签
 * @description 声明本扩展包自定义权限标签，供业务层统一收集注入
 *
 * 使用方式（业务层 backend/src/main.ts）：
 *   import { LEDGER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ledger/shared'
 *   createBaseBackendApp({ permissionValues: [...LEDGER_EXTENSION_PERMISSION_VALUES] })
 *
 * 注意：
 *   - 「添加」「导出」已包含在框架 DEFAULT_PERMISSION_VALUES 中，此处不再重复声明
 *   - 制单权限使用内置「添加」标签
 *   - 权限标签按业务层收集去重顺序分配位值，append-only 永不回收
 */

export const LEDGER_EXTENSION_PERMISSION_VALUES = [
  '审核', // 审核交易单（通过/驳回）
  '冲正', // 发起全额冲正
  '对账', // 触发对账与修复
] as const

export type LedgerExtensionPermissionName = (typeof LEDGER_EXTENSION_PERMISSION_VALUES)[number]
