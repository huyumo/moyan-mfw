/**
 * @fileoverview 未授权异常
 * @description 当用户未登录或 Token 无效时抛出的异常
 */

import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

/**
 * 未授权异常
 * @description 用于标识用户未登录或 Token 无效的情况
 *
 * @example
 * ```typescript
 * throw new UnauthorizedError();
 * // 返回：{ code: 401, message: '未授权，请先登录', data: null }
 * ```
 */
export class UnauthorizedError extends BusinessException {
  constructor(message = '未授权，请先登录') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}
