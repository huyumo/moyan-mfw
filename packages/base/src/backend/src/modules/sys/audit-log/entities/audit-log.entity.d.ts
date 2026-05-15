/**
 * @fileoverview 审计日志实体
 * @description 记录系统操作审计日志
 */
import { AuditModule } from '../../../../common/decorators/audit-log.decorator';
/**
 * 审计日志实体
 * @description 记录系统操作审计日志
 */
export declare class AuditLog {
    /**
     * 日志 ID
     */
    id: string;
    /**
     * 所属模块
     */
    module: AuditModule | string;
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
