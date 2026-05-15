/**
 * @fileoverview 审计日志查询参数 DTO
 * @description 审计日志列表查询参数
 */
import { AuditModule } from '../../../../../common/decorators/audit-log.decorator';
import { PaginationQueryDto } from '../../../../../common';
/**
 * 审计日志查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export declare class QueryAuditLogDto extends PaginationQueryDto {
    /**
     * 所属模块
     */
    module?: AuditModule;
    /**
     * 事件名称
     */
    event?: string;
    /**
     * 操作人 ID
     */
    operatorId?: string;
    /**
     * 目标 ID
     */
    targetId?: string;
    /**
     * 开始时间
     */
    startTime?: string;
    /**
     * 结束时间
     */
    endTime?: string;
    /**
     * 排序字段
     * @default 'createAt'
     */
    sortField?: string;
}
