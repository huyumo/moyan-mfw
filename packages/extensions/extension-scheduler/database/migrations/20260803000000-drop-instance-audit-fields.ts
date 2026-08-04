import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropInstanceAuditFields20260803000000 implements MigrationInterface {
  name = 'DropInstanceAuditFields20260803000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 移除实例表的执行审计字段（执行审计统一由 Log 表承载）
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance DROP COLUMN startedAt`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance DROP COLUMN finishedAt`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance DROP COLUMN errorMessage`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance DROP COLUMN errorStack`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance ADD COLUMN errorStack TEXT NULL COMMENT '错误堆栈'`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance ADD COLUMN errorMessage TEXT NULL COMMENT '错误信息'`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance ADD COLUMN finishedAt DATETIME NULL COMMENT '完成时间'`)
    await queryRunner.query(`ALTER TABLE ext_scheduler_task_instance ADD COLUMN startedAt DATETIME NULL COMMENT '开始执行时间'`)
  }
}
