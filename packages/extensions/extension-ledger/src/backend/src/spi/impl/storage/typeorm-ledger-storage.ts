/**
 * @fileoverview TypeOrmLedgerStorage - ILedgerStorage 默认实现
 * @description 聚合 account/transfer/query 三个域 storage；按域拆分防 1000 行超限
 */

import { Injectable, Inject } from '@nestjs/common'
import { DataSource, EntityManager } from 'typeorm'
import { LEDGER_OPTIONS, type LedgerModuleOptions, type ILedgerStorage } from '../../interfaces'
import { StorageContext } from './storage-context'
import { AccountStorage } from './account.storage'
import { TransferStorage } from './transfer.storage'
import { PostingStorage } from './posting.storage'
import { QueryStorage } from './query.storage'
import { ReversalStorage } from './reversal.storage'

/**
 * 默认存储适配器（聚合域 storage）
 * 注：方法委托给域 storage；保留 manager 透传支持外部事务嵌套
 */
@Injectable()
export class TypeOrmLedgerStorage implements ILedgerStorage {
  readonly ctx: StorageContext
  readonly account: AccountStorage
  readonly transfer: TransferStorage
  readonly posting: PostingStorage
  readonly query: QueryStorage
  readonly reversal: ReversalStorage

  constructor(dataSource: DataSource, @Inject(LEDGER_OPTIONS) options: LedgerModuleOptions) {
    this.ctx = new StorageContext(dataSource, options)
    this.account = new AccountStorage(this.ctx)
    this.transfer = new TransferStorage(this.ctx)
    this.posting = new PostingStorage(this.ctx)
    this.query = new QueryStorage(this.ctx)
    this.reversal = new ReversalStorage(this.ctx)
  }

  // ── 账户 ──
  openAccount(input: any, manager?: EntityManager) {
    return this.account.openAccount(input, manager)
  }
  getAccount(accountId: string, manager?: EntityManager) {
    return this.account.getAccount(accountId, manager)
  }
  findAccount(holderId: string, holderType: string, tag: string, currency: string, manager?: EntityManager) {
    return this.account.findAccount(holderId, holderType, tag, currency, manager)
  }
  ensureOpeningEntry(accountId: string, manager?: EntityManager) {
    return this.account.ensureOpeningEntry(accountId, manager)
  }

  // ── 制单/审核/冲正 ──
  createTransferWithReserve(input: any, maker?: any, manager?: EntityManager) {
    return this.transfer.createTransferWithReserve(input, maker, manager)
  }
  audit(input: any, auditor?: any, manager?: EntityManager) {
    return this.transfer.audit(input, auditor, manager)
  }
  createReversal(input: any, maker?: any, manager?: EntityManager) {
    return this.reversal.createReversal(input, maker, manager)
  }
  getReversal(reversalNo: string, manager?: EntityManager) {
    return this.reversal.getReversal(reversalNo, manager)
  }
  queryReversals(filter: any, manager?: EntityManager) {
    return this.reversal.queryReversals(filter, manager)
  }
  markEnqueued(transferNo: string, manager?: EntityManager) {
    return this.transfer.markEnqueued(transferNo, manager)
  }

  // ── 消费入账协议 ──
  claimForPosting(transferNo: string, claimToken: string, manager?: EntityManager) {
    return this.posting.claimForPosting(transferNo, claimToken, manager)
  }
  postTransfer(transferNo: string, claimToken: string, manager?: EntityManager) {
    return this.posting.postTransfer(transferNo, claimToken, manager)
  }
  revertToPending(transferNo: string, claimToken: string, retryCount: number, nextRetryAt: Date, error: string, manager?: EntityManager) {
    return this.posting.revertToPending(transferNo, claimToken, retryCount, nextRetryAt, error, manager)
  }
  markFailed(transferNo: string, claimToken: string, error: string, manager?: EntityManager) {
    return this.posting.markFailed(transferNo, claimToken, error, manager)
  }
  cancel(transferNo: string, operator?: any, manager?: EntityManager) {
    return this.posting.cancel(transferNo, operator, manager)
  }
  repost(transferNo: string, manager?: EntityManager) {
    return this.posting.repost(transferNo, manager)
  }
  batchRepost(transferNos: string[], manager?: EntityManager) {
    return this.posting.batchRepost(transferNos, manager)
  }

  // ── 兜底扫描 ──
  scavenge(now: Date, enqueueTimeoutMs: number, orphanTimeoutMs: number, repushThrottleMs: number, limit: number, manager?: EntityManager) {
    return this.posting.scavenge(now, enqueueTimeoutMs, orphanTimeoutMs, repushThrottleMs, limit, manager)
  }
  resetOrphans(transferNos: string[], manager?: EntityManager) {
    return this.posting.resetOrphans(transferNos, manager)
  }

  // ── 查询 ──
  getTransfer(transferNo: string, manager?: EntityManager) {
    return this.query.getTransfer(transferNo, manager)
  }
  findTransferByBizRef(bizRef: string, bizType: string, manager?: EntityManager) {
    return this.query.findTransferByBizRef(bizRef, bizType, manager)
  }
  queryEntries(filter: any, manager?: EntityManager) {
    return this.query.queryEntries(filter, manager)
  }
  queryTransfers(filter: any, manager?: EntityManager) {
    return this.query.queryTransfers(filter, manager)
  }
  queryAccounts(filter: any, manager?: EntityManager) {
    return this.query.queryAccounts(filter, manager)
  }
  queryReports(filter: any, manager?: EntityManager) {
    return this.query.queryReports(filter, manager)
  }
  sumTransfers(filter: any, manager?: EntityManager) {
    return this.query.sumTransfers(filter, manager)
  }

  // ── 对账 ──
  computeReconcileDiffs(accountIds?: string[], manager?: EntityManager) {
    return this.query.computeReconcileDiffs(accountIds, manager)
  }
  applyFix(accountId: string, operator?: any, manager?: EntityManager) {
    return this.query.applyFix(accountId, operator, manager)
  }

  // ── 归档 ──
  archiveEntries(before: Date, batchSize?: number, manager?: EntityManager) {
    return this.query.archiveEntries(before, batchSize, manager)
  }
  archiveTransfers(before: Date, batchSize?: number, manager?: EntityManager) {
    return this.query.archiveTransfers(before, batchSize, manager)
  }
}
