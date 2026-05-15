/**
 * @fileoverview 权限不足异常
 * @description 当用户权限不足时抛出的异常
 */
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
export declare class ForbiddenError extends BusinessException {
    constructor();
}
