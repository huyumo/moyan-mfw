/**
 * @fileoverview 查询/对账/归档域存储
 * @description 流水分页（单分区裁剪）、对账恒等式校验、增量修复、双层归档
 */

import { Injectable } from '@nestjs/common'
import type { EntityManager, SelectQueryBuilder } from 'typeorm'
import { randomUUID } from 'node:crypto'
import { PostStatusDict, DirectionDict, type AmountString } from 'moyan-mfw-extension-ledger/shared'
import { StorageContext } from './storage-context'
import type { EntryQueryFilter, TransferQueryFilter, AccountQueryFilter, ReconcileDiffItem } from '../../interfaces'
import { mapExtFieldsToQuery } from './ext-columns.util'
import { toTransferView, toAccountView } from './view.mapper'

@Injectable()
export class QueryStorage {
  constructor(private readonly ctx: StorageContext) {}

  async getTransfer(transferNo: string, manager?: EntityManager) {
    const row = await this.ctx.transferRepo(manager).findOne({ where: { transferNo } })
    return toTransferView(row, this.ctx.options.bizExtMappings)
  }

  async findTransferByBizRef(bizRef: string, bizType: string, manager?: EntityManager) {
    const row = await this.ctx.transferRepo(manager).findOne({ where: { bizRef, bizType } })
    return toTransferView(row, this.ctx.options.bizExtMappings)
  }

  /** 流水分页（必带 account_id 单分区裁剪） */
  async queryEntries(filter: EntryQueryFilter, manager?: EntityManager): Promise<{ items: any[]; total: number }> {
    const em = manager ?? this.ctx.dataSource.manager
    const repo = this.ctx.entryRepo(em)
    const qb = repo.createQueryBuilder('e')
    if (filter.accountId) qb.andWhere('e.accountId = :accountId', { accountId: filter.accountId })
    if (filter.transferNo) qb.andWhere('e.transferNo = :transferNo', { transferNo: filter.transferNo })
    if (filter.direction) qb.andWhere('e.direction = :direction', { direction: filter.direction })
    if (filter.startDate) qb.andWhere('e.createdAt >= :startDate', { startDate: filter.startDate })
    if (filter.endDate) qb.andWhere('e.createdAt < :endDate', { endDate: filter.endDate })
    qb.orderBy('e.id', 'DESC')
    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    qb.skip((page - 1) * pageSize).take(pageSize)
    const [items, total] = await qb.getManyAndCount()
    return { items: items as any[], total }
  }

  async queryTransfers(filter: TransferQueryFilter, manager?: EntityManager): Promise<{ items: any[]; total: number }> {
    const em = manager ?? this.ctx.dataSource.manager
    const qb = this.ctx.transferRepo(em).createQueryBuilder('t')
    this.applyTransferFilter(qb, filter)
    qb.orderBy('t.createdAt', 'DESC')
    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    qb.skip((page - 1) * pageSize).take(pageSize)
    const [items, total] = await qb.getManyAndCount()
    return {
      items: items.map((item: any) => toTransferView(item, this.ctx.options.bizExtMappings)),
      total,
    }
  }

  /**
   * 交易单聚合（COUNT + SUM(amount)，与 queryTransfers 同源过滤条件）
   * 金额为最小单位字符串；供读侧汇总（提现成功金额/笔数等）
   */
  async sumTransfers(filter: TransferQueryFilter, manager?: EntityManager): Promise<{ totalCount: number; totalAmount: AmountString }> {
    const em = manager ?? this.ctx.dataSource.manager
    const qb = this.ctx.transferRepo(em).createQueryBuilder('t')
    this.applyTransferFilter(qb, filter)
    const row = await qb
      .select('COUNT(*)', 'totalCount')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'totalAmount')
      .getRawOne()
    return {
      totalCount: Number(row?.totalCount ?? 0),
      totalAmount: String(row?.totalAmount ?? 0),
    }
  }

  /** 交易单过滤条件公共构建（queryTransfers / sumTransfers 共用） */
  private applyTransferFilter(qb: SelectQueryBuilder<any>, filter: TransferQueryFilter): void {
    if (filter.postStatus !== undefined) {
      if (Array.isArray(filter.postStatus)) {
        qb.andWhere('t.postStatus IN (:...postStatus)', { postStatus: filter.postStatus })
      } else {
        qb.andWhere('t.postStatus = :postStatus', { postStatus: filter.postStatus })
      }
    }
    if (filter.postStatusExclude && filter.postStatusExclude.length > 0) {
      qb.andWhere('t.postStatus NOT IN (:...postStatusExclude)', { postStatusExclude: filter.postStatusExclude })
    }
    if (filter.auditStatus !== undefined) {
      if (Array.isArray(filter.auditStatus)) {
        qb.andWhere('t.auditStatus IN (:...auditStatus)', { auditStatus: filter.auditStatus })
      } else {
        qb.andWhere('t.auditStatus = :auditStatus', { auditStatus: filter.auditStatus })
      }
    }
    if (filter.bizType) qb.andWhere('t.bizType = :bizType', { bizType: filter.bizType })
    if (filter.fromAccountId) qb.andWhere('t.fromAccountId = :fromAccountId', { fromAccountId: filter.fromAccountId })
    // 按转出账户主体筛选（JOIN 账户表；排除软删账户）
    if (filter.fromAccountType || (filter.fromAccountHolderIds && filter.fromAccountHolderIds.length > 0)) {
      qb.innerJoin(this.ctx.accountEntityCtor, 'a', 'a.id = t.fromAccountId AND a.deleteAt IS NULL')
      if (filter.fromAccountType) qb.andWhere('a.holderType = :fromAccountType', { fromAccountType: filter.fromAccountType })
      if (filter.fromAccountHolderIds && filter.fromAccountHolderIds.length > 0) {
        qb.andWhere('a.holderId IN (:...fromAccountHolderIds)', { fromAccountHolderIds: filter.fromAccountHolderIds })
      }
    }
    if (filter.startDate) qb.andWhere('t.createdAt >= :startDate', { startDate: filter.startDate })
    if (filter.endDate) qb.andWhere('t.createdAt < :endDate', { endDate: filter.endDate })
    // 业务扩展字段筛选（bizExtMappings 翻译到预留索引列，须配 bizType）
    // matchModes 取 bizTypeMetas.search[].matchMode：'prefix' 生成 LIKE 'value%'（级联选任意级可命中）
    if (filter.extFields && Object.keys(filter.extFields).length > 0) {
      const matchModes: Record<string, 'exact' | 'prefix'> = {}
      for (const item of this.ctx.options.bizTypeMetas?.[filter.bizType ?? '']?.search ?? []) {
        if (item.matchMode === 'prefix') matchModes[item.key] = item.matchMode
      }
      const extCols = mapExtFieldsToQuery(filter.bizType, filter.extFields, this.ctx.options.bizExtMappings, matchModes)
      for (const [col, cond] of Object.entries(extCols)) {
        if (cond.prefix) {
          qb.andWhere(`t.${col} LIKE :${col}`, { [col]: `${cond.value}%` })
        } else {
          qb.andWhere(`t.${col} = :${col}`, { [col]: cond.value })
        }
      }
    }
  }

  async queryAccounts(filter: AccountQueryFilter, manager?: EntityManager): Promise<{ items: any[]; total: number }> {
    const em = manager ?? this.ctx.dataSource.manager
    const qb = this.ctx.accountRepo(em).createQueryBuilder('a')
    if (filter.id) qb.andWhere('a.id = :id', { id: filter.id })
    if (filter.holderId) qb.andWhere('a.holderId = :holderId', { holderId: filter.holderId })
    if (filter.tag) qb.andWhere('a.tag = :tag', { tag: filter.tag })
    if (filter.currency) qb.andWhere('a.currency = :currency', { currency: filter.currency })
    qb.orderBy('a.createdAt', 'DESC')
    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    qb.skip((page - 1) * pageSize).take(pageSize)
    const [items, total] = await qb.getManyAndCount()
    return { items: items.map((item: any) => toAccountView(item)), total }
  }

  /** 对账报告分页 */
  async queryReports(filter: { status?: number; page?: number; pageSize?: number }, manager?: EntityManager): Promise<{ items: any[]; total: number }> {
    const em = manager ?? this.ctx.dataSource.manager
    const qb = this.ctx.reportRepo(em).createQueryBuilder('r')
    if (filter.status !== undefined) qb.andWhere('r.status = :status', { status: filter.status })
    qb.orderBy('r.createdAt', 'DESC')
    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    qb.skip((page - 1) * pageSize).take(pageSize)
    const [items, total] = await qb.getManyAndCount()
    return { items, total }
  }

  /**
   * 计算对账差异：Σ(signed_amount) vs (balance+frozen+pendingOut)
   * 恒等式：balance+frozen+pendingOut ≡ Σ(signed_amount)（全状态机成立）
   */
  async computeReconcileDiffs(accountIds?: string[], manager?: EntityManager): Promise<{ totalAccounts: number; diffs: ReconcileDiffItem[] }> {
    const em = manager ?? this.ctx.dataSource.manager
    // 账户余额（排除软删）
    const accounts: any[] = accountIds
      ? await em.query(`SELECT id, balance, frozen, pendingOut FROM ext_ledger_account WHERE id IN (?) AND deleteAt IS NULL`, [accountIds])
      : await em.query(`SELECT id, balance, frozen, pendingOut FROM ext_ledger_account WHERE deleteAt IS NULL`)

    const diffs: ReconcileDiffItem[] = []
    for (const acct of accounts) {
      // Σ(signed_amount) 按账户聚合（命中单分区）
      const [sumRow] = await em.query(
        `SELECT COALESCE(SUM(signedAmount), 0) AS s FROM ext_ledger_entry WHERE accountId = ?`,
        [acct.id],
      )
      const entrySum = BigInt(sumRow.s)
      const lhs = BigInt(acct.balance) + BigInt(acct.frozen) + BigInt(acct.pendingOut)
      const diff = lhs - entrySum
      if (diff !== 0n) {
        diffs.push({
          accountId: acct.id,
          balance: acct.balance.toString(),
          frozen: acct.frozen.toString(),
          pendingOut: acct.pendingOut.toString(),
          entrySum: entrySum.toString(),
          diff: diff.toString(),
        })
      }
    }
    return { totalAccounts: accounts.length, diffs }
  }

  /**
   * 增量修复（先锁账户行 -> 重读 Σ -> INSERT 调整分录 原子执行 -> 复验）
   * 补账策略：账面余额（balance+frozen+pendingOut）是账实金额，流水缺漏时补记调整分录对齐，
   * **不篡改账面余额**（评审 A1🔴5：不写分录会持续篡改资金；同时动两边则修复无效——diff 不变）
   */
  async applyFix(accountId: string, operator?: { id?: string; text?: string }, manager?: EntityManager): Promise<{ fixed: boolean; diff: string }> {
    return this.ctx.tx(async (m) => {
      const em = manager ?? m
      // 锁账户行
      const [acct] = await em.query(
        `SELECT id, balance, frozen, pendingOut FROM ext_ledger_account WHERE id = ? AND deleteAt IS NULL FOR UPDATE`,
        [accountId],
      )
      if (!acct) return { fixed: false, diff: '0' }

      // 重读 Σ（快照一致性）
      const [sumRow] = await em.query(`SELECT COALESCE(SUM(signedAmount), 0) AS s FROM ext_ledger_entry WHERE accountId = ?`, [accountId])
      const entrySum = BigInt(sumRow.s)
      const lhs = BigInt(acct.balance) + BigInt(acct.frozen) + BigInt(acct.pendingOut)
      const diff = lhs - entrySum

      if (diff === 0n) return { fixed: true, diff: '0' }

      // 大额 diff 只告警转人工（阈值 1e12）
      if (diff > 1_000_000_000_000n || diff < -1_000_000_000_000n) {
        return { fixed: false, diff: diff.toString() }
      }

      // 补记调整分录（signed=diff，账面余额不动）：
      // 修复前 diff = 账面 - Σ；补分录后 Σ' = Σ + diff = 账面 → 恒等式成立
      // diff>0（账面大于流水，如漏记开户/入账）补借方；diff<0（流水大于账面）补贷方
      const transferNo = `FIX-${randomUUID().slice(0, 8).toUpperCase()}`
      await em.query(
        `INSERT INTO ext_ledger_entry (accountId, entryNo, transferNo, direction, signedAmount, balanceBefore, balanceAfter, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          `${transferNo}-D1`,
          transferNo,
          diff > 0n ? DirectionDict.DEBIT : DirectionDict.CREDIT,
          diff.toString(),
          acct.balance,
          acct.balance,
          JSON.stringify({ type: 'reconcile_fix', operator: operator?.id ?? null, diff: diff.toString() }),
        ],
      )

      // 复验（同事务）
      const [recheck] = await em.query(`SELECT COALESCE(SUM(signedAmount), 0) AS s FROM ext_ledger_entry WHERE accountId = ?`, [accountId])
      const reSum = BigInt(recheck.s)
      return { fixed: reSum === lhs, diff: (lhs - reSum).toString() }
    })
  }

  /**
   * 归档分录（copy-then-delete + 水印分批）
   * - 双哨兵：created < cutoff AND createdAt < cutoff（流水不可变，无 updated 列，用 created 单哨兵）
   * - INSERT IGNORE 幂等搬移到 archive 表
   * - 游标水印分批 DELETE
   * - 归档前校验窗内无在途单
   */
  async archiveEntries(before: Date, batchSize = 1000, manager?: EntityManager): Promise<{ archived: number; hasMore: boolean }> {
    const em = manager ?? this.ctx.dataSource.manager
    // 校验窗内无在途单
    const [inFlight] = await em.query(
      `SELECT COUNT(*) AS c FROM ext_ledger_transfer WHERE createdAt < ? AND postStatus IN (?, ?, ?)`,
      [before, PostStatusDict.NOT_READY, PostStatusDict.PENDING, PostStatusDict.POSTING],
    )
    if (Number(inFlight.c) > 0) {
      return { archived: 0, hasMore: false }
    }

    // copy：INSERT IGNORE 幂等
    const copyResult = await em.query(
      `INSERT IGNORE INTO ext_ledger_entry_archive
       SELECT id, accountId, entryNo, transferNo, direction, signedAmount, balanceBefore, balanceAfter, extra, createdAt
       FROM ext_ledger_entry WHERE createdAt < ? ORDER BY createdAt, id LIMIT ?`,
      [before, batchSize],
    )
    const copied = copyResult.affectedRows ?? 0

    // delete：游标水印分批（取已 copy 的最小/最大 id 窗口）
    if (copied > 0) {
      await em.query(
        `DELETE FROM ext_ledger_entry WHERE createdAt < ? AND id IN (
          SELECT id FROM (SELECT id FROM ext_ledger_entry WHERE createdAt < ? ORDER BY createdAt, id LIMIT ?) AS t
        )`,
        [before, before, copied],
      )
    }
    return { archived: copied, hasMore: copied === batchSize }
  }

  /** 联动归档交易单（分录归档完成后调用） */
  async archiveTransfers(before: Date, batchSize = 1000, manager?: EntityManager): Promise<{ archived: number; hasMore: boolean }> {
    const em = manager ?? this.ctx.dataSource.manager
    // 只归档终态单（POSTED/FAILED/CANCELLED/REJECTED）
    const result = await em.query(
      `DELETE FROM ext_ledger_transfer WHERE createdAt < ? AND postStatus IN (?, ?, ?, ?) ORDER BY createdAt LIMIT ?`,
      [before, PostStatusDict.POSTED, PostStatusDict.FAILED, PostStatusDict.CANCELLED, PostStatusDict.REJECTED, batchSize],
    )
    const deleted = result.affectedRows ?? 0
    return { archived: deleted, hasMore: deleted === batchSize }
  }
}
