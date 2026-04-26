/**
 * @fileoverview 权限常量定义
 * @description 定义全局权限位运算常量和工具函数（支持代码扩展）
 */

/**
 * 默认权限配置（基础框架提供）
 * 这些权限值在 base-backend 和 base-frontend 中已使用，不可覆盖
 */
export const DEFAULT_PERMISSION_VALUES = [
  '添加',    // 0: 1n << 0 = 1n
  '编辑',    // 1: 1n << 1 = 2n
  '删除',    // 2: 1n << 2 = 4n
  '导出',    // 3: 1n << 3 = 16n
  '导入',    // 4: 1n << 4 = 32n
] as const;

/**
 * 默认权限名称类型（字面量）
 */
export type DefaultPermissionName = (typeof DEFAULT_PERMISSION_VALUES)[number];

/**
 * 扩展权限配置（可选）
 * 业务项目可以添加更多权限，如：'审批', '拒绝', '发布', '归档'
 */
export const EXTENSION_PERMISSION_VALUES = [
  '审批',    // 5: 1n << 5 = 64n
  '拒绝',    // 6: 1n << 6 = 128n
  '发布',    // 7: 1n << 7 = 256n
  '归档',    // 8: 1n << 8 = 512n
] as const;

/**
 * 扩展权限名称类型（字面量）
 */
export type ExtensionPermissionName = (typeof EXTENSION_PERMISSION_VALUES)[number];

/**
 * 基础权限名称类型（默认 + 扩展）
 */
export type BasePermissionName = DefaultPermissionName | ExtensionPermissionName;

/**
 * 业务扩展权限值存储
 * 通过 registerPermissionValues 函数注册
 */
let customPermissionValues: string[] = [];

/**
 * 注册业务扩展权限值
 * @param values - 业务自定义权限值数组
 * 
 * @example
 * ```typescript
 * // 在 backend/src/permissions.ts 中调用
 * registerPermissionValues(['上架', '发货', '退款']);
 * ```
 */
export function registerPermissionValues(values: string[]): void {
  customPermissionValues = values;
}

/**
 * 获取完整的权限值列表
 * @returns 所有权限值（默认 + 扩展 + 业务自定义）
 */
export function getPermissionValues(): readonly string[] {
  return [
    ...DEFAULT_PERMISSION_VALUES,
    ...EXTENSION_PERMISSION_VALUES,
    ...customPermissionValues,
  ];
}

/**
 * 当前生效的权限值列表
 */
export const PERMISSION_VALUES = getPermissionValues();

/**
 * 权限配置接口
 */
export interface PermissionConfig {
  values: readonly string[];
}

/**
 * 全局权限配置对象
 */
export const PERMISSION_CONFIG: PermissionConfig = {
  values: PERMISSION_VALUES,
};

/**
 * 根据权限名称数组构建位运算权限值
 * @param names - 权限名称数组，如 ['添加', '编辑']
 * @returns bigint 位运算值
 *
 * @example
 * ```typescript
 * buildPerValue(['添加']) // 1n
 * buildPerValue(['添加', '编辑']) // 3n
 * buildPerValue(['添加', '删除']) // 5n
 * ```
 */
export function buildPerValue(names: string[]): bigint {
  const values = getPermissionValues();
  let result = 0n;
  for (const name of names) {
    const index = values.indexOf(name);
    if (index === -1) {
      throw new Error(`未知的权限名称：${name}，可用值：${values.join(', ')}`);
    }
    result |= (1n << BigInt(index));
  }
  return result;
}

/**
 * 根据权限名称获取单个权限位值
 * @param name - 权限名称
 * @returns bigint 单个权限位值
 *
 * @example
 * ```typescript
 * getPermValue('添加') // 1n
 * getPermValue('编辑') // 2n
 * ```
 */
export function getPermValue(name: string): bigint {
  const values = getPermissionValues();
  const index = values.indexOf(name);
  if (index === -1) {
    throw new Error(`未知的权限名称：${name}`);
  }
  return 1n << BigInt(index);
}

/**
 * 根据位运算值解析为权限名称数组
 * @param value - 位运算值
 * @returns 权限名称数组
 *
 * @example
 * ```typescript
 * parsePerValue(3n) // ['添加', '编辑']
 * parsePerValue(5n) // ['添加', '删除']
 * ```
 */
export function parsePerValue(value: bigint): string[] {
  const values = getPermissionValues();
  const result: string[] = [];
  for (let i = 0; i < values.length; i++) {
    if ((value & (1n << BigInt(i))) !== 0n) {
      result.push(values[i]);
    }
  }
  return result;
}

/**
 * 检查是否包含指定权限
 * @param value - 位运算值
 * @param name - 权限名称
 * @returns boolean 是否包含
 *
 * @example
 * ```typescript
 * hasPermission(3n, '添加') // true
 * hasPermission(3n, '删除') // false
 * ```
 */
export function hasPermission(value: bigint, name: string): boolean {
  const values = getPermissionValues();
  const index = values.indexOf(name);
  if (index === -1) {
    return false;
  }
  return (value & (1n << BigInt(index))) !== 0n;
}

/**
 * 获取所有权限选项（用于 UI 展示）
 * @returns 权限选项数组 {name, label, value}
 */
export function getPermissionOptions(): Array<{
  name: string;
  label: string;
  value: bigint;
}> {
  const values = getPermissionValues();
  return values.map((name, index) => ({
    name,
    label: name,
    value: 1n << BigInt(index),
  }));
}