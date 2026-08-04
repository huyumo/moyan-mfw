import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * @fileoverview 调度器优化迁移
 * @description
 *   1. 修复既有迁移缺失列（task 缺 maxRetry/backoffStrategy/enableLog，instance 缺 triggerType）
 *   2. 新增 ext_scheduler_config 单例配置表（清理/崩溃恢复/限流参数）
 *   3. 新增 ext_scheduler_executor 执行器心跳注册表（动态分片）
 *   4. ext_scheduler_task 增加 CRON 分布式抢占锁（cronLockUntil + cronLockToken）
 *   5. 补充清理所需索引（createdAt），避免 DELETE 全表扫描 O(N²)
 */
export class AddSchedulerConfigExecutorCronLock20260804000000 implements MigrationInterface {
  name = 'AddSchedulerConfigExecutorCronLock20260804000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. 修复既有迁移缺失列（实体已定义，INSERT 会报 Unknown column） ──
    await queryRunner.query(`ALTER TABLE ext_scheduler_task
      ADD COLUMN maxRetry INT NOT NULL DEFAULT 3 COMMENT '最大重试次数（0=不重试）' AFTER catchUpOnRestart,
      ADD COLUMN backoffStrategy TEXT NULL COMMENT '退避策略JSON' AFTER maxRetry,
      ADD COLUMN enableLog BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否记录执行日志' AFTER backoffStrategy`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance
      ADD COLUMN triggerType TINYINT NOT NULL DEFAULT 1 COMMENT '触发方式: 1=自动 2=手动' AFTER executor`)

    // ── 2. 单例配置表 ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_scheduler_config (
        id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
        configKey VARCHAR(64) NOT NULL DEFAULT 'global' COMMENT '配置键（单例）',
        cleanupEnabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用定期清理',
        instanceRetentionDays INT NOT NULL DEFAULT 7 COMMENT '终态实例保留天数',
        logRetentionDays INT NOT NULL DEFAULT 30 COMMENT '执行日志保留天数',
        cleanupIntervalHours INT NOT NULL DEFAULT 6 COMMENT '清理间隔（小时）',
        crashRecoveryStrategy TINYINT NOT NULL DEFAULT 1 COMMENT '崩溃恢复策略: 1=重新入队 2=标记失败 3=标记未归档',
        orphanTimeoutSeconds INT NOT NULL DEFAULT 600 COMMENT '孤儿判定超时秒数',
        restartBatchSize INT NOT NULL DEFAULT 200 COMMENT '重启限流批次大小',
        restartBatchDelayMs INT NOT NULL DEFAULT 2000 COMMENT '重启限流批次间隔（毫秒）',
        cronDedupEnabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'CRON多实例去重开关',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        UNIQUE INDEX idx_scheduler_config_key (configKey)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调度器全局配置'
    `)

    // ── 3. 执行器心跳注册表 ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_scheduler_executor (
        id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
        executorId VARCHAR(64) NOT NULL COMMENT '执行器标识(hostname-pid-randomHex)',
        hostname VARCHAR(128) NULL COMMENT '主机名',
        pid INT NULL COMMENT '进程PID',
        lastHeartbeat DATETIME NOT NULL COMMENT '最后心跳时间',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        UNIQUE INDEX idx_executor_id (executorId),
        INDEX idx_executor_heartbeat (lastHeartbeat)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调度器执行器注册表'
    `)

    // ── 4. CRON 分布式抢占锁 + 实例认领令牌 ──
    await queryRunner.query(`ALTER TABLE ext_scheduler_task
      ADD COLUMN cronLockUntil DATETIME NULL COMMENT 'CRON抢占锁到期时间' AFTER lastErrorMessage,
      ADD COLUMN cronLockToken VARCHAR(64) NULL COMMENT 'CRON抢占锁令牌' AFTER cronLockUntil`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance
      ADD COLUMN claimToken VARCHAR(64) NULL COMMENT '认领令牌（防并发reload重复入轮）' AFTER triggerType`)

    // ── 5. 清理所需索引 ──
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance
      ADD INDEX idx_task_instance_createdAt (createdAt),
      ADD INDEX idx_task_instance_executor (executor)`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_log
      ADD INDEX idx_task_log_createdAt (createdAt)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_log DROP INDEX idx_task_log_createdAt`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance DROP INDEX idx_task_instance_createdAt`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance DROP INDEX idx_task_instance_executor`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance DROP COLUMN claimToken`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task
      DROP COLUMN cronLockToken,
      DROP COLUMN cronLockUntil`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_scheduler_executor`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_scheduler_config`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance DROP COLUMN triggerType`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task
      DROP COLUMN enableLog,
      DROP COLUMN backoffStrategy,
      DROP COLUMN maxRetry`)
  }
}
