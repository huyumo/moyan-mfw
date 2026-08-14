/**
 * @fileoverview 分录流水表补充币种列 migration（demo 库）
 * @description 与扩展包 database/migrations/20260814020000-add-entry-currency.ts 内容一致；
 * demo 库已有历史表数据，需本地执行一次 ALTER
 *
 * 执行：npx ts-node src/database/run-migrations.ts
 */

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEntryCurrencyDemo1716000002000 implements MigrationInterface {
  name = 'AddEntryCurrencyDemo1716000002000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ext_ledger_entry ADD COLUMN currency char(4) NULL COMMENT '币种'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ext_ledger_entry DROP COLUMN currency`)
  }
}
