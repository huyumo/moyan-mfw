/**
 * @fileoverview 文档管理扩展包权限定义
 * @description 声明本扩展包使用的权限标签，供业务层统一收集注入
 *
 * 使用方式：
 *   业务层 backend/src/main.ts 中：
 *   import { DOCUMENT_PERMISSION_VALUES } from 'moyan-mfw-extension-document/shared'
 *   createBaseBackendApp({ permissionValues: [...DOCUMENT_PERMISSION_VALUES] })
 *
 * 注意：'查看'、'编辑'、'删除' 已在框架 DEFAULT_PERMISSION_VALUES 中，
 * 无需重复声明。待业务需要时追加扩展包独有的标签。
 */

export const DOCUMENT_PERMISSION_VALUES: readonly string[] = [
  // '查看'、'编辑'、'删除' 已在框架 DEFAULT_PERMISSION_VALUES 中
  // 待业务需要时追加扩展包独有的标签
] as const;

export type DocumentExtensionPermissionName = (typeof DOCUMENT_PERMISSION_VALUES)[number];
