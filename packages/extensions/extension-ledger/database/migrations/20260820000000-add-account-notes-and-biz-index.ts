/**
 * @fileoverview 审核账户备注 + 交易类型索引 migration
 * @description ext_ledger_transfer 增加 accountNotes（审核时按账户编写的备注，固定结构
 *   accountId -> { note: 纯文本, noteExtra: JSON }，流水查询按账户派生展示）：
 *   - 不用 extra（extra 是业务层自由数据，审核备注是固定结构专用数据）
 *   - 不落分录表/归档表（分录只查不改；按 transferNo JOIN 交易单派生，零分区表改动）
 * 另增 (bizType, createdAt) 组合索引：交易单面 bizType 过滤/排序（提现列表、汇总）现无
 * 单列索引（唯一键 uk(bizRef,bizType) 以 bizRef 打头用不上），供 queryTransfers/sumTransfers。
 */

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAccountNotesAndBizIndex20260820000000 implements MigrationInterface {
  name = 'AddAccountNotesAndBizIndex20260820000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ext_ledger_transfer ADD COLUMN accountNotes json NULL COMMENT '审核账户备注(accountId->{note,noteExtra})'`,
    )
    await queryRunner.query(
      `CREATE INDEX idx_ledger_transfer_biz_created ON ext_ledger_transfer (bizType, createdAt)`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_ledger_transfer_biz_created ON ext_ledger_transfer`)
    await queryRunner.query(`ALTER TABLE ext_ledger_transfer DROP COLUMN accountNotes`)
  }
}
