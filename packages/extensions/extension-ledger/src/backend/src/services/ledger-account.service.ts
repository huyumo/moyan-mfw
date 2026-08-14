/**
 * @fileoverview 账本（账户）服务 - 业务层入口
 * @description 开户（幂等 + 同步初始余额入账）、查询；注入 storage SPI
 */

import { Injectable, Inject } from '@nestjs/common'
import { LEDGER_STORAGE, LEDGER_FIELD_EXTENSION, LEDGER_OPTIONS, type LedgerModuleOptions } from '../spi/interfaces'
import type { ILedgerStorage, ILedgerFieldExtension, OpenAccountInput } from '../spi/interfaces'

@Injectable()
export class LedgerAccountService {
  constructor(
    @Inject(LEDGER_STORAGE) private readonly storage: ILedgerStorage,
    @Inject(LEDGER_FIELD_EXTENSION) private readonly fieldExt: ILedgerFieldExtension,
    @Inject(LEDGER_OPTIONS) private readonly options: LedgerModuleOptions,
  ) {}

  /** 开户（幂等；初始余额同步入账） */
  async openAccount(input: OpenAccountInput) {
    // tag 注册制校验
    const tag = input.tag ?? 'default'
    if (this.options.accountTags && this.options.accountTags.length > 0) {
      if (!this.options.accountTags.includes(tag)) {
        throw new Error(`未注册的账户标签: ${tag}（注册列表: ${this.options.accountTags.join(', ')}）`)
      }
    }
    // 扩展字段校验
    this.fieldExt.validateAccountExtra(tag, input.extra ?? null)
    return this.storage.openAccount(input)
  }

  /** 查账户 */
  async getAccount(accountId: string) {
    return this.storage.getAccount(accountId)
  }

  /** 按 holder + tag + currency 查账户 */
  async findAccount(holderId: string, holderType = 'system', tag = 'default', currency = 'CNY') {
    return this.storage.findAccount(holderId, holderType, tag, currency)
  }

  /** 账户分页 */
  async queryAccounts(filter: any) {
    return this.storage.queryAccounts(filter)
  }
}
