/**
 * @fileoverview 账本（账户）服务 - 业务层入口
 * @description 开户（幂等+并发安全）、懒开户、系统户初始化、查询；注入 storage SPI
 */

import { Injectable, Inject } from '@nestjs/common'
import { LEDGER_STORAGE, LEDGER_FIELD_EXTENSION, LEDGER_OPTIONS, type LedgerModuleOptions } from '../spi/interfaces'
import type { ILedgerStorage, ILedgerFieldExtension, OpenAccountInput } from '../spi/interfaces'
import type { AccountView, AmountString, HolderRef } from 'moyan-mfw-extension-ledger/shared'

@Injectable()
export class LedgerAccountService {
  constructor(
    @Inject(LEDGER_STORAGE) private readonly storage: ILedgerStorage,
    @Inject(LEDGER_FIELD_EXTENSION) private readonly fieldExt: ILedgerFieldExtension,
    @Inject(LEDGER_OPTIONS) private readonly options: LedgerModuleOptions,
  ) {}

  /** 开户（幂等 + 并发安全；初始余额同步入账） */
  async openAccount(input: OpenAccountInput): Promise<AccountView> {
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

  /**
   * 懒开户：账户不存在则开（可带初始余额，默认 0），存在返回已有
   * 已存在账户跳过字段扩展校验（校验只约束新开户）；
   * 业务层记账前调用无需关心开户流程（幂等、并发安全）；
   * 命中已存在账户时对历史半截账户（有余额、缺 open_account 期初流水）幂等自愈补齐
   */
  async ensureAccount(input: HolderRef & { initialBalance?: AmountString; extra?: Record<string, unknown> }): Promise<AccountView> {
    const existing = await this.storage.findAccount(
      input.holderId,
      input.holderType ?? 'system',
      input.tag ?? 'default',
      input.currency ?? 'CNY',
    )
    if (existing) {
      // 有账面余额才需自愈（正常账户期初交易单已存在，内部幂等键点查即返回）
      if (BigInt(existing.balance) + BigInt(existing.frozen ?? '0') + BigInt(existing.pendingOut ?? '0') > 0n) {
        await this.storage.ensureOpeningEntry(existing.id)
      }
      return existing
    }
    return this.openAccount({
      holderId: input.holderId,
      holderType: input.holderType,
      tag: input.tag,
      currency: input.currency,
      initialBalance: input.initialBalance,
      extra: input.extra,
    })
  }

  /** 批量系统户初始化（幂等；业务层 onModuleInit 调用一次） */
  async ensureSystemAccounts(accounts: Array<HolderRef & { initialBalance?: AmountString; extra?: Record<string, unknown> }>): Promise<AccountView[]> {
    const result: AccountView[] = []
    for (const item of accounts) {
      result.push(await this.ensureAccount(item))
    }
    return result
  }

  /** 查账户 */
  async getAccount(accountId: string): Promise<AccountView | null> {
    return this.storage.getAccount(accountId)
  }

  /** 按 holder + tag + currency 查账户 */
  async findAccount(holderId: string, holderType = 'system', tag = 'default', currency = 'CNY'): Promise<AccountView | null> {
    return this.storage.findAccount(holderId, holderType, tag, currency)
  }

  /** 查可用余额（不存在返回 '0'；最小单位字符串） */
  async getBalance(holderId: string, holderType = 'system', tag = 'default', currency = 'CNY'): Promise<AmountString> {
    const account = await this.findAccount(holderId, holderType, tag, currency)
    return account?.balance ?? '0'
  }

  /** 账户快照（不存在返回 null） */
  async getAccountSnapshot(holderId: string, holderType = 'system', tag = 'default', currency = 'CNY'): Promise<AccountView | null> {
    return this.findAccount(holderId, holderType, tag, currency)
  }

  /** 账户分页 */
  async queryAccounts(filter: any) {
    return this.storage.queryAccounts(filter)
  }
}
