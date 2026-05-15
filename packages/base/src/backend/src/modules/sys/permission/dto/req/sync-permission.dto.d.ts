/**
 * @fileoverview 权限同步请求 DTO
 * @description 同步路由到权限的请求参数
 *
 * 注意：同步路由只是将路由转换为 Permission 实体数据，不涉及应用类型绑定。
 * 应用类型绑定是在"应用类型管理页面"的"权限池配置"中完成的。
 */
/**
 * 路由节点 DTO
 */
export declare class RouteNodeDto {
    /**
     * 路由路径
     */
    path: string;
    /**
     * 路由名称
     */
    name: string;
    /**
     * 权限值（位运算字符串，如 "6"）
     */
    permissionValue?: string;
    /**
     * 子路由
     */
    children?: RouteNodeDto[];
}
/**
 * 权限同步请求 DTO
 */
export declare class SyncPermissionDto {
    /**
     * 路由树结构
     */
    routes: RouteNodeDto[];
}
