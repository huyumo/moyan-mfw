/**
 * @fileoverview 审计日志服务
 * @description 处理审计日志相关业务逻辑
 */
import { Repository, DataSource } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogDto } from './dto';
import { PaginationResult } from '../../../common';
/**
 * 审计日志服务
 */
export declare class AuditLogService {
    private auditLogRepository;
    private dataSource;
    constructor(auditLogRepository: Repository<AuditLog>, dataSource: DataSource);
    /**
     * 创建审计日志
     * @param log - 审计日志数据
     * @returns 创建的审计日志
     */
    create(log: Partial<AuditLog>): Promise<AuditLog>;
    /**
     * 批量创建审计日志
     * @param logs - 审计日志数据列表
     * @returns 创建的审计日志列表
     */
    batchCreate(logs: Partial<AuditLog>[]): Promise<AuditLog[]>;
    /**
     * 根据 ID 查询审计日志
     * @param id - 审计日志 ID
     * @returns 审计日志信息
     */
    findById(id: string): Promise<AuditLog>;
    /**
     * 查询审计日志列表（分页）
     * @param query - 查询参数
     * @returns 分页结果
     */
    findAll(query: QueryAuditLogDto): Promise<PaginationResult<any>>;
    /**
     * 根据目标 ID 查询审计日志列表
     * @param targetId - 目标 ID
     * @returns 审计日志列表
     */
    findByTargetId(targetId: string): Promise<AuditLog[]>;
    /**
     * 根据操作人 ID 查询审计日志列表
     * @param operatorId - 操作人 ID
     * @returns 审计日志列表
     */
    findByOperatorId(operatorId: string): Promise<AuditLog[]>;
    /**
     * 删除指定时间之前的审计日志
     * @param beforeDate - 删除该日期之前的日志
     * @returns 删除的数量
     */
    deleteBeforeDate(beforeDate: Date): Promise<number>;
}
