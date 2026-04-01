/**
 * @fileoverview 权限不足异常
 * @description 当用户权限不足时抛出的异常
 */

import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

/**
 * 权限不足异常
 * @description 用于标识用户没有执行某个操作的权限
 *
 * @example
 * ```typescript
 * throw new ForbiddenError();
 * // 返回：{ code: 403, message: '权限不足', data: null }
 * ```
 */
export class ForbiddenError extends BusinessException {
  constructor() {
    super('权限不足', HttpStatus.FORBIDDEN);
  }
}
