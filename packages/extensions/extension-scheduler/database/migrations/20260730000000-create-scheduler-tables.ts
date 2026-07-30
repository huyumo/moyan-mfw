import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateSchedulerTables20260730000000 implements MigrationInterface {
  name = 'CreateSchedulerTables20260730000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 定时任务定义
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_scheduler_task (
        id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
        taskCode VARCHAR(128) NOT NULL COMMENT '任务编码',
        taskName VARCHAR(128) NOT NULL COMMENT '任务名称',
        taskType TINYINT NOT NULL DEFAULT 1 COMMENT '任务类型: 1=Cron定时 2=延迟任务',
        cronExpression VARCHAR(128) NULL COMMENT 'Cron表达式（6段秒级）',
        intervalSeconds INT NOT NULL DEFAULT 0 COMMENT '固定间隔秒数（与cron二选一，0=使用cron）',
        enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否启用',
        timeoutSeconds INT NOT NULL DEFAULT 300 COMMENT '超时秒数',
        description TEXT NULL COMMENT '任务描述',
        catchUpOnRestart BOOLEAN NOT NULL DEFAULT FALSE COMMENT '重启后是否补偿执行',
        lastRunAt DATETIME NULL COMMENT '上次执行时间',
        nextRunAt DATETIME NULL COMMENT '下次执行时间',
        lastRunStatus TINYINT NULL COMMENT '上次执行状态',
        lastErrorMessage TEXT NULL COMMENT '上次错误信息',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        UNIQUE INDEX idx_scheduler_task_code (taskCode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='定时任务定义'
    `)

    // 定时任务实例
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_scheduler_task_instance (
        id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
        taskCode VARCHAR(128) NOT NULL COMMENT '任务编码',
        entityId VARCHAR(128) NULL COMMENT '业务实体ID',
        payload JSON NULL COMMENT '业务数据',
        executeAt DATETIME NOT NULL COMMENT '应执行时间',
        status TINYINT NOT NULL DEFAULT 1 COMMENT '实例状态: 1=待执行 2=执行中 3=已成功 4=已失败 5=已取消 6=已超时 7=未归档',
        startedAt DATETIME NULL COMMENT '开始执行时间',
        finishedAt DATETIME NULL COMMENT '完成时间',
        retryCount INT NOT NULL DEFAULT 0 COMMENT '重试次数',
        errorMessage TEXT NULL COMMENT '错误信息',
        errorStack TEXT NULL COMMENT '错误堆栈',
        executor VARCHAR(64) NULL COMMENT '执行实例标识',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        INDEX idx_task_instance_scan (status, executeAt),
        INDEX idx_task_instance_archive (executor, status),
        INDEX idx_task_instance_code (taskCode),
        INDEX idx_task_instance_entity (entityId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='定时任务实例'
    `)

    // 定时任务执行日志
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ext_scheduler_task_log (
        id VARCHAR(36) PRIMARY KEY COMMENT '主键ID',
        taskCode VARCHAR(128) NOT NULL COMMENT '任务编码',
        taskName VARCHAR(128) NOT NULL COMMENT '任务名称',
        instanceId VARCHAR(36) NULL COMMENT '延迟实例ID',
        status TINYINT NOT NULL DEFAULT 1 COMMENT '执行状态: 1=执行中 2=成功 3=失败 4=超时 5=跳过',
        triggerType TINYINT NOT NULL DEFAULT 1 COMMENT '触发方式: 1=自动 2=手动',
        startedAt DATETIME NOT NULL COMMENT '开始时间',
        finishedAt DATETIME NULL COMMENT '完成时间',
        durationMs INT NOT NULL DEFAULT 0 COMMENT '耗时毫秒',
        executor VARCHAR(64) NULL COMMENT '执行实例标识',
        errorMessage TEXT NULL COMMENT '错误信息',
        errorStack TEXT NULL COMMENT '错误堆栈',
        result JSON NULL COMMENT '执行结果摘要',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        deleteAt DATETIME NULL COMMENT '删除时间',
        INDEX idx_task_log_code (taskCode),
        INDEX idx_task_log_status (status),
        INDEX idx_task_log_startedAt (startedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='定时任务执行日志'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ext_scheduler_task_log`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_scheduler_task_instance`)
    await queryRunner.query(`DROP TABLE IF EXISTS ext_scheduler_task`)
  }
}
