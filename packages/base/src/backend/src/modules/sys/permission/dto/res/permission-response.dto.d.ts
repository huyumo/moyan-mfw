/**
 * @fileoverview 权限响应 DTO
 * @description 权限信息的响应数据结构
 */
import { PermissionType, NodeType, ShowMode } from '../../entities/permission.entity';
/**
 * 权限树节点 DTO
 * 用于返回树形结构的权限数据
 */
export declare class PermissionTreeNodeDto {
    /**
     * 权限 ID
     */
    id: string;
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
    nodeType: NodeType;
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
    sortOrder: number;
    /**
     * 是否可见
     */
    isVisible: number;
    /**
     * 是否缓存
     */
    isCache: number;
    /**
     * 显示模式
     */
    showMode: ShowMode;
    /**
     * 权限状态
     */
    permStatus: number;
    /**
     * 是否选中
     */
    checked: boolean;
    /**
     * 是否自动同步
     */
    isAutoSync?: number;
    /**
     * 权限值（位运算）
     */
    permissionValue?: string;
    /**
     * 父权限值（位运算）
     */
    parentPermissionValue?: string;
    /**
     * 子权限列表
     */
    children?: PermissionTreeNodeDto[];
    /**
     * 创建时间
     */
    createdAt?: Date;
    /**
     * 更新时间
     */
    updateAt?: Date;
}
/**
 * 权限响应 DTO
 */
export declare class PermissionResponseDto {
    /**
     * 权限 ID
     */
    id: string;
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
    permDesc: string;
    /**
     * 权限类型
     */
    permissionType: PermissionType;
    /**
     * 节点类型
     */
    nodeType: NodeType;
    /**
     * 父权限 ID
     */
    parentId: string;
    /**
     * 路由路径
     */
    routePath: string;
    /**
     * 外部链接
     */
    externalUrl: string;
    /**
     * 图标名称
     */
    iconName: string;
    /**
     * 排序号
     */
    sortOrder: number;
    /**
     * 是否可见
     */
    isVisible: number;
    /**
     * 是否缓存
     */
    isCache: number;
    /**
     * 显示模式
     */
    showMode: ShowMode;
    /**
     * 权限状态
     */
    permStatus: number;
    /**
     * 权限值（位运算）
     */
    permissionValue: string;
    /**
     * 创建时间
     */
    createdAt: Date;
    /**
     * 更新时间
     */
    updateAt: Date;
}
