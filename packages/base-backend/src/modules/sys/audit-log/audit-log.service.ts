/**
 * @fileoverview 审计日志服务
 * @description 处理审计日志相关业务逻辑
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogDto } from './dto';
import { PaginationHelper, PaginationResult, QueryBuilderHelper } from '../../../common';

/**
 * 审计日志服务
 */
@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * 创建审计日志
   * @param log - 审计日志数据
   * @returns 创建的审计日志
   */
  async create(log: Partial<AuditLog>): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(log);
    return this.auditLogRepository.save(auditLog);
  }

  /**
   * 批量创建审计日志
   * @param logs - 审计日志数据列表
   * @returns 创建的审计日志列表
   */
  async batchCreate(logs: Partial<AuditLog>[]): Promise<AuditLog[]> {
    return this.auditLogRepository.save(logs.map(log => this.auditLogRepository.create(log)));
  }

  /**
   * 根据 ID 查询审计日志
   * @param id - 审计日志 ID
   * @returns 审计日志信息
   */
  async findById(id: string): Promise<AuditLog> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id },
    });

    if (!auditLog) {
      throw new NotFoundException('审计日志不存在');
    }

    return auditLog;
  }

  /**
   * 查询审计日志列表（分页）
   * @param query - 查询参数
   * @returns 分页结果
   */
  async findAll(query: QueryAuditLogDto): Promise<PaginationResult<AuditLog>> {
    const qb = this.auditLogRepository.createQueryBuilder('auditLog');

    // 使用 QueryBuilderHelper 构建查询条件（支持 10+ 条件不臃肿）
    QueryBuilderHelper.applyConditions(qb, [
      { field: 'auditLog.module', value: query.module, operator: '=' },
      { field: 'auditLog.event', value: query.event, operator: 'like' },
      { field: 'auditLog.operatorId', value: query.operatorId, operator: '=' },
      { field: 'auditLog.targetId', value: query.targetId, operator: '=' },
      { field: 'auditLog.createAt', value: query.startTime, operator: '>=' },
      { field: 'auditLog.createAt', value: query.endTime, operator: '<=' },
    ]);

    // 使用 PaginationHelper 执行分页查询
    return PaginationHelper.executeQuery(
      qb.orderBy('auditLog.createAt', 'DESC'),
      query,
    );
  }

  /**
   * 根据目标 ID 查询审计日志列表
   * @param targetId - 目标 ID
   * @returns 审计日志列表
   */
  async findByTargetId(targetId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { targetId },
      order: {
        createAt: 'DESC',
      },
    });
  }

  /**
   * 根据操作人 ID 查询审计日志列表
   * @param operatorId - 操作人 ID
   * @returns 审计日志列表
   */
  async findByOperatorId(operatorId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { operatorId },
      order: {
        createAt: 'DESC',
      },
    });
  }

  /**
   * 删除指定时间之前的审计日志
   * @param beforeDate - 删除该日期之前的日志
   * @returns 删除的数量
   */
  async deleteBeforeDate(beforeDate: Date): Promise<number> {
    const result = await this.auditLogRepository
      .createQueryBuilder('auditLog')
      .delete()
      .where('createAt < :beforeDate', { beforeDate })
      .execute();

    return result.affected || 0;
  }
}
