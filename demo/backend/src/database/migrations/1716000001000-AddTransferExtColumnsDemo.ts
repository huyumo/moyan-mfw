/**
 * @fileoverview 交易单业务扩展预留索引位 migration（demo 库）
 * @description 与扩展包 database/migrations/20260814010000-add-transfer-ext-columns.ts 内容一致；
 * demo 库已有历史表数据，需本地执行一次 ALTER
 *
 * 执行：npx ts-node src/database/run-migrations.ts
 */

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTransferExtColumnsDemo1716000001000 implements MigrationInterface {
  name = 'AddTransferExtColumnsDemo1716000001000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ext_ledger_transfer
       ADD COLUMN extCol1 varchar(64) NULL COMMENT '业务扩展索引位1',
       ADD COLUMN extCol2 varchar(64) NULL COMMENT '业务扩展索引位2',
       ADD COLUMN extCol3 varchar(64) NULL COMMENT '业务扩展索引位3',
       ADD COLUMN extCol4 varchar(64) NULL COMMENT '业务扩展索引位4'`,
    )
    await queryRunner.query(`CREATE INDEX idx_ledger_transfer_extCol1 ON ext_ledger_transfer (extCol1)`)
    await queryRunner.query(`CREATE INDEX idx_ledger_transfer_extCol2 ON ext_ledger_transfer (extCol2)`)
    await queryRunner.query(`CREATE INDEX idx_ledger_transfer_extCol3 ON ext_ledger_transfer (extCol3)`)
    await queryRunner.query(`CREATE INDEX idx_ledger_transfer_extCol4 ON ext_ledger_transfer (extCol4)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ext_ledger_transfer
      DROP INDEX idx_ledger_transfer_extCol1,
      DROP INDEX idx_ledger_transfer_extCol2,
      DROP INDEX idx_ledger_transfer_extCol3,
      DROP INDEX idx_ledger_transfer_extCol4`)
    await queryRunner.query(
      `ALTER TABLE ext_ledger_transfer
       DROP COLUMN extCol1,
       DROP COLUMN extCol2,
       DROP COLUMN extCol3,
       DROP COLUMN extCol4`,
    )
  }
}
