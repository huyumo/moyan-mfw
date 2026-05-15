/**
 * @fileoverview 权限池响应 DTO
 * @description 权限池配置的响应数据结构
 */
import { PermissionTreeNodeDto } from '@/modules/sys/permission';
/**
 * 权限树响应 DTO
 * @description 包含 PC 权限树和普通权限树
 */
export declare class PermissionTreesResponseDto {
    /**
     * PC 权限树
     */
    pcTree: PermissionTreeNodeDto[];
    /**
     * 普通权限树
     */
    normalTree: PermissionTreeNodeDto[];
}
/**
 * 权限池响应 DTO
 * @description 获取权限池配置的响应数据
 */
export declare class PermissionPoolResponseDto {
    /**
     * 应用类型 ID
     */
    appTypeId: string;
    /**
     * 权限树配置
     */
    permissionTrees: PermissionTreesResponseDto;
}
/**
 * 更新权限池响应 DTO
 * @description 更新权限池配置的响应数据
 */
export declare class UpdatePermissionPoolResponseDto {
    /**
     * 应用类型 ID
     */
    appTypeId: string;
    /**
     * 更新数量
     */
    updatedCount: number;
}
