/**
 * @fileoverview 更新角色请求 DTO
 * @description 更新角色的请求参数
 */
/**
 * 更新角色请求 DTO
 */
export declare class UpdateRoleDto {
    /**
     * 角色名称
     */
    roleName?: string;
    /**
     * 角色描述
     */
    roleDesc?: string;
    /**
     * 排序号
     */
    sortOrder?: number;
    /**
     * 角色状态 (1:启用 0:禁用)
     */
    roleStatus?: number;
}
