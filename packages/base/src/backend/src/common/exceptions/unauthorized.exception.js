"use strict";
/**
 * @fileoverview 未授权异常
 * @description 当用户未登录或 Token 无效时抛出的异常
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = void 0;
const common_1 = require("@nestjs/common");
const business_exception_1 = require("./business.exception");
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
class UnauthorizedError extends business_exception_1.BusinessException {
    constructor(message = '未授权，请先登录') {
        super(message, common_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.UnauthorizedError = UnauthorizedError;
//# sourceMappingURL=unauthorized.exception.js.map