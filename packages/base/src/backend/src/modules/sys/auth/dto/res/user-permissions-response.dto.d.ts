/**
 * @fileoverview 用户权限菜单响应 DTO
 * @description 用户权限菜单树结构响应
 */
import { PermissionTreeNodeDto } from '@/modules/sys/permission';
/**
 * 用户权限菜单响应 DTO
 * @description 用户在指定应用实例下的权限菜单树
 */
export declare class UserPermissionsResponseDto {
    /**
     * 菜单树
     */
    menuTree: PermissionTreeNodeDto[];
    /**
     * 权限列表（扁平化）
     * @description 用于前端权限判断的扁平化权限列表
     */
    permissions: string[];
    /**
     * 应用类型 ID
     */
    appTypeId: string;
    /**
     * 权限值映射
     * @description 用户权限值映射（permCode → permissionValue）
     */
    permissionValueMap?: Record<string, string>;
}
