/**
 * @fileoverview 角色权限响应 DTO
 * @description 角色权限配置的响应数据结构
 */
import { PermissionTreesResponseDto } from '@/modules/sys/app-type';
/**
 * 角色权限树响应 DTO
 * @description 包含 PC 权限树和普通权限树
 */
export declare class RolePermissionTreesResponseDto extends PermissionTreesResponseDto {
}
/**
 * 角色权限响应 DTO
 * @description 获取角色权限配置的响应数据
 */
export declare class RolePermissionResponseDto {
    /**
     * 角色 ID
     */
    roleId: string;
    /**
     * 权限树配置
     */
    permissionTrees: RolePermissionTreesResponseDto;
}
