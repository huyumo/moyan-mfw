/**
 * @fileoverview 冲正记录表 + 分录冲正标记 migration（demo 库）
 * @description 与扩展包 database/migrations/20260821000000-add-ledger-reversal-and-isreversal.ts 内容一致；
 * demo 库已有历史表数据，需本地执行一次 DDL
 *
 * 执行：npx ts-node src/database/run-migrations.ts
 */

import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLedgerReversalAndIsReversalDemo1716000004000 implements MigrationInterface {
  name = 'AddLedgerReversalAndIsReversalDemo1716000004000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_ledger_reversal (
        id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增ID',
        reversalNo VARCHAR(40) NOT NULL COMMENT '冲正单号',
        originalTransferNo VARCHAR(40) NOT NULL COMMENT '被冲正的原交易单号',
        bizRef VARCHAR(64) NOT NULL COMMENT '业务幂等键',
        bizType VARCHAR(32) NOT NULL COMMENT '业务类型',
        currency CHAR(4) NOT NULL COMMENT '币种',
        amount BIGINT NOT NULL COMMENT '冲正总金额',
        fromAccountId VARCHAR(36) NOT NULL COMMENT '原转出方账户ID（资金退回目的地）',
        toAccounts JSON NOT NULL COMMENT '原收款方明细（冲正后各自退回其金额）',
        status TINYINT NOT NULL DEFAULT 1 COMMENT '冲正状态: 1=已冲正',
        description TEXT NULL COMMENT '描述',
        makerId VARCHAR(36) NULL COMMENT '制单人ID',
        makerText VARCHAR(64) NULL COMMENT '制单人名称',
        extra JSON NULL COMMENT '扩展附录',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        PRIMARY KEY (id),
        UNIQUE KEY uk_ledger_reversal_no (reversalNo),
        UNIQUE KEY uk_ledger_reversal_original (originalTransferNo),
        UNIQUE KEY uk_ledger_reversal_biz_ref (bizRef, bizType),
        INDEX idx_ledger_reversal_from (fromAccountId),
        INDEX idx_ledger_reversal_created (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='冲正记录'
    `)
    await queryRunner.query(
      `ALTER TABLE ext_ledger_entry ADD COLUMN isReversal tinyint NOT NULL DEFAULT 0 COMMENT '是否冲正腿: 1=是 0=否'`,
    )
    await queryRunner.query(
      `ALTER TABLE ext_ledger_entry_archive ADD COLUMN isReversal tinyint NOT NULL DEFAULT 0 COMMENT '是否冲正腿: 1=是 0=否'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ext_ledger_entry_archive DROP COLUMN isReversal`)
    await queryRunner.query(`ALTER TABLE ext_ledger_entry DROP COLUMN isReversal`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_ledger_reversal`)
  }
}
