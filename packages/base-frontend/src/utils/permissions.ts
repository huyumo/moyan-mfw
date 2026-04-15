/**
 * @fileoverview 权限常量定义
 * @description 定义全局权限位运算常量和工具函数（支持可扩展配置）
 */

/**
 * 默认权限配置（基础框架提供）
 * 业务项目可以选择继承、扩展或完全覆盖
 */
export const DEFAULT_PERMISSION_VALUES = [
  '添加',    // 0: 1n << 0 = 1n
  '编辑',    // 1: 1n << 1 = 2n
  '删除',    // 2: 1n << 2 = 4n
  '导出',    // 3: 1n << 3 = 8n
  '导入',    // 4: 1n << 4 = 16n
] as const

/**
 * 扩展权限配置（可选）
 * 业务项目可以添加更多权限，如：'审批', '拒绝', '发布', '归档'
 */
export const EXTENSION_PERMISSION_VALUES = [
  '审批',    // 5: 1n << 5 = 32n
  '拒绝',    // 6: 1n << 6 = 64n
  '发布',    // 7: 1n << 7 = 128n
  '归档',    // 8: 1n << 8 = 256n
] as const

/**
 * 合并后的权限配置（默认 = 默认 + 扩展）
 * 业务项目可以通过全局配置覆盖
 */
export let PERMISSION_VALUES: string[] = [...DEFAULT_PERMISSION_VALUES, ...EXTENSION_PERMISSION_VALUES]

/**
 * 权限配置接口
 */
export interface PermissionConfig {
  values: readonly string[]
  labels?: Record<string, string>  // 可选：自定义显示名称
  icons?: Record<string, any>      // 可选：自定义图标
}

/**
 * 权限名称类型（字符串，支持动态扩展）
 */
export type PermissionName = string

/**
 * 创建权限配置（支持覆盖）
 */
export function createPermissionConfig(
  customValues?: readonly string[],
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
    // 存储 labels 和 icons 供组件使用
    ; (window as any).__PERMISSION_CONFIG__ = config
}

/**
 * 获取全局权限配置
 */
export function getPermissionConfig(): PermissionConfig {
  return (window as any).__PERMISSION_CONFIG__ || createPermissionConfig()
}

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
 * getPermValue('查看') // 1n
 * getPermValue('添加') // 2n
 * ```
 */
export function getPermValue(name: PermissionName): bigint {
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
 * parsePerValue('7') // ['查看', '添加', '编辑']
 * parsePerValue('10') // ['添加', '删除']
 * ```
 */
export function parsePerValue(value: string): PermissionName[] {
  const bigValue = BigInt(value)
  const result: PermissionName[] = []
  for (let i = 0; i < PERMISSION_VALUES.length; i++) {
    if ((bigValue & (1n << BigInt(i))) !== 0n) {
      result.push(PERMISSION_VALUES[i] as PermissionName)
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
 * hasPermission('7', '查看') // true
 * hasPermission('7', '删除') // false
 * ```
 */
export function hasPermission(value: string, name: PermissionName): boolean {
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
