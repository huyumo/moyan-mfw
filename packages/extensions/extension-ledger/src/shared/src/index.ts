/**
 * @fileoverview 借贷记账扩展包共享层入口
 * @description 前后端通信接口类型与常量
 */

export {
  DirectionDict,
  AuditStatusDict,
  PostStatusDict,
  HoldTypeDict,
  TransferModeDict,
  ReversalStatusDict,
} from './enums/ledger'
export { LEDGER_EXTENSION_PERMISSION_VALUES } from './permission-values'
export type { LedgerExtensionPermissionName } from './permission-values'
export { LEDGER_PATHS } from './paths'
export { amountToYuan } from './utils'
export type {
  AmountString,
  TransferTargetItem,
  LedgerAccountBrief,
  CreateTransferInput,
  AuditTransferInput,
  ReverseTransferInput,
  HolderRef,
  TransferView,
  ReversalView,
  AccountView,
  EntryView,
  AuditFlowStatus,
  WithdrawView,
} from './types'
