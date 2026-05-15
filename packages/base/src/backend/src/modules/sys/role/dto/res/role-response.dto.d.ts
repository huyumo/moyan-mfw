/**
 * @fileoverview 角色响应 DTO
 * @description 角色信息的响应数据结构
 */
/**
 * 角色响应 DTO
 */
export declare class RoleResponseDto {
    /**
     * 角色 ID
     */
    id: string;
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
    roleDesc: string;
    /**
     * 应用类型 ID
     */
    appTypeId: string;
    /**
     * 应用实例 ID
     */
    appId: string;
    /**
     * 是否内置
     */
    isBuiltin: number;
    /**
     * 是否拥有者角色
     */
    isOwner: number;
    /**
     * 角色状态
     */
    roleStatus: number;
    /**
     * 排序号
     */
    sortOrder: number;
    /**
     * 创建时间
     */
    createdAt: Date;
    /**
     * 更新时间
     */
    updateAt: Date;
}
