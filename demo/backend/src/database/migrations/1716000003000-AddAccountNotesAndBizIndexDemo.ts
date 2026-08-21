/**
 * @fileoverview 审核账户备注 + 交易类型索引 migration（demo 库）
 * @description 与扩展包 database/migrations/20260820000000-add-account-notes-and-biz-index.ts 内容一致；
 * demo 库已有历史表数据，需本地执行一次 ALTER
 *
 * 执行：npx ts-node src/database/run-migrations.ts
 */

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAccountNotesAndBizIndexDemo1716000003000 implements MigrationInterface {
  name = 'AddAccountNotesAndBizIndexDemo1716000003000'

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
