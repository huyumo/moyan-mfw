/**
 * @fileoverview 更新权限请求 DTO
 * @description 更新权限的请求参数
 */
import { NodeType, ShowMode } from '../../entities/permission.entity';
/**
 * 更新权限请求 DTO
 */
export declare class UpdatePermissionDto {
    /**
     * 权限名称
     */
    permName?: string;
    /**
     * 权限编码
     */
    permCode?: string;
    /**
     * 权限描述
     */
    permDesc?: string;
    /**
     * 节点类型
     */
    nodeType?: NodeType;
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
