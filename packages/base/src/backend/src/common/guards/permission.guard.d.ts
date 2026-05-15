/**
 * @fileoverview 权限守卫
 * @description 验证用户是否拥有所需的权限（基于位运算），支持多装饰器 OR 检查
 */
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { RolePermission } from '../../modules/sys/role/entities/role-permission.entity';
import { UserRole } from '../../modules/sys/role/entities/user-role.entity';
/**
 * 权限守卫
 * @description 基于位运算验证用户权限，支持 appId 级别的角色作用域过滤
 *
 * **支持多装饰器 OR 检查**：如果一个接口有多个 @RequirePermission 装饰器，
 * 用户只要匹配其中任意一个权限即可访问。
 *
 * @example
 * ```typescript
 * // 在控制器中使用
 * @RequirePermission({ permCode: 'system:user-list' })
 * @RequirePermission({ permCode: 'system:role' })
 * @UseGuards(PermissionGuard)
 * async findAll() {}
 * ```
 */
export declare class PermissionGuard implements CanActivate {
    private reflector;
    private rolePermissionRepository;
    private userRoleRepository;
    constructor(reflector: Reflector, rolePermissionRepository: Repository<RolePermission>, userRoleRepository: Repository<UserRole>);
    canActivate(context: ExecutionContext): Promise<boolean>;
    /**
     * 规范化权限选项，将字符串数组转换为 bigint
     */
    private normalizeOptions;
    /**
     * 解析用户在指定应用实例下的有效角色 ID
     * @description 查询 sys_user_roles 获取该用户在此应用下被分配的角色
     */
    private resolveEffectiveRoleIds;
}
