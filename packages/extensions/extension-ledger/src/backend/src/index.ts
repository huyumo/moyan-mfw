/**
 * @fileoverview 借贷记账扩展包后端入口
 * @description 导出 LedgerModule、服务、实体、SPI 接口与默认实现、权限值
 */

export { LedgerModule, LedgerModule as default } from './ledger.module'
export {
  LedgerAccountService,
  LedgerTransferService,
  LedgerWithdrawService,
  PostingConsumerService,
  ScavengerService,
  LedgerReconcileService,
  InsufficientBalanceError,
  type CreateBizTransferInput,
  type WithdrawReserveInput,
  type WithdrawQueryInput,
  type WithdrawSumInput,
} from './services'
export {
  generateTransferNo,
  generateEntryNo,
  generateClaimToken,
  generateExecutorId,
  parseAmount,
  amountToString,
  buildCompositeBizRef,
  MAX_AMOUNT,
} from './services'
export {
  LedgerAccountBase,
  DefaultLedgerAccount,
  LedgerTransfer,
  LedgerEntry,
  LedgerReconcileReport,
} from './entities'

// SPI 接口与默认实现（供自定义适配器参考）
export type {
  ILedgerStorage,
  ILedgerLock,
  ILedgerQueue,
  ILedgerNotifier,
  ILedgerFieldExtension,
  LedgerModuleOptions,
  BizTypeMetaConfig,
  ClaimResult,
  PostResult,
  ScavengeItem,
  OpenAccountInput,
  LedgerEventListener,
  QueueMessageHandler,
  TransferPostedEvent,
  TransferFailedEvent,
  ReconcileDiffEvent,
} from './spi/interfaces'
export {
  LEDGER_STORAGE,
  LEDGER_LOCK,
  LEDGER_QUEUE,
  LEDGER_NOTIFIER,
  LEDGER_FIELD_EXTENSION,
  LEDGER_OPTIONS,
} from './spi/interfaces'
export {
  TypeOrmLedgerStorage,
  DbLock,
  InProcessQueue,
  EventNotifier,
  DefaultFieldExtension,
  RedisLock,
  RedisStreamQueue,
  RedisNotifier,
} from './spi/impl'

// 业务入参类型（从 shared 层再导出，供业务层直接引用）
export type {
  AmountString,
  TransferTargetItem,
  CreateTransferInput,
  AuditTransferInput,
  ReverseTransferInput,
  HolderRef,
  TransferView,
  AccountView,
  EntryView,
  AuditFlowStatus,
  WithdrawView,
} from 'moyan-mfw-extension-ledger/shared'

// 共享工具（从 shared 层再导出）
export { amountToYuan } from 'moyan-mfw-extension-ledger/shared'

// 权限值（从 shared 层再导出）
export { LEDGER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ledger/shared'
