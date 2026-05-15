/**
 * @fileoverview 审计日志拦截器
 * @description 拦截标记了 @AuditLog 的请求，记录审计日志到数据库
 */

import {
  Injectable,
  Logger,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, from } from 'rxjs';
import { mergeMap, catchError, tap } from 'rxjs/operators';
import {
  AUDIT_LOG,
  AuditLogOptions,
} from '../../decorators/audit-log.decorator';
import { AuditLogService } from '../../../modules/sys/audit-log/audit-log.service';

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
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditLog = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG,
      context.getHandler(),
    ) || this.reflector.get<AuditLogOptions>(
      AUDIT_LOG,
      context.getClass(),
    );

    if (!auditLog) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const now = Date.now();

    return next.handle().pipe(
      mergeMap((response) => {
        const executionTime = Date.now() - now;

        return from(
          this.writeAuditLog(auditLog, user, request, executionTime),
        ).pipe(
          tap(() => {
            this.logger.log(
              `[AUDIT] ${auditLog.module}.${auditLog.event} - ${user?.username || 'anonymous'} - ${executionTime}ms`,
            );
          }),
          catchError((error) => {
            this.logger.error(
              `[AUDIT ERROR] ${auditLog.module}.${auditLog.event} - ${error.message}`,
              error.stack,
            );
            return of(response);
          }),
        );
      }),
    );
  }

  private async writeAuditLog(
    auditLog: AuditLogOptions,
    user: any,
    request: any,
    _executionTime: number,
  ): Promise<void> {
    await this.auditLogService.create({
      module: auditLog.module,
      event: auditLog.event,
      description: auditLog.description || '',
      operatorId: user?.id || 'anonymous',
      operatorName: user?.username || 'anonymous',
      targetType: '',
      ip: request.ip || '',
      userAgent: request.headers['user-agent'] || '',
    });
  }
}
