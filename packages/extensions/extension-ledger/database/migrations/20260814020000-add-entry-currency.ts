/**
 * @fileoverview 分录流水表补充币种列 migration
 * @description ext_ledger_entry 增加 currency 列（入账时从交易单带入）：
 *   分录金额展示/格式化依赖币种（ITG 0 位小数 / CNY 2 位小数），
 *   历史数据为 NULL（前端回退默认 CNY 展示）
 */

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEntryCurrency20260814020000 implements MigrationInterface {
  name = 'AddEntryCurrency20260814020000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ext_ledger_entry ADD COLUMN currency char(4) NULL COMMENT '币种'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ext_ledger_entry DROP COLUMN currency`)
  }
}
