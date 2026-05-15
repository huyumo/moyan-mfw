/**
 * @fileoverview 业务层权限值 — 前后端共享源
 * @description 前后端统一从此处导入，修改后类型推断和位运算映射自动同步
 */
export declare const BUSINESS_PERMISSION_VALUES: readonly ["上架", "发货", "退款", "充值", "接待", "指派", "添加"];
export type BusinessPermissionName = (typeof BUSINESS_PERMISSION_VALUES)[number];
