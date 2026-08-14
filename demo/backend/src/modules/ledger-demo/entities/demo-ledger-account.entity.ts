/**
 * @fileoverview 账本账户实体扩展演示（LedgerAccountBase 继承）
 * @description 业务层新增强类型列：creditLimit（信用额度），展示 README「账本字段扩展」契约：
 *   1. @Entity 继承 LedgerAccountBase
 *   2. 新增列自带 migration（见 demo/database/migrations/1716000000000-AddLedgerAccountCreditLimit.ts）
 *   3. forRoot({ accountEntity: DemoMerchantAccount }) 注入，storage 经 getRepository 动态操作
 */

import { Entity, Column } from 'typeorm'
import { LedgerAccountBase } from 'moyan-mfw-extension-ledger/backend'

@Entity('ext_ledger_account', { synchronize: false })
export class DemoMerchantAccount extends LedgerAccountBase {
  /** 信用额度（最小单位字符串；生产环境需 migration 保障列存在） */
  @Column({ type: 'bigint', default: 0, comment: '信用额度' })
  creditLimit: string
}
