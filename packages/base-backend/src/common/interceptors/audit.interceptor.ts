/**
 * @fileoverview 审计日志拦截器
 * @description 拦截标记了 @AuditLog 的请求，记录审计日志
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  AUDIT_LOG,
  AuditLogOptions,
  AuditModule,
} from '../decorators/audit-log.decorator';

/**
 * 审计日志拦截器
 * @description 记录操作审计日志，包括操作人、操作时间、操作内容等
 *
 * @example
 * ```typescript
 * // 在模块中注册
 * providers: [
 *   {
 *     provide: APP_INTERCEPTOR,
 *     useClass: AuditInterceptor,
 *   },
 * ],
 * ```
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditLog = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG,
      context.getHandler(),
    );

    // 如果没有标记 @AuditLog，直接跳过
    if (!auditLog) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user = request.user;

    const logData = {
      module: auditLog.module,
      event: auditLog.event,
      description: auditLog.description,
      operatorId: user?.id || 'anonymous',
      operatorName: user?.username || 'anonymous',
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
    };

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const executionTime = Date.now() - now;
        // TODO: 将审计日志写入数据库
        // this.auditLogService.create(logData);

        this.logger.log(
          `[AUDIT] ${auditLog.module}.${auditLog.event} - ${user?.username || 'anonymous'} - ${executionTime}ms`,
        );
      }),
    );
  }
}
