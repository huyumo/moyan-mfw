/**
 * @fileoverview API 类型定义
 * @description 定义 API 相关的通用类型和接口
 */
/**
 * API 响应接口
 * @description 统一的 API 响应格式
 */
export interface ApiResponse<T = any> {
    /** 状态码 */
    code: number;
    /** 响应数据 */
    data: T | null;
    /** 响应消息 */
    message?: string;
    /** 时间戳 */
    timestamp?: string;
    /** 请求路径 */
    path?: string;
}
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
export declare class ApiResponseUtil {
    /**
     * 成功响应
     * @param data - 响应数据
     * @param message - 响应消息
     * @returns 标准成功响应
     */
    static success<T>(data: T, message?: string): ApiResponse<T>;
    /**
     * 错误响应
     * @param message - 错误消息
     * @param code - 错误码
     * @returns 标准错误响应
     */
    static error(message: string, code?: number): ApiResponse<null>;
}
/**
 * 错误响应接口
 * @description 错误的详细信息
 */
export interface ErrorResponse {
    /** 错误码 */
    code: number;
    /** 错误消息 */
    message: string;
    /** 错误详情 */
    details?: any;
    /** 时间戳 */
    timestamp: string;
    /** 请求路径 */
    path: string;
}
