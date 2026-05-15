/**
 * @fileoverview 创建权限请求 DTO
 * @description 创建权限的请求参数
 */
import { NodeType, ShowMode, PermissionType } from '../../entities/permission.entity';
/**
 * 创建权限请求 DTO
 */
export declare class CreatePermissionDto {
    /**
     * 权限名称
     */
    permName: string;
    /**
     * 权限编码
     */
    permCode: string;
    /**
     * 权限描述
     */
    permDesc?: string;
    /**
     * 权限类型
     */
    permissionType: PermissionType;
    /**
     * 节点类型
     */
    nodeType?: NodeType;
    /**
     * 父权限 ID
     */
    parentId?: string;
    /**
     * 路由路径
     */
    routePath?: string;
    /**
     * 外部链接
     */
    externalUrl?: string;
    /**
     * 图标名称
     */
    iconName?: string;
    /**
     * 排序号
     */
    sortOrder?: number;
    /**
     * 是否可见
     */
    isVisible?: number;
    /**
     * 是否缓存
     */
    isCache?: number;
    /**
     * 显示模式
     */
    showMode?: ShowMode;
    /**
     * 权限状态
     */
    permStatus?: number;
    /**
     * 权限值（位运算）
     */
    permissionValue?: bigint;
}
