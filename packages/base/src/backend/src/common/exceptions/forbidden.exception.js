"use strict";
/**
 * @fileoverview 权限不足异常
 * @description 当用户权限不足时抛出的异常
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = void 0;
const common_1 = require("@nestjs/common");
const business_exception_1 = require("./business.exception");
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
class ForbiddenError extends business_exception_1.BusinessException {
    constructor() {
        super('权限不足', common_1.HttpStatus.FORBIDDEN);
    }
}
exports.ForbiddenError = ForbiddenError;
//# sourceMappingURL=forbidden.exception.js.map