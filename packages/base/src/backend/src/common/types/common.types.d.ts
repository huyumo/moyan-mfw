/**
 * @fileoverview 通用类型定义
 * @description 定义项目通用的类型和接口
 */
/**
 * 用户信息接口
 * @description 请求中注入的用户信息
 */
export interface UserInfo {
    /** 用户 ID */
    id: string;
    /** 用户名 */
    username: string;
    /** 角色 ID 列表 */
    roleIds?: string[];
}
/**
 * 分页参数接口
 * @description 通用的分页请求参数
 */
export interface PageQuery {
    /** 当前页码，从 1 开始 */
    page: number;
    /** 每页数量 */
    pageSize: number;
    /** 排序字段 */
    sortField?: string;
    /** 排序方向 */
    sortOrder?: 'ASC' | 'DESC';
}
/**
 * 分页结果接口
 * @description 通用的分页响应结果
 */
export interface PageResult<T> {
    /** 数据列表 */
    list: T[];
    /** 总数 */
    total: number;
    /** 当前页码 */
    page: number;
    /** 每页数量 */
    pageSize: number;
    /** 总页数 */
    totalPages: number;
}
/**
 * 通用选项接口
 * @description 通用的配置选项
 */
export interface CommonOptions<T = any> {
    /** 是否启用缓存 */
    cacheEnabled?: boolean;
    /** 缓存 TTL（秒） */
    cacheTTL?: number;
    /** 额外选项 */
    extra?: T;
}
