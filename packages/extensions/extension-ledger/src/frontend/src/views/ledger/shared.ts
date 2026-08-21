/**
 * @fileoverview 借贷记账共享常量与字典映射
 * @description 字典 key 一律用 shared 包 Dict 常量（禁止魔法数字/字符串），label/tagType 成对导出
 *   复制能力统一由 moyan-mfw-base/frontend 提供（copyToClipboard / renderCopyableText）
 */
import { reactive } from 'vue'
import {
  DirectionDict,
  AuditStatusDict,
  PostStatusDict,
  HoldTypeDict,
  TransferModeDict,
  ReversalStatusDict,
} from 'moyan-mfw-extension-ledger/shared'

/** 借贷方向：标签 */
export const directionLabel: Record<number, string> = {
  [DirectionDict.DEBIT]: '借',
  [DirectionDict.CREDIT]: '贷',
}

/** 借贷方向：标签类型 */
export const directionTagType: Record<number, string> = {
  [DirectionDict.DEBIT]: 'success',
  [DirectionDict.CREDIT]: 'warning',
}

/** 审核状态：标签 */
export const auditStatusLabel: Record<number, string> = {
  [AuditStatusDict.PENDING_REVIEW]: '待审核',
  [AuditStatusDict.APPROVED]: '审核通过',
  [AuditStatusDict.REJECTED]: '已驳回',
}

/** 审核状态：标签类型 */
export const auditStatusTagType: Record<number, string> = {
  [AuditStatusDict.PENDING_REVIEW]: 'warning',
  [AuditStatusDict.APPROVED]: 'success',
  [AuditStatusDict.REJECTED]: 'danger',
}

/** 入账状态：标签 */
export const postStatusLabel: Record<number, string> = {
  [PostStatusDict.NOT_READY]: '待审核',
  [PostStatusDict.PENDING]: '待入账',
  [PostStatusDict.POSTING]: '入账中',
  [PostStatusDict.POSTED]: '已入账',
  [PostStatusDict.FAILED]: '入账失败',
  [PostStatusDict.CANCELLED]: '已取消',
  [PostStatusDict.REJECTED]: '已驳回',
}

/** 入账状态：标签类型 */
export const postStatusTagType: Record<number, string> = {
  [PostStatusDict.NOT_READY]: 'info',
  [PostStatusDict.PENDING]: 'warning',
  [PostStatusDict.POSTING]: 'primary',
  [PostStatusDict.POSTED]: 'success',
  [PostStatusDict.FAILED]: 'danger',
  [PostStatusDict.CANCELLED]: 'info',
  [PostStatusDict.REJECTED]: 'danger',
}

/** 占用类型：标签 */
export const holdTypeLabel: Record<number, string> = {
  [HoldTypeDict.PENDING_OUT]: '预占在途',
  [HoldTypeDict.FROZEN]: '审核冻结',
}

/** 转账模式：标签 */
export const transferModeLabel: Record<number, string> = {
  [TransferModeDict.ONE_TO_ONE]: '一对一',
  [TransferModeDict.ONE_TO_MANY]: '一对多',
}

/** 冲正状态：标签 */
export const reversalStatusLabel: Record<number, string> = {
  [ReversalStatusDict.POSTED]: '已冲正',
}

/** 冲正状态：标签类型 */
export const reversalStatusTagType: Record<number, string> = {
  [ReversalStatusDict.POSTED]: 'success',
}

/**
 * 金额格式化（bigint 最小单位字符串 -> 显示字符串）
 * @example formatAmount('12345') -> '123.45'（CNY 2 位小数）
 */
export function formatAmount(raw: string | null | undefined, currency = 'CNY'): string {
  if (!raw) return '0'
  const val = BigInt(raw)
  const sign = val < 0n ? '-' : ''
  const abs = val < 0n ? -val : val
  const str = abs.toString()
  // CNY 2 位小数，其余整数
  const decimals = currency === 'CNY' ? 2 : 0
  if (decimals === 0) return `${sign}${str}`
  const intPart = str.length > decimals ? str.slice(0, -decimals) : '0'
  const decPart = str.length > decimals ? str.slice(-decimals) : str.padStart(decimals, '0')
  return `${sign}${intPart}.${decPart}`
}

// ── 复制工具（统一由 moyan-mfw-base/frontend 提供） ──
export { copyToClipboard, renderCopyableText } from 'moyan-mfw-base/frontend'

// ── 业务类型扩展字段元数据注册表（业务层注册，不硬编码在扩展包） ──

/** 下拉选项项（select 平铺 / cascader 树形，children 递归） */
export interface SelectOptionItem {
  value: string | number
  label: string
  children?: SelectOptionItem[]
}

/** 扩展搜索项配置 */
export interface BizTypeSearchField {
  /** 语义字段名（须与 bizExtMappings 键一致） */
  key: string
  /** 显示名 */
  label: string
  /** 组件类型：input（默认）/ select（下拉）/ cascader（级联，如省市区） */
  type?: 'input' | 'select' | 'cascader'
  /**
   * select/cascader 静态选项（配置下发，JSON 可序列化；cascader 为树形结构）
   * 与 optionsSource 二选一；动态选项用 optionsSource + 前端 registerSearchOptionLoader
   */
  options?: SelectOptionItem[]
  /**
   * select/cascader 动态选项来源 key（前端业务层 registerSearchOptionLoader 注册加载器）
   * 如 'promoters' / 'campaigns' / 'regions'；加载器返回选项数组（cascader 为树形）
   */
  optionsSource?: string
  /**
   * cascader 选中值提交模式（默认 last）：
   *   last: 取最后一级 value（如区县 code）
   *   join: 各级 value 用 '/' 连接（如 '330100/330106'）
   */
  valueMode?: 'last' | 'join'
  /**
   * 查询匹配方式（默认 exact）：exact=等值；prefix=前缀匹配（后端 LIKE 'value%'）
   * 级联选任意级（选省/市也筛出区县数据）时配 prefix，要求上级 value 是下级 value 前缀
   */
  matchMode?: 'exact' | 'prefix'
}

export interface BizTypeExtFieldMeta {
  /** 展示名 */
  label: string
  /** 扩展搜索项（key 为语义字段名，映射到预留索引位） */
  search: BizTypeSearchField[]
  /** 扩展列表列（从 row.extFields 取语义值；cp 可复制，width 可设置列宽） */
  columns: { prop: string; label: string; width?: number; cp?: boolean }[]
  /**
   * 详情扩展字段渲染配置（交易单详情抽屉「扩展字段」区）
   * 缺省时回退用 search 配置渲染；
   * span: 2 = 独占一行（1行1列），span: 1 / 缺省 = 半行（1行2列）
   */
  detail?: { key: string; label: string; span?: 1 | 2 }[]
}

/** 动态下拉选项加载器（业务层前端注册；async 返回选项数组，cascader 为树形） */
export type SearchOptionLoader = () => Promise<SelectOptionItem[]>

/** 动态选项来源加载器注册表（optionsSource → loader） */
const searchOptionLoaders: Record<string, SearchOptionLoader> = {}

/**
 * 业务层注册动态下拉选项加载器（配合元数据 search[].optionsSource 使用）
 * @example
 * registerSearchOptionLoader('campaigns', async () => {
 *   const res = await listCampaigns()
 *   return res.map((c) => ({ value: c.id, label: c.name }))
 * })
 */
export function registerSearchOptionLoader(source: string, loader: SearchOptionLoader): void {
  searchOptionLoaders[source] = loader
}

/** 获取已注册的动态选项加载器 */
export function getSearchOptionLoader(source: string): SearchOptionLoader | undefined {
  return searchOptionLoaders[source]
}

/** 内置通用业务类型（开箱可用；无扩展字段） */
const DEFAULT_BIZ_TYPE_META: Record<string, BizTypeExtFieldMeta> = {
  order_pay: { label: '订单支付', search: [], columns: [] },
  refund: { label: '退款', search: [], columns: [] },
  reverse: { label: '冲正', search: [], columns: [] },
  ledger_open_account: { label: '开户', search: [], columns: [] },
}

/**
 * 业务类型扩展字段元数据注册表（reactive）
 * 驱动：交易单列表动态列/搜索项、制单表单动态字段、交易单详情扩展字段显示名
 * 业务层在应用入口注册自己的类型（与后端 forRoot({ bizExtMappings }) 字段键保持一致）：
 *   registerBizTypeExtMeta({
 *     recharge: { label: '充值', search: [{ key: 'channel', label: '渠道' }], columns: [...] },
 *   })
 */
export const bizTypeExtMeta: Record<string, BizTypeExtFieldMeta> = reactive({ ...DEFAULT_BIZ_TYPE_META })

/** 业务层注册/覆盖业务类型扩展字段元数据（覆盖同名内置类型） */
export function registerBizTypeExtMeta(meta: Record<string, BizTypeExtFieldMeta>): void {
  Object.assign(bizTypeExtMeta, meta)
}
