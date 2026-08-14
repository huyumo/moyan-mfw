/**
 * @fileoverview 账本（账户）抽象基类
 * @description 字段扩展点：扩展方可继承本类添加强类型列，通过 forRoot({ accountEntity }) 注入替换
 *
 * 扩展契约：
 *   1. 继承本类后用 @Entity('ext_ledger_account')（或自定义表名）装饰子类
 *   2. 子类新增列须自行提供 migration（ALTER TABLE ... ADD COLUMN）
 *   3. forRoot({ accountEntity: MyAccount }) 注入，storage 经 DataSource.getRepository(accountEntity) 动态操作
 *
 * 金额一律 bigint（最小单位，如人民币分），JSON 传输用字符串防精度丢失
 */

import { PrimaryGeneratedColumn, Column, Index, Unique } from 'typeorm'
import { Base } from 'moyan-mfw-base/backend'

/**
 * 账户基类（抽象，不带 @Entity）
 * @description 继承 Base 软删；唯一约束 (holderId, holderType, tag, currency)
 */
@Unique('uk_ledger_account_holder_tag_currency', ['holderId', 'holderType', 'tag', 'currency'])
export abstract class LedgerAccountBase extends Base {
  @PrimaryGeneratedColumn('uuid', { comment: '主键ID' })
  id: string

  /** 系统账号 key（可选，外部系统对接用） */
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '系统账号key' })
  sysAccountKey: string | null

  /** 持有者 ID（商家/用户 ID） */
  @Index('idx_ledger_account_holder')
  @Column({ type: 'varchar', length: 36, comment: '持有者ID' })
  holderId: string

  /** 持有者表名（默认 system） */
  @Column({ type: 'varchar', length: 64, default: 'system', comment: '持有者表名' })
  holderType: string

  /** 账户类型标签（注册制，forRoot accountTags 声明） */
  @Index('idx_ledger_account_tag')
  @Column({ type: 'varchar', length: 32, default: 'default', comment: '账户类型标签' })
  tag: string

  /** 币种（CNY/ITG 等，与金额最小单位配合） */
  @Index('idx_ledger_account_currency')
  @Column({ type: 'char', length: 4, default: 'CNY', comment: '币种' })
  currency: string

  /** 可用余额（bigint 最小单位） */
  @Column({ type: 'bigint', default: 0, comment: '可用余额' })
  balance: string

  /** 审核冻结金额（需审单制单后转入） */
  @Column({ type: 'bigint', default: 0, comment: '审核冻结金额' })
  frozen: string

  /** 在途预占金额（免审单制单后转入，待入账） */
  @Column({ type: 'bigint', default: 0, comment: '在途预占金额' })
  pendingOut: string

  /** 累计转入 */
  @Column({ type: 'bigint', default: 0, comment: '累计转入' })
  totalIncome: string

  /** 累计转出 */
  @Column({ type: 'bigint', default: 0, comment: '累计转出' })
  totalOutcome: string

  /** 扩展字段（弱类型灵活字段，经 ILedgerFieldExtension.validateExtra 校验） */
  @Column({ type: 'json', nullable: true, comment: '扩展附录' })
  extra: Record<string, unknown> | null
}
