/**
 * @fileoverview 借贷记账扩展包前端入口
 * @description 导出页面组件与业务类型扩展字段元数据注册 API：
 *   - MfwLedgerPage：账本管理页面（4 Tab），菜单/路由由业务层在 menu-trees.ts 中注册
 *   - registerBizTypeExtMeta：业务层注册交易单扩展字段元数据（动态列/搜索项/详情显示名）
 *     @example
 *     import { registerBizTypeExtMeta } from 'moyan-mfw-extension-ledger/frontend'
 *     registerBizTypeExtMeta({
 *       recharge: {
 *         label: '充值',
 *         search: [{ key: 'channel', label: '渠道' }],
 *         columns: [{ prop: 'channel', label: '渠道', width: 100 }],
 *       },
 *     })
 */

export { default as MfwLedgerPage } from './views/ledger/Index.vue'
export {
  bizTypeExtMeta,
  registerBizTypeExtMeta,
  registerSearchOptionLoader,
} from './views/ledger/shared'
export type { BizTypeExtFieldMeta, SelectOptionItem, SearchOptionLoader } from './views/ledger/shared'
