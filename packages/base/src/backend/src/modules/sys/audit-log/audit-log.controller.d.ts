/**
 * @fileoverview 审计日志控制器
 * @description 处理审计日志相关 HTTP 请求
 */
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto';
/**
 * 审计日志控制器
 * @description 处理审计日志相关的查询请求
 */
export declare class AuditLogController {
    private auditLogService;
    constructor(auditLogService: AuditLogService);
    /**
     * 查询审计日志列表
     */
    findAll(query: QueryAuditLogDto): Promise<import("../../../common").ApiResponse<import("../../../common").PaginationResult<any>>>;
    /**
     * 根据 ID 查询审计日志
     */
    findById(id: string): Promise<import("../../../common").ApiResponse<import("./entities/audit-log.entity").AuditLog>>;
    /**
     * 根据目标 ID 查询审计日志列表
     */
    findByTargetId(targetId: string): Promise<import("../../../common").ApiResponse<import("./entities/audit-log.entity").AuditLog[]>>;
    /**
     * 根据操作人 ID 查询审计日志列表
     */
    findByOperatorId(operatorId: string): Promise<import("../../../common").ApiResponse<import("./entities/audit-log.entity").AuditLog[]>>;
    /**
     * 删除指定时间之前的审计日志
     */
    deleteBeforeDate(beforeDate: string): Promise<import("../../../common").ApiResponse<{
        deleted: number;
    }>>;
}
