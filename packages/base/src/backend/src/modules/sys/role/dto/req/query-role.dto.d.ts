/**
 * @fileoverview 角色查询参数 DTO
 * @description 角色列表查询参数
 */
import { PaginationQueryDto } from '../../../../../common';
/**
 * 角色查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export declare class QueryRoleDto extends PaginationQueryDto {
    /**
     * 角色编码（模糊查询）
     */
    roleCode?: string;
    /**
     * 角色名称（模糊查询）
     */
    roleName?: string;
    /**
     * 角色状态
     */
    roleStatus?: number;
    /**
     * 应用类型 ID
     */
    appTypeId?: string;
    /**
     * 应用 ID
     */
    appId?: string;
    /**
     * 排序字段
     * @default 'sortOrder'
     */
    sortField?: string;
}
