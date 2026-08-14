/**
 * @fileoverview 账本（账户）默认实体实现
 * @description 不扩展字段时使用本实体；扩展方继承 LedgerAccountBase 后通过 forRoot 注入替换
 */

import { Entity } from 'typeorm'
import { LedgerAccountBase } from './ledger-account.base'

/**
 * 默认账户实体（不扩展字段时使用）
 * @description synchronize:false —— TypeORM 零分区感知且 dev synchronize=true 会造成 schema 漂移，
 *   表结构一律由 database/migrations 手写 DDL 管理（评审 A3 M2）
 */
@Entity('ext_ledger_account', { synchronize: false })
export class DefaultLedgerAccount extends LedgerAccountBase {}
