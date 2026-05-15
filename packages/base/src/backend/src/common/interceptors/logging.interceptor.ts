/**
 * @fileoverview 日志拦截器
 * @description 拦截请求并记录日志，包括请求参数、响应结果和执行时间
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 日志拦截器
 * @description 记录每个请求的详细信息，包括执行时间和响应状态
 *
 * @example
 * ```typescript
 * // 在模块中注册
 * providers: [
 *   {
 *     provide: APP_INTERCEPTOR,
 *     useClass: LoggingInterceptor,
 *   },
 * ],
 * ```
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const executionTime = Date.now() - now;
        this.logger.log(
          `${method} ${url} - ${response.statusCode} - ${executionTime}ms`,
        );
      }),
    );
  }
}
