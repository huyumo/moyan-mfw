/**
 * @fileoverview 开户初始余额分录补写币种 migration
 * @description 历史开户合成单分录（bizType='ledger_open_account'）的 currency 为 NULL，
 *   从关联交易单回填币种；下游（API 写入）已在 openAccount 补写 currency。
 */

import { MigrationInterface, QueryRunner } from 'typeorm'

export class BackfillOpenAccountEntryCurrency20260818000000 implements MigrationInterface {
  name = 'BackfillOpenAccountEntryCurrency20260818000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE ext_ledger_entry e
       INNER JOIN ext_ledger_transfer t ON e.transferNo = t.transferNo
       SET e.currency = t.currency
       WHERE e.currency IS NULL AND t.bizType = 'ledger_open_account'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 幂等回填无需撤销；如需还原为 NULL 可执行（一般不回退）
    await queryRunner.query(
      `UPDATE ext_ledger_entry e
       INNER JOIN ext_ledger_transfer t ON e.transferNo = t.transferNo
       SET e.currency = NULL
       WHERE t.bizType = 'ledger_open_account'`,
    )
  }
}
