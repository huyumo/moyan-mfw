/**
 * @fileoverview 审计日志响应 DTO
 * @description 审计日志信息的响应数据结构
 */
import { AuditModule } from '../../../../../common/decorators/audit-log.decorator';
/**
 * 审计日志响应 DTO
 */
export declare class AuditLogResponseDto {
    /**
     * 日志 ID
     */
    id: string;
    /**
     * 所属模块
     */
    module: AuditModule;
    /**
     * 事件名称
     */
    event: string;
    /**
     * 操作人 ID
     */
    operatorId: string;
    /**
     * 操作人名称
     */
    operatorName: string;
    /**
     * 目标 ID
     */
    targetId: string;
    /**
     * 目标类型
     */
    targetType: string;
    /**
     * 描述
     */
    description: string;
    /**
     * 快照
     */
    snapshot: {
        before?: any;
        after?: any;
    };
    /**
     * IP 地址
     */
    ip: string;
    /**
     * User-Agent
     */
    userAgent: string;
    /**
     * 创建时间
     */
    createAt: Date;
}
