"use strict";
/**
 * @fileoverview 资源不存在异常
 * @description 当请求的资源不存在时抛出的异常
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
const common_1 = require("@nestjs/common");
const business_exception_1 = require("./business.exception");
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
class NotFoundError extends business_exception_1.BusinessException {
    /**
     * 创建资源不存在异常实例
     * @param resource - 资源名称
     */
    constructor(resource) {
        super(`资源不存在：${resource}`, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=not-found.exception.js.map