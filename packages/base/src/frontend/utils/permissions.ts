/**
 * @fileoverview 权限常量定义
 * @description 定义全局权限位运算常量和工具函数（支持可扩展配置）
 */

/**
 * 默认权限配置（基础框架提供）
 * 业务项目可以选择继承、扩展或完全覆盖
 */
export const DEFAULT_PERMISSION_VALUES = [
  '添加',
  '编辑',
  '删除',
  '导出',
  '导入',
] as const

/**
 * 扩展权限配置（可选）
 * 业务项目可以添加更多权限，如：'审批', '拒绝', '发布', '归档'
 */
export const EXTENSION_PERMISSION_VALUES = [
  '审批',
  '拒绝',
  '发布',
  '归档',
] as const

/**
 * 默认权限名称类型（基础框架提供）
 */
export type DefaultPermissionName = typeof DEFAULT_PERMISSION_VALUES[number]

/**
 * 扩展权限名称类型（可选）
 */
export type ExtensionPermissionName = typeof EXTENSION_PERMISSION_VALUES[number]

/**
 * 基础框架权限名称类型（默认 + 扩展）
 */
export type PermissionName = DefaultPermissionName | ExtensionPermissionName

/**
 * 合并后的权限配置（默认 = 默认 + 扩展）
 * 业务项目可以通过全局配置覆盖或注册扩展
 */
export let PERMISSION_VALUES: string[] = [...DEFAULT_PERMISSION_VALUES, ...EXTENSION_PERMISSION_VALUES]

/**
 * 权限配置接口
 */
export interface PermissionConfig {
  values: readonly string[]
  labels?: Record<string, string>
  icons?: Record<string, any>
}

/**
 * 创建权限配置（支持覆盖）
 */
export function createPermissionConfig(
  customValues?: readonly PermissionName[],
  options?: Omit<PermissionConfig, 'values'>
): PermissionConfig {
  return {
    values: customValues || [...DEFAULT_PERMISSION_VALUES, ...EXTENSION_PERMISSION_VALUES],
    labels: options?.labels || {},
    icons: options?.icons || {},
  }
}

/**
 * 设置全局权限配置（业务项目使用）
 * @param config - 权限配置对象
 */
export function setPermissionConfig(config: PermissionConfig) {
  PERMISSION_VALUES = [...config.values]
    ; (window as any).__PERMISSION_CONFIG__ = config
}

/**
 * 注册额外的权限值（业务项目使用）
 * @param values - 额外的权限名称数组
 * @description 将业务层权限追加到全局权限列表中
 */
export function registerPermissionValues(values: readonly string[]) {
  const newValues = values.filter(v => !PERMISSION_VALUES.includes(v))
  PERMISSION_VALUES = [...PERMISSION_VALUES, ...newValues]
  const existingConfig = getPermissionConfig()
  setPermissionConfig({
    values: PERMISSION_VALUES,
    labels: existingConfig.labels,
    icons: existingConfig.icons,
  })
}

/**
 * 创建业务层页面配置函数（工厂函数）
 * @param businessPermissions - 业务层权限值数组
 * @returns defineBusinessPageConfig 函数，带有类型推断
 * @description 注册业务权限并返回配置函数，业务层只需调用一次
 *
 * @example
 * ```typescript
 * // 业务层 permissions.ts
 * import { createBusinessPageConfigFn } from 'moyan-mfw-base/frontend';
 *
 * export const BUSINESS_PERMISSION_VALUES = ['发货', '充值', '接待', '指派'] as const;
 * export const defineBusinessPageConfig = createBusinessPageConfigFn(BUSINESS_PERMISSION_VALUES);
 *
 * // 业务层页面 index.ts
 * import { defineBusinessPageConfig } from '../permissions';
 *
 * export default defineBusinessPageConfig({
 *   permissions: ['发货', '充值', '添加'], // 有完整类型推断
 * });
 * ```
 */
export function createBusinessPageConfigFn<T extends readonly string[]>(
  businessPermissions: T
): <C extends PageConfig<PermissionName | T[number]>>(config: C) => C & { permissionValue?: bigint } {
  registerPermissionValues(businessPermissions);
  
  return function defineBusinessPageConfig<C extends PageConfig<PermissionName | T[number]>>(config: C): C & { permissionValue?: bigint } {
    const permissionValue = config.permissions ? buildPerValue(config.permissions) : undefined;
    return { ...config, permissionValue };
  };
}

type PageConfig<T extends string = string> = {
  page: unknown;
  path: string;
  name: string;
  icon?: string;
  auth?: boolean;
  order?: number;
  hidden?: boolean;
  permissions?: T[];
  permissionValue?: bigint;
  children?: PageConfig<T>[];
};

/**
 * 获取全局权限配置
 */
export function getPermissionConfig(): PermissionConfig {
  return (window as any).__PERMISSION_CONFIG__ || createPermissionConfig()
}

/**
 * 根据权限名称数组构建位运算权限值
 * @param names - 权限名称数组，如 ['添加', '编辑', '发货']
 * @returns bigint 位运算值
 *
 * @example
 * ```typescript
 * buildPerValue(['添加']) // 1n
 * buildPerValue(['添加', '编辑']) // 3n
 * buildPerValue(['发货', '充值']) // 业务层权限值
 * ```
 */
export function buildPerValue(names: string[]): bigint {
  let result = 0n
  for (const name of names) {
    const index = PERMISSION_VALUES.indexOf(name)
    if (index === -1) {
      throw new Error(`未知的权限名称：${name}，可用值：${PERMISSION_VALUES.join(', ')}`)
    }
    result |= (1n << BigInt(index))
  }
  return result
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
  const index = PERMISSION_VALUES.indexOf(name)
  if (index === -1) {
    throw new Error(`未知的权限名称：${name}`)
  }
  return 1n << BigInt(index)
}

/**
 * 根据位运算值解析为权限名称数组
 * @param value - 位运算值（字符串格式，API 返回）
 * @returns 权限名称数组
 *
 * @example
 * ```typescript
 * parsePerValue('3') // ['添加', '编辑']
 * parsePerValue('10') // ['删除', '导出']
 * ```
 */
export function parsePerValue(value: string): string[] {
  const bigValue = BigInt(value)
  const result: string[] = []
  for (let i = 0; i < PERMISSION_VALUES.length; i++) {
    if ((bigValue & (1n << BigInt(i))) !== 0n) {
      result.push(PERMISSION_VALUES[i])
    }
  }
  return result
}

/**
 * 检查是否包含指定权限
 * @param value - 位运算值（字符串格式，API 返回）
 * @param name - 权限名称
 * @returns boolean 是否包含
 *
 * @example
 * ```typescript
 * hasPermission('3', '添加') // true
 * hasPermission('3', '删除') // false
 * ```
 */
export function hasPermission(value: string, name: string): boolean {
  const index = PERMISSION_VALUES.indexOf(name)
  if (index === -1) {
    return false
  }
  const bigValue = BigInt(value)
  return (bigValue & (1n << BigInt(index))) !== 0n
}

/**
 * 获取所有权限选项（用于 UI 展示）
 * @param parentPermissionValue - 父权限值（可选）
 * @returns 权限选项数组 {name, label, value, icon?}
 */
export function getPermissionOptions(parentPermissionValue?: string | number): Array<{
  name: string
  label: string
  value: number
  icon?: any
}> {
  let NOW_PERMISSION_VALUES = [...PERMISSION_VALUES]
  if (parentPermissionValue) {
    const parentValue = BigInt(parentPermissionValue)
    NOW_PERMISSION_VALUES = PERMISSION_VALUES.filter((name) => {
      const index = PERMISSION_VALUES.indexOf(name)
      const childValue = 1n << BigInt(index)
      return (parentValue & childValue) !== 0n
    })
  }
  const config = getPermissionConfig()
  return NOW_PERMISSION_VALUES.map((name) => ({
    name,
    label: config.labels?.[name] || name,
    value: Number(1n << BigInt(NOW_PERMISSION_VALUES.indexOf(name))),
    icon: config.icons?.[name],
  }))
}
