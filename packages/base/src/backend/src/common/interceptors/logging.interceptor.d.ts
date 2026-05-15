/**
 * @fileoverview 日志拦截器
 * @description 拦截请求并记录日志，包括请求参数、响应结果和执行时间
 */
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
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
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
