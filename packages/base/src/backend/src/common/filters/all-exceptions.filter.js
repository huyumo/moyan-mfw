"use strict";
/**
 * @fileoverview 全局异常过滤器
 * @description 统一处理所有未被捕获的异常，返回标准错误响应格式
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const not_found_exception_1 = require("../exceptions/not-found.exception");
/**
 * 获取 HTTP 状态码（确保在有效范围内）
 */
function getValidHttpStatus(status) {
    // HTTP 状态码有效范围：100-599
    if (status >= 100 && status <= 599) {
        return status;
    }
    // 自定义错误码映射到标准 HTTP 状态码
    if (status >= 40000 && status < 41000)
        return common_1.HttpStatus.UNAUTHORIZED;
    if (status >= 42000 && status < 43000)
        return common_1.HttpStatus.BAD_REQUEST;
    if (status >= 43000 && status < 44000)
        return common_1.HttpStatus.FORBIDDEN;
    if (status >= 44000 && status < 45000)
        return common_1.HttpStatus.NOT_FOUND;
    return common_1.HttpStatus.BAD_REQUEST;
}
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
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        // 判断异常类型
        let httpStatus; // HTTP 状态码（用于 response.status()）
        let code; // 业务错误码（用于返回给客户端）
        let message; // 错误消息（可能是 bigint）
        let details;
        if (exception instanceof common_1.HttpException) {
            // HTTP 异常（包括 BusinessException）
            const exceptionStatus = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            // 如果是验证错误 (BadRequestException)，提取 details
            if (exception instanceof common_1.BadRequestException && exceptionResponse?.message) {
                httpStatus = common_1.HttpStatus.BAD_REQUEST;
                code = 10001; // 参数验证错误码
                message = '参数验证失败';
                // 处理验证错误消息数组
                if (Array.isArray(exceptionResponse.message)) {
                    details = exceptionResponse.message.map((msg) => {
                        // 尝试验证错误格式："property must be a string" 或 "password must be a string"
                        const match = msg.match(/^(\w+)\s+must\s+/i);
                        if (match) {
                            return { field: match[1], message: msg };
                        }
                        // 中文错误格式：尝试提取字段名
                        const zhMatch = msg.match(/^([\u4e00-\u9fa5]+[a-zA-Z]*[0-9]*)[ 长度]/);
                        if (zhMatch) {
                            return { field: zhMatch[1], message: msg };
                        }
                        // 无法提取字段名，使用 message 作为 field
                        return { field: 'password', message: msg };
                    });
                }
                else {
                    details = [exceptionResponse.message];
                }
            }
            else if (exception instanceof common_1.ConflictException) {
                // 冲突错误（如用户名已存在、应用编码已存在）
                httpStatus = common_1.HttpStatus.CONFLICT;
                code = 10002; // 资源冲突错误码
                message = exceptionResponse.message || '资源冲突';
            }
            else if (exception instanceof not_found_exception_1.NotFoundError) {
                // 资源未找到错误（自定义 NotFoundError）
                httpStatus = common_1.HttpStatus.NOT_FOUND;
                code = 10004; // 资源未找到错误码
                message = exceptionResponse.message || '资源不存在';
            }
            else if (exception instanceof common_1.NotFoundException) {
                // 未找到资源
                httpStatus = common_1.HttpStatus.NOT_FOUND;
                code = 10004; // 资源未找到错误码
                message = exceptionResponse.message || '资源不存在';
            }
            else if (exception instanceof common_1.ForbiddenException) {
                // 禁止访问
                httpStatus = common_1.HttpStatus.FORBIDDEN;
                code = 10003; // 禁止访问错误码
                message = exceptionResponse.message || '无权限访问';
            }
            else if (exception instanceof common_1.UnauthorizedException) {
                // 未授权
                httpStatus = common_1.HttpStatus.UNAUTHORIZED;
                code = 401; // 未授权错误码（与 HTTP 状态码一致）
                message = exceptionResponse.message || '未授权访问';
            }
            else {
                // 其他 HTTP 异常（包括 BusinessException）
                httpStatus = getValidHttpStatus(exceptionStatus);
                code = exceptionResponse.code || exceptionStatus;
                message = exceptionResponse.message || exception.message;
                details = exceptionResponse.details;
            }
        }
        else if (exception instanceof Error) {
            // 普通错误
            httpStatus = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            code = 50000;
            message = exception.message;
        }
        else {
            // 未知错误
            httpStatus = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            code = 50000;
            message = '服务器内部错误';
        }
        // 记录错误日志
        if (httpStatus >= 500) {
            // 服务器错误，记录完整堆栈
            this.logger.error(`[${request.method}] ${request.url} - ${httpStatus}: ${message}`, exception instanceof Error ? exception.stack : '');
        }
        else {
            // 客户端错误，记录简要信息
            this.logger.warn(`[${request.method}] ${request.url} - ${httpStatus}: ${message}`);
        }
        // 处理异常中的 bigint 值（避免 JSON 序列化错误）
        let safeMessage = message;
        let safeDetails = details;
        if (typeof message === 'bigint') {
            safeMessage = message.toString();
        }
        if (safeDetails && typeof safeDetails === 'object') {
            try {
                safeDetails = JSON.parse(JSON.stringify(safeDetails, (key, value) => typeof value === 'bigint' ? value.toString() : value));
            }
            catch {
                safeDetails = null;
            }
        }
        // 返回统一错误响应格式
        const errorResponse = {
            code,
            message: safeMessage,
            data: null,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        // 如果有 details，添加到响应中
        if (safeDetails) {
            errorResponse.details = safeDetails;
        }
        response.status(httpStatus).json(errorResponse);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map