/**
 * @fileoverview 借贷记账扩展包路由路径常量
 */

export const LEDGER_PATHS = {
  /** 管理后台根路径 */
  ROOT: '/ext/ledger',
  /** 账本 API */
  ACCOUNTS: '/api/ext/ledger/accounts',
  /** 交易单 API */
  TRANSFERS: '/api/ext/ledger/transfers',
  /** 分录流水 API */
  ENTRIES: '/api/ext/ledger/entries',
  /** 对账 API */
  RECONCILE: '/api/ext/ledger/reconcile',
} as const
