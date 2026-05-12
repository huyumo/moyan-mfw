/**
 * @fileoverview 权限常量定义
 * @description 定义全局权限位运算常量和工具函数（支持代码扩展）
 */

/**
 * 默认权限配置（基础框架提供�?
 * 这些权限值在 base-backend �?base-frontend 中已使用，不可覆�?
 */
export const DEFAULT_PERMISSION_VALUES = [
  '添加',    // 0: 1n << 0 = 1n
  '编辑',    // 1: 1n << 1 = 2n
  '删除',    // 2: 1n << 2 = 4n
  '导出',    // 3: 1n << 3 = 8n
  '导入',    // 4: 1n << 4 = 16n
] as const;

/**
 * 默认权限名称类型（字面量�?
 */
export type DefaultPermissionName = (typeof DEFAULT_PERMISSION_VALUES)[number];

/**
 * 扩展权限配置（可选）
 * 业务项目可以添加更多权限，如�?审批', '拒绝', '发布', '归档'
 */
export const EXTENSION_PERMISSION_VALUES = [
  '审批',    // 5: 1n << 5 = 32n
  '拒绝',    // 6: 1n << 6 = 64n
  '发布',    // 7: 1n << 7 = 128n
  '归档',    // 8: 1n << 8 = 256n
] as const;

/**
 * 扩展权限名称类型（字面量�?
 */
export type ExtensionPermissionName = (typeof EXTENSION_PERMISSION_VALUES)[number];

/**
 * 基础权限名称类型（默�?+ 扩展�?
 */
export type BasePermissionName = DefaultPermissionName | ExtensionPermissionName;

/**
 * 业务扩展权限值存�?
 * 通过 registerPermissionValues 函数注册
 */
let customPermissionValues: string[] = [];

/**
 * 注册业务扩展权限�?
 * @param values - 业务自定义权限值数�?
 * 
 * @example
 * ```typescript
 * // �?backend/src/permissions.ts 中调�?
 * registerPermissionValues(['上架', '发货', '退�?]);
 * ```
 */
export function registerPermissionValues(values: string[]): void {
  customPermissionValues = values;
}

/**
 * 获取完整的权限值列�?
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
 * 当前生效的权限值列�?
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
 * 根据权限名称数组构建位运算权限�?
 * @param names - 权限名称数组，如 ['添加', '编辑']
 * @returns bigint 位运算�?
 *
 * @example
 * ```typescript
 * buildPerValue(['添加']) // 1n
 * buildPerValue(['添加', '编辑']) // 3n
 * buildPerValue(['添加', '删除']) // 5n
 * ```
 */
export function buildPerValue(names: string[]): bigint {
  let result = 0n;
  for (const name of names) {
    const value = permissionValueCache.get(name);
    if (value === undefined) {
      throw new Error(`未知的权限名称：${name}`);
    }
    result |= typeof value === 'bigint' ? value : BigInt(value);
  }
  return result;
}

/**
 * 根据权限名称获取单个权限位�?
 * @param name - 权限名称
 * @returns bigint 单个权限位�?
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
 * @param value - 位运算�?
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
 * 检查是否包含指定权�?
 * @param value - 位运算�?
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
 * 获取所有权限选项（用�?UI 展示�?
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

/**
 * 运行时权限值缓存（name → bitValue）
 * 由 PermissionValueSyncService 在 onDatabaseReady 后填充
 */
let permissionValueCache: Map<string, bigint> = new Map();

export function initPermissionValueCache(values: Array<{ name: string; bitValue: bigint | number | string }>): void {
  permissionValueCache = new Map(values.map((v) => [v.name, typeof v.bitValue === 'bigint' ? v.bitValue : BigInt(v.bitValue)]));
}

export function getPermissionValueCache(): Map<string, bigint> {
  return permissionValueCache;
}