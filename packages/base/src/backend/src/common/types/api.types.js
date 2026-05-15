"use strict";
/**
 * @fileoverview API 类型定义
 * @description 定义 API 相关的通用类型和接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseUtil = void 0;
/**
 * API 响应工具类
 * @description 提供快速构建标准响应的方法
 *
 * @example
 * ```typescript
 * return ApiResponse.success(data);
 * return ApiResponse.error('操作失败');
 * ```
 */
class ApiResponseUtil {
    /**
     * 成功响应
     * @param data - 响应数据
     * @param message - 响应消息
     * @returns 标准成功响应
     */
    static success(data, message = 'success') {
        return {
            code: 0,
            data,
            message,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * 错误响应
     * @param message - 错误消息
     * @param code - 错误码
     * @returns 标准错误响应
     */
    static error(message, code = 50000) {
        return {
            code,
            data: null,
            message,
            timestamp: new Date().toISOString(),
        };
    }
}
exports.ApiResponseUtil = ApiResponseUtil;
//# sourceMappingURL=api.types.js.map