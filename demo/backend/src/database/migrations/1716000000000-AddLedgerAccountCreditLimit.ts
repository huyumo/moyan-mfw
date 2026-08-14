/**
 * @fileoverview 账本账户表扩展列迁移（账本实体扩展演示）
 * @description 对齐 extension-ledger README 契约「扩展方新增列须自带 migration」：
 * DemoMerchantAccount extends LedgerAccountBase 新增 creditLimit 列（信用额度，bigint 最小单位）
 *
 * 执行：npx ts-node src/database/run-migrations.ts
 */

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLedgerAccountCreditLimit1716000000000 implements MigrationInterface {
  name = 'AddLedgerAccountCreditLimit1716000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ext_ledger_account ADD COLUMN creditLimit BIGINT DEFAULT 0 COMMENT '信用额度'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ext_ledger_account DROP COLUMN creditLimit`)
  }
}
