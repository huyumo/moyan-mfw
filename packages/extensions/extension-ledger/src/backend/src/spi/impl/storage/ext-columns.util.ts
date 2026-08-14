/**
 * @fileoverview 业务扩展字段 <-> 预留索引位 映射翻译工具
 * @description bizExtMappings（bizType → 语义字段名 → extColN）的读写翻译：
 *   - 制单：extFields 语义键值 → 预留列值（未映射字段抛错，防静默丢数据）
 *   - 查询：extFields 语义键值 → WHERE 预留列等值条件（走索引）
 *   - 返回：预留列值 → extFields 语义对象（前端按语义名展示，不暴露 extColN 物理名）
 *
 * 预留位列名白名单（防配置注入）：只允许 extCol1~extCol4
 */

/** 预留索引位列名白名单 */
export const EXT_COLUMNS = ['extCol1', 'extCol2', 'extCol3', 'extCol4'] as const
export type ExtColumnName = (typeof EXT_COLUMNS)[number]

/** 业务扩展映射表：bizType → 语义字段名 → 预留列（运行时校验白名单） */
export type BizExtMappings = Record<string, Record<string, string>>

/**
 * 制单翻译：语义键值 → 预留列值
 * @throws 字段未在 bizExtMappings 声明 / 映射列不在白名单 / 无 bizExtMappings 配置时抛错
 */
export function mapExtFieldsToColumns(
  bizType: string,
  extFields: Record<string, string> | undefined,
  mappings: BizExtMappings | undefined,
): Record<string, string> {
  const result: Record<string, string> = {}
  if (!extFields || Object.keys(extFields).length === 0) return result

  const bizMapping = mappings?.[bizType]
  if (!bizMapping) {
    throw new Error(`业务扩展字段映射未配置：bizType=${bizType} 未在 forRoot({ bizExtMappings }) 声明`)
  }
  for (const [field, value] of Object.entries(extFields)) {
    if (value === undefined || value === null || value === '') continue
    const col = bizMapping[field]
    if (!col) {
      throw new Error(`业务扩展字段未映射：${bizType}.${field} 未在 bizExtMappings 声明（可用: ${Object.keys(bizMapping).join(', ')}）`)
    }
    if (!EXT_COLUMNS.includes(col as ExtColumnName)) {
      throw new Error(`预留索引位非法：${col}（白名单: ${EXT_COLUMNS.join(', ')}）`)
    }
    result[col] = value
  }
  return result
}

/**
 * 查询翻译：语义键值 → 预留列条件（{ col: { value, prefix } }，配合 bizType 使用）
 * matchModes：字段 → 匹配方式（'prefix' 生成 LIKE 'value%'，默认等值）；来源为 bizTypeMetas.search[].matchMode
 * @throws 缺 bizType / 字段未映射时抛错（防止全表扫描或语义错位）
 */
export type ExtQueryCondition = { value: string; prefix?: boolean }

/** LIKE 通配符转义（MySQL 默认反斜杠转义；须先转义反斜杠本身） */
function escapeLikeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export function mapExtFieldsToQuery(
  bizType: string | undefined,
  extFields: Record<string, string> | undefined,
  mappings: BizExtMappings | undefined,
  matchModes?: Record<string, 'exact' | 'prefix'>,
): Record<string, ExtQueryCondition> {
  const result: Record<string, ExtQueryCondition> = {}
  if (!extFields || Object.keys(extFields).length === 0) return result
  if (!bizType) {
    throw new Error('按业务扩展字段筛选必须同时指定 bizType（预留索引位为 bizType 维度语义）')
  }
  const bizMapping = mappings?.[bizType]
  if (!bizMapping) {
    throw new Error(`业务扩展字段映射未配置：bizType=${bizType} 未在 forRoot({ bizExtMappings }) 声明`)
  }
  for (const [field, value] of Object.entries(extFields)) {
    if (value === undefined || value === null || value === '') continue
    const col = bizMapping[field]
    if (!col) {
      throw new Error(`业务扩展字段未映射：${bizType}.${field} 未在 bizExtMappings 声明`)
    }
    if (!EXT_COLUMNS.includes(col as ExtColumnName)) {
      throw new Error(`预留索引位非法：${col}`)
    }
    const prefix = matchModes?.[field] === 'prefix'
    result[col] = prefix ? { value: escapeLikeValue(value), prefix: true } : { value }
  }
  return result
}

/**
 * 返回翻译：预留列值 → 语义对象（{ promoterId: 'P888' }）
 * 仅当 bizType 有映射时翻译；无映射返回空对象（前端不展示扩展列）
 */
export function mapColumnsToExtFields(
  row: Record<string, unknown>,
  bizType: string | undefined,
  mappings: BizExtMappings | undefined,
): Record<string, string> {
  const bizMapping = bizType ? mappings?.[bizType] : undefined
  if (!bizMapping) return {}
  const result: Record<string, string> = {}
  for (const [field, col] of Object.entries(bizMapping)) {
    const value = row[col]
    if (value !== undefined && value !== null && value !== '') {
      result[field] = String(value)
    }
  }
  return result
}
