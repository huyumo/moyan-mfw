/**
 * @fileoverview 权限常量定义
 * @description 定义全局权限位运算常量和工具函数（支持可扩展配置）
 */

/**
 * 默认权限配置（基础框架提供）
 * 业务项目可以通过环境变量 PERMISSION_VALUES 覆盖
 */
export const DEFAULT_PERMISSION_VALUES = [
  '查看',    // 0: 1n << 0 = 1n
  '添加',    // 1: 1n << 1 = 2n
  '编辑',    // 2: 1n << 2 = 4n
  '删除',    // 3: 1n << 3 = 8n
  '导出',    // 4: 1n << 4 = 16n
  '导入',    // 5: 1n << 5 = 32n
] as const;

/**
 * 扩展权限配置（可选）
 * 业务项目可以添加更多权限，如：'审批', '拒绝', '发布', '归档'
 */
export const EXTENSION_PERMISSION_VALUES = [
  '审批',    // 6: 1n << 6 = 64n
  '拒绝',    // 7: 1n << 7 = 128n
  '发布',    // 8: 1n << 8 = 256n
  '归档',    // 9: 1n << 9 = 512n
] as const;

/**
 * 合并后的权限配置（默认 = 默认 + 扩展）
 * 业务项目可以通过环境变量覆盖
 */
export const PERMISSION_VALUES = process.env.PERMISSION_VALUES
  ? (process.env.PERMISSION_VALUES.split(',') as readonly string[])
  : [...DEFAULT_PERMISSION_VALUES, ...EXTENSION_PERMISSION_VALUES] as const;

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
 * 权限名称类型（从 PERMISSION_VALUES 数组推断）
 */
export type PermissionName = (typeof PERMISSION_VALUES)[number];

/**
 * 根据权限名称数组构建位运算权限值
 * @param names - 权限名称数组，如 ['查看', '添加', '编辑']
 * @returns bigint 位运算值
 *
 * @example
 * ```typescript
 * buildPerValue(['查看']) // 1n
 * buildPerValue(['查看', '添加', '编辑']) // 7n
 * buildPerValue(['添加', '删除']) // 10n
 * ```
 */
export function buildPerValue(names: PermissionName[]): bigint {
  let result = 0n;
  for (const name of names) {
    const index = PERMISSION_VALUES.indexOf(name);
    if (index === -1) {
      throw new Error(`未知的权限名称：${name}，可用值：${PERMISSION_VALUES.join(', ')}`);
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
 * getPermValue('查看') // 1n
 * getPermValue('添加') // 2n
 * ```
 */
export function getPermValue(name: PermissionName): bigint {
  const index = PERMISSION_VALUES.indexOf(name);
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
 * parsePerValue(7n) // ['查看', '添加', '编辑']
 * parsePerValue(10n) // ['添加', '删除']
 * ```
 */
export function parsePerValue(value: bigint): PermissionName[] {
  const result: PermissionName[] = [];
  for (let i = 0; i < PERMISSION_VALUES.length; i++) {
    if ((value & (1n << BigInt(i))) !== 0n) {
      result.push(PERMISSION_VALUES[i] as PermissionName);
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
 * hasPermission(7n, '查看') // true
 * hasPermission(7n, '删除') // false
 * ```
 */
export function hasPermission(value: bigint, name: PermissionName): boolean {
  const index = PERMISSION_VALUES.indexOf(name);
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
  value: number;
}> {
  return PERMISSION_VALUES.map((name) => ({
    name,
    label: name,
    value: Number(1n << BigInt(PERMISSION_VALUES.indexOf(name))),
  }));
}
