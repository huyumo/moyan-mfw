/**
 * @fileoverview 用户角色关联实体
 * @description 用户与角色的多对多关联关系，通过 appId 实现应用实例级隔离
 */
import { User } from '../../user/entities/user.entity';
import { Role } from './role.entity';
/**
 * 用户角色关联实体
 * @description 记录用户在指定应用实例下的角色分配，每个 UserRole 必须绑定到具体应用实例
 */
export declare class UserRole {
    /**
     * 主键 ID
     */
    id: string;
    /**
     * 用户 ID
     */
    userId: string;
    /**
     * 用户
     */
    user: User;
    /**
     * 角色 ID
     */
    roleId: string;
    /**
     * 角色
     */
    role: Role;
    /**
     * 应用实例 ID
     * @description 角色分配所属的应用实例，每个 UserRole 必须绑定到一个具体的应用实例
     */
    appId: string;
}
