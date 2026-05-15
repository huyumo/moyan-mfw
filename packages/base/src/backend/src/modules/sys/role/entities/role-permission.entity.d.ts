/**
 * @fileoverview 角色权限关联实体
 * @description 角色与权限的多对多关联关系
 */
import { Role } from './role.entity';
import { Permission } from '../../permission/entities/permission.entity';
/**
 * 角色权限关联实体
 * @description 记录角色与权限的关联关系及权限值
 */
export declare class RolePermission {
    /**
     * 主键 ID
     */
    id: string;
    /**
     * 角色 ID
     */
    roleId: string;
    /**
     * 角色
     */
    role: Role;
    /**
     * 权限 ID
     */
    permissionId: string;
    /**
     * 权限
     */
    permission: Permission;
    /**
     * 权限值
     * @description 位运算权限值，定义角色在此权限点上的具体操作权限
     */
    permissionValue: bigint;
}
