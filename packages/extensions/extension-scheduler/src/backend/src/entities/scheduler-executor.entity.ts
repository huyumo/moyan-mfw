/**
 * @fileoverview 调度器执行器注册表实体
 * @description 记录存活执行器的心跳，用于动态分片计算与孤儿判定
 *   每个服务实例启动时注册一行，每30s更新心跳，优雅停机时删除
 */

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'
import { Base } from 'moyan-mfw-base/backend'

@Entity('ext_scheduler_executor')
@Index('idx_executor_id', ['executorId'], { unique: true })
@Index('idx_executor_heartbeat', ['lastHeartbeat'])
export class SchedulerExecutor extends Base {
  @PrimaryGeneratedColumn('uuid', { comment: '主键ID' })
  id: string

  @Column({ type: 'varchar', length: 64, comment: '执行器标识(hostname-pid-randomHex)' })
  executorId: string

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '主机名' })
  hostname: string | null

  @Column({ type: 'int', nullable: true, comment: '进程PID' })
  pid: number | null

  @Column({ type: 'datetime', comment: '最后心跳时间' })
  lastHeartbeat: Date
}
