/**
 * @fileoverview 审计日志拦截器
 * @description 拦截标记了 @AuditLog 的请求，记录审计日志到数据库
 */
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AuditLogService } from '../../modules/sys/audit-log/audit-log.service';
/**
 * 审计日志拦截器
 * @description 记录操作审计日志，包括操作人、操作时间、操作内容等，并写入数据库
 *
 * @example
 * ```typescript
 * // 在模块中通过 APP_INTERCEPTOR 注册
 * providers: [
 *   {
 *     provide: APP_INTERCEPTOR,
 *     useClass: AuditInterceptor,
 *   },
 * ],
 * ```
 */
export declare class AuditInterceptor implements NestInterceptor {
    private reflector;
    private auditLogService;
    private readonly logger;
    constructor(reflector: Reflector, auditLogService: AuditLogService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private writeAuditLog;
}
