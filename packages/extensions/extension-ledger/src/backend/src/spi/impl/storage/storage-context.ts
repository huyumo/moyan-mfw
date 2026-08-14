/**
 * @fileoverview TypeOrmLedgerStorage 基础设施
 * @description 提供动态实体 Repository 解析（支持账户实体继承替换）与事务封装
 */

import { Injectable, Inject } from '@nestjs/common'
import { DataSource, EntityManager, Repository } from 'typeorm'
import { LEDGER_OPTIONS, type LedgerModuleOptions } from '../../interfaces'
import { DefaultLedgerAccount, LedgerTransfer, LedgerEntry, LedgerReconcileReport } from '../../../entities'
import type { LedgerAccountBase } from '../../../entities'

@Injectable()
export class StorageContext {
  readonly dataSource: DataSource
  readonly accountEntityCtor: any
  /** 模块配置（bizExtMappings 等由域 storage 读取） */
  readonly options: LedgerModuleOptions

  constructor(dataSource: DataSource, @Inject(LEDGER_OPTIONS) options: LedgerModuleOptions) {
    this.dataSource = dataSource
    this.options = options
    this.accountEntityCtor = options?.accountEntity ?? DefaultLedgerAccount
  }

  /** 获取账户 Repository（动态实体） */
  accountRepo(manager?: EntityManager): Repository<LedgerAccountBase> {
    const em = manager ?? this.dataSource.manager
    return em.getRepository(this.accountEntityCtor) as Repository<LedgerAccountBase>
  }

  transferRepo(manager?: EntityManager): Repository<LedgerTransfer> {
    const em = manager ?? this.dataSource.manager
    return em.getRepository(LedgerTransfer)
  }

  entryRepo(manager?: EntityManager): Repository<LedgerEntry> {
    const em = manager ?? this.dataSource.manager
    return em.getRepository(LedgerEntry)
  }

  reportRepo(manager?: EntityManager): Repository<LedgerReconcileReport> {
    const em = manager ?? this.dataSource.manager
    return em.getRepository(LedgerReconcileReport)
  }

  /** 事务封装（对齐 anti-patterns.md：用 dataSource.transaction()） */
  async tx<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(work)
  }
}
