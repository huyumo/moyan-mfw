/**
 * @fileoverview 账本存储 SPI 演示实现（ILedgerStorage 继承式扩展）
 * @description extends TypeOrmLedgerStorage 展示「继承替换」写法（分库分表/加监控/换引擎的扩展位），
 * 重写关键方法加耗时日志，其余方法全部继承默认实现。
 *
 * 注意：storageImpl 经 forRoot 注入，构造器签名须与默认实现一致（DataSource + LEDGER_OPTIONS）
 */

import { Injectable, Inject, Logger } from '@nestjs/common'
import { DataSource, EntityManager } from 'typeorm'
import {
  TypeOrmLedgerStorage,
  LEDGER_OPTIONS,
  type LedgerModuleOptions,
} from 'moyan-mfw-extension-ledger/backend'

@Injectable()
export class DemoLedgerStorage extends TypeOrmLedgerStorage {
  private readonly logger = new Logger(DemoLedgerStorage.name)

  constructor(dataSource: DataSource, @Inject(LEDGER_OPTIONS) options: LedgerModuleOptions) {
    super(dataSource, options)
  }

  /** 耗时包装：展示如何为存储层加监控/审计 */
  private async trace<T>(method: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      this.logger.log(`[存储SPI] ${method} 耗时 ${Date.now() - start}ms`)
      return result
    } catch (err: any) {
      this.logger.warn(`[存储SPI] ${method} 失败: ${err?.message}`)
      throw err
    }
  }

  createTransferWithReserve(input: any, maker?: any, manager?: EntityManager) {
    return this.trace('createTransferWithReserve', () => super.createTransferWithReserve(input, maker, manager))
  }

  claimForPosting(transferNo: string, claimToken: string, manager?: EntityManager) {
    return this.trace('claimForPosting', () => super.claimForPosting(transferNo, claimToken, manager))
  }

  postTransfer(transferNo: string, claimToken: string, manager?: EntityManager) {
    return this.trace('postTransfer', () => super.postTransfer(transferNo, claimToken, manager))
  }

  queryEntries(filter: any, manager?: EntityManager) {
    return this.trace('queryEntries', () => super.queryEntries(filter, manager))
  }
}
