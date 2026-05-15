/**
 * @fileoverview 角色实体
 * @description 系统角色实体，用于 RBAC 权限管理
 */
import { Base } from '../../../../common/entities/base.entity';
import type { Permission } from '../../permission/entities/permission.entity';
/**
 * 角色实体类
 * @description 系统角色表，用于 RBAC 权限管理
 */
export declare class Role extends Base {
    /**
     * 角色 ID
     * @description 主键，UUID 格式
     */
    id: string;
    /**
     * 应用实例 ID
     * @description 关联的应用实例 ID，为空时表示全局角色
     */
    appId: string;
    /**
     * 应用类型 ID
     * @description 关联的应用类型 ID，为空时表示全局角色
     */
    appTypeId: string;
    /**
     * 角色名称
     * @description 角色名称 - 用于展示的角色别名
     */
    roleName: string;
    /**
     * 角色编码
     * @description 角色编码 - 角色的唯一标识，全局唯一
     */
    roleCode: string;
    /**
     * 角色描述
     * @description 角色描述信息
     */
    roleDesc: string;
    /**
     * 是否内置
     * @description 是否系统内置角色 - 内置角色不允许删除
     */
    isBuiltin: number;
    /**
     * 是否拥有者角色
     * @description 是否拥有者角色 - 拥有者拥有应用的全部权限
     */
    isOwner: number;
    /**
     * 角色状态
     * @description 状态 - 1:启用 0:禁用 - 控制角色是否可用
     */
    roleStatus: number;
    /**
     * 排序
     * @description 角色排序号，数值越小越靠前
     */
    sortOrder: number;
    /**
     * 关联权限
     * @description 角色关联的所有权限，通过 sys_role_permissions 关联表管理
     */
    permissions: Permission[];
}
