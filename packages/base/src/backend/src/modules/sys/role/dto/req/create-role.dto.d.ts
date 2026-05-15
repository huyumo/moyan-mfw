/**
 * @fileoverview 创建角色请求 DTO
 * @description 创建角色的请求参数
 */
/**
 * 创建角色请求 DTO
 */
export declare class CreateRoleDto {
    /**
     * 角色名称
     */
    roleName: string;
    /**
     * 角色编码
     */
    roleCode: string;
    /**
     * 角色描述
     */
    roleDesc?: string;
    /**
     * 应用类型 ID
     */
    appTypeId?: string;
    /**
     * 应用实例 ID
     */
    appId?: string;
    /**
     * 排序号
     */
    sortOrder?: number;
    /**
     * 是否内置
     */
    isBuiltin?: number;
}
