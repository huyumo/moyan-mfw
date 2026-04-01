/**
 * @fileoverview 审计日志实体
 * @description 记录系统操作审计日志
 */

import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';
import { AuditModule } from '../../../../common/decorators/audit-log.decorator';

/**
 * 审计日志实体
 * @description 记录系统操作审计日志
 */
@Entity('sys_audit_logs')
export class AuditLog {
  /**
   * 日志 ID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 所属模块
   */
  @Column({ type: 'enum', enum: AuditModule, comment: '所属模块' })
  @Index()
  module: AuditModule | string;

  /**
   * 事件名称
   */
  @Column({ type: 'varchar', length: 64, comment: '事件名称' })
  @Index()
  event: string;

  /**
   * 操作人 ID
   */
  @Column({ type: 'char', length: 36, comment: '操作人 ID' })
  @Index()
  operatorId: string;

  /**
   * 操作人名称
   */
  @Column({ type: 'varchar', length: 64, comment: '操作人名称' })
  operatorName: string;

  /**
   * 目标 ID
   */
  @Column({ type: 'char', length: 36, nullable: true, comment: '操作目标 ID' })
  @Index()
  targetId: string;

  /**
   * 目标类型
   */
  @Column({ type: 'varchar', length: 64, comment: '操作目标类型' })
  targetType: string;

  /**
   * 描述
   */
  @Column({ type: 'text', comment: '操作描述' })
  description: string;

  /**
   * 快照
   */
  @Column({ type: 'json', nullable: true, comment: '数据快照 - before/after' })
  snapshot: {
    before?: any;
    after?: any;
  };

  /**
   * IP 地址
   */
  @Column({ type: 'varchar', length: 64, comment: '操作 IP 地址' })
  ip: string;

  /**
   * User-Agent
   */
  @Column({ type: 'text', nullable: true, comment: 'User-Agent' })
  userAgent: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  @Index()
  createAt: Date;
}
