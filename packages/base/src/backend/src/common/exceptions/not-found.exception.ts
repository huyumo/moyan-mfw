/**
 * @fileoverview 资源不存在异常
 * @description 当请求的资源不存在时抛出的异常
 */

import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

/**
 * 资源不存在异常
 * @description 用于标识请求的资源不存在的情况
 *
 * @example
 * ```typescript
 * throw new NotFoundError('用户');
 * // 返回：{ code: 404, message: '资源不存在：用户', data: null }
 * ```
 */
export class NotFoundError extends BusinessException {
  /**
   * 创建资源不存在异常实例
   * @param resource - 资源名称
   */
  constructor(resource: string) {
    super(`资源不存在：${resource}`, HttpStatus.NOT_FOUND);
  }
}
