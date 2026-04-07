/**
 * @fileoverview 响应转换拦截器
 * @description 统一转换响应格式，将数据封装到标准响应结构中
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { classToPlain } from 'class-transformer';

/**
 * 标准响应接口
 */
export interface Response<T> {
  code: number;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * 响应转换拦截器
 * @description 将响应数据统一封装为标准格式
 *
 * @example
 * ```typescript
 * // 标准响应格式
 * {
 *   code: 0,
 *   data: { ... },
 *   message: 'success',
 *   timestamp: '2026-03-31T12:00:00.000Z'
 * }
 * ```
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // 使用 classToPlain 转换 DTO，触发 @Transform 装饰器
        const plainData = classToPlain(data);

        // 如果数据已经是标准响应格式（包含 code 字段），直接返回
        if (plainData && typeof plainData === 'object' && 'code' in plainData) {
          return plainData as Response<T>;
        }
        // 否则封装为标准响应格式
        const response: Response<T> = {
          code: 0,
          data: plainData as T,
          message: 'success',
          timestamp: new Date().toISOString(),
        };
        return response;
      }),
    );
  }
}
