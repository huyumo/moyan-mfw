/**
 * @fileoverview 权限查询参数 DTO
 * @description 权限列表查询参数
 */
import { PermissionType, NodeType } from '../../entities/permission.entity';
import { PaginationQueryDto } from '../../../../../common';
/**
 * 权限查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
export declare class QueryPermissionDto extends PaginationQueryDto {
    /**
     * 应用类型 ID
     */
    appTypeId?: string;
    /**
     * 权限名称（模糊查询）
     */
    permName?: string;
    /**
     * 权限编码（模糊查询）
     */
    permCode?: string;
    /**
     * 权限类型
     */
    permissionType?: PermissionType;
    /**
     * 节点类型
     */
    nodeType?: NodeType;
    /**
     * 父权限 ID
     */
    parentId?: string;
    /**
     * 排序字段
     * @default 'sortOrder'
     */
    sortField?: string;
}
