/**
 * @fileoverview 全局异常过滤器
 * @description 统一处理所有未被捕获的异常，返回标准错误响应格式
 */
import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
/**
 * 全局异常过滤器
 * @description 统一处理所有异常，记录日志并返回标准错误响应
 *
 * @example
 * ```typescript
 * // 在 main.ts 中全局注册
 * app.useGlobalFilters(new AllExceptionsFilter());
 * ```
 */
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
}
