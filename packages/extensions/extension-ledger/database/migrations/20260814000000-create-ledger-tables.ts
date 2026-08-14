import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * 借贷记账系统建表迁移
 *
 * 分区设计要点（四路评审修正）：
 *   - ext_ledger_entry：KEY(account_id) PARTITIONS 64
 *     PRIMARY KEY (id, account_id)：自增列首列 + 分区键进主键 = MySQL 规则下唯一合法列序
 *     用户流水查询（必带 account_id）-> 单分区裁剪，跨任意月翻页无感
 *   - ext_ledger_entry_archive：RANGE(TO_DAYS(created)) 月分区
 *     归档表可 DROP PARTITION 秒级清理（解决 KEY 分区与时间归档正交的张力）
 *   - 分录表不继承框架 Base（流水不可变，软删语义冲突）
 *   - 金额一律 bigint（最小单位），JS 侧字符串传输防精度丢失
 *
 * 注意：MySQL 8+；执行前确认 connection 配置 supportBigNumbers:true, bigNumberStrings:true
 */
export class CreateLedgerTables20260814000000 implements MigrationInterface {
  name = 'CreateLedgerTables20260814000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 账户表（不分区，与用户/商户量级相当）
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_ledger_account (
        id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
        sysAccountKey VARCHAR(64) NULL COMMENT '系统账号key',
        holderId VARCHAR(36) NOT NULL COMMENT '持有者ID',
        holderType VARCHAR(64) NOT NULL DEFAULT 'system' COMMENT '持有者表名',
        tag VARCHAR(32) NOT NULL DEFAULT 'default' COMMENT '账户类型标签',
        currency CHAR(4) NOT NULL DEFAULT 'CNY' COMMENT '币种',
        balance BIGINT NOT NULL DEFAULT 0 COMMENT '可用余额',
        frozen BIGINT NOT NULL DEFAULT 0 COMMENT '审核冻结金额',
        pendingOut BIGINT NOT NULL DEFAULT 0 COMMENT '在途预占金额',
        totalIncome BIGINT NOT NULL DEFAULT 0 COMMENT '累计转入',
        totalOutcome BIGINT NOT NULL DEFAULT 0 COMMENT '累计转出',
        extra JSON NULL COMMENT '扩展附录',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        UNIQUE INDEX uk_ledger_account_holder_tag_currency (holderId, holderType, tag, currency),
        INDEX idx_ledger_account_holder (holderId),
        INDEX idx_ledger_account_tag (tag),
        INDEX idx_ledger_account_currency (currency)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账本（账户）'
    `)

    // 2. 交易单表（不分区，全主键/唯一键点查）
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_ledger_transfer (
        transferNo VARCHAR(40) PRIMARY KEY COMMENT '交易单号',
        bizRef VARCHAR(64) NOT NULL COMMENT '业务幂等键',
        bizType VARCHAR(32) NOT NULL COMMENT '业务类型',
        fromAccountId VARCHAR(36) NOT NULL COMMENT '转出方账户ID',
        toAccounts JSON NOT NULL COMMENT '收款方明细',
        amount BIGINT NOT NULL COMMENT '流动总金额',
        currency CHAR(4) NOT NULL COMMENT '币种',
        transferMode TINYINT NOT NULL DEFAULT 1 COMMENT '转账模式: 1=一对一 2=一对多',
        needReview TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否需要审核',
        holdType TINYINT NOT NULL COMMENT '占用类型: 1=预占在途 2=审核冻结',
        auditStatus TINYINT NOT NULL DEFAULT 1 COMMENT '审核状态: 1=待审核 2=通过 3=驳回',
        postStatus TINYINT NOT NULL DEFAULT 2 COMMENT '入账状态: 1=待审核 2=待入账 3=入账中 4=已入账 5=失败 6=已取消 7=已驳回',
        associatedOrder VARCHAR(64) NULL COMMENT '关联业务单号',
        orderTable VARCHAR(64) NULL COMMENT '关联业务表名',
        retryCount INT NOT NULL DEFAULT 0 COMMENT '重试次数',
        claimToken VARCHAR(64) NULL COMMENT '认领令牌',
        claimAt DATETIME NULL COMMENT '认领时间',
        nextRetryAt DATETIME NULL COMMENT '下次重试时间',
        lastPushAt DATETIME NULL COMMENT '上次入队时间',
        lastError TEXT NULL COMMENT '上次错误信息',
        reversedFromTransferNo VARCHAR(40) NULL COMMENT '冲正关联原单号',
        description TEXT NULL COMMENT '描述',
        makerId VARCHAR(36) NULL COMMENT '制单人ID',
        makerText VARCHAR(64) NULL COMMENT '制单人名称',
        auditorId VARCHAR(36) NULL COMMENT '审核人ID',
        auditorText VARCHAR(64) NULL COMMENT '审核人名称',
        auditTime DATETIME NULL COMMENT '审核时间',
        auditNotes TEXT NULL COMMENT '审核备注',
        extra JSON NULL COMMENT '扩展附录',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        UNIQUE INDEX uk_ledger_transfer_biz_ref (bizRef, bizType),
        UNIQUE INDEX uk_ledger_transfer_reversed_from (reversedFromTransferNo),
        INDEX idx_ledger_transfer_from (fromAccountId),
        INDEX idx_ledger_transfer_currency (currency),
        INDEX idx_ledger_transfer_mode (transferMode),
        INDEX idx_ledger_transfer_need_review (needReview),
        INDEX idx_ledger_transfer_audit_status (auditStatus),
        INDEX idx_ledger_transfer_post_status (postStatus, createdAt),
        INDEX idx_ledger_transfer_created (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交易单'
    `)

    // 3. 分录表（在线，KEY(account_id) 64 分区）
    //    PRIMARY KEY (id, account_id)：自增列首列 + 分区键进主键
    //    分录落账后不可变（冲正=新增反向分录）
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_ledger_entry (
        id BIGINT NOT NULL AUTO_INCREMENT COMMENT '自增ID',
        accountId VARCHAR(36) NOT NULL COMMENT '账户ID（分区键）',
        entryNo VARCHAR(48) NOT NULL COMMENT '分录单号',
        transferNo VARCHAR(40) NOT NULL COMMENT '关联交易单号',
        direction TINYINT NOT NULL COMMENT '借贷方向: 1=借 2=贷',
        signedAmount BIGINT NOT NULL COMMENT '符号金额（借正贷负）',
        balanceBefore BIGINT NULL COMMENT '变更前余额',
        balanceAfter BIGINT NULL COMMENT '变更后余额',
        extra JSON NULL COMMENT '扩展附录',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (id, accountId),
        INDEX idx_ledger_entry_account (accountId, id),
        INDEX idx_ledger_entry_transfer (transferNo),
        INDEX idx_ledger_entry_created (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分录（流水，在线）'
      PARTITION BY KEY (accountId)
      PARTITIONS 64
    `)

    // 4. 归档表（RANGE(TO_DAYS(created)) 月分区，与在线表同构）
    //    归档表可 DROP PARTITION 秒级清理；初始建若干月分区，后续按月 REORGANIZE
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_ledger_entry_archive (
        id BIGINT NOT NULL COMMENT '自增ID（从在线表搬移，不自增）',
        accountId VARCHAR(36) NOT NULL COMMENT '账户ID',
        entryNo VARCHAR(48) NOT NULL COMMENT '分录单号',
        transferNo VARCHAR(40) NOT NULL COMMENT '关联交易单号',
        direction TINYINT NOT NULL COMMENT '借贷方向: 1=借 2=贷',
        signedAmount BIGINT NOT NULL COMMENT '符号金额',
        balanceBefore BIGINT NULL COMMENT '变更前余额',
        balanceAfter BIGINT NULL COMMENT '变更后余额',
        extra JSON NULL COMMENT '扩展附录',
        createdAt DATETIME NOT NULL COMMENT '创建时间',
        PRIMARY KEY (id, accountId, createdAt),
        INDEX idx_ledger_entry_archive_account (accountId, id),
        INDEX idx_ledger_entry_archive_transfer (transferNo),
        INDEX idx_ledger_entry_archive_created (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分录（流水，归档）'
      PARTITION BY RANGE (TO_DAYS(createdAt)) (
        PARTITION p_init VALUES LESS THAN (TO_DAYS('2026-09-01'))
      )
    `)

    // 5. 对账报告表
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_ledger_reconcile_report (
        id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
        triggerType TINYINT NOT NULL DEFAULT 1 COMMENT '触发方式: 1=手动 2=外部调度',
        triggerBy VARCHAR(36) NULL COMMENT '触发人ID',
        totalAccounts INT NOT NULL DEFAULT 0 COMMENT '检查账户总数',
        diffCount INT NOT NULL DEFAULT 0 COMMENT '差异账户数',
        diffs JSON NULL COMMENT '差异明细',
        status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=差异待处理 2=已处理',
        operatorId VARCHAR(36) NULL COMMENT '操作人',
        notes TEXT NULL COMMENT '备注',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        INDEX idx_ledger_reconcile_trigger (triggerType),
        INDEX idx_ledger_reconcile_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对账报告'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ext_ledger_reconcile_report`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_ledger_entry_archive`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_ledger_entry`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_ledger_transfer`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_ledger_account`)
  }
}
