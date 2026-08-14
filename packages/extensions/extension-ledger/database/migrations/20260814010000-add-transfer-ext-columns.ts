/**
 * @fileoverview 交易单业务扩展预留索引位 migration
 * @description ext_ledger_transfer 增加 extCol1~extCol4（业务扩展筛选位）：
 *   - 列：varchar(64) 可空，语义由 forRoot({ bizExtMappings }) 按 bizType 维度定义
 *   - 索引：每列独立索引，等值筛选走索引（对应 queryTransfers({ extFields }) 翻译）
 *   - 与 generated column 方案对比：普通列+普通索引，分区表/多交易类型/换存储兼容性更好
 */

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTransferExtColumns20260814010000 implements MigrationInterface {
  name = 'AddTransferExtColumns20260814010000'

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
