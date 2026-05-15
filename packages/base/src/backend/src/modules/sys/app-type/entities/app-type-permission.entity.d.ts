/**
 * @fileoverview 应用类型权限池实体
 * @description 定义应用类型可用的权限池，角色权限只能从权限池中选择
 */
import { AppType } from './app-type.entity';
import { Permission } from '../../permission/entities/permission.entity';
/**
 * 应用类型权限池实体
 * @description 应用类型与权限的多对多关联，定义应用类型可用的权限池
 *
 * @example
 * ```typescript
 * // 权限池配置
 * const appTypePermission = new AppTypePermissionEntity();
 * appTypePermission.appTypeId = 'app-type-uuid';
 * appTypePermission.permissionId = 'permission-uuid';
 * appTypePermission.permissionValue = 3n; // ADD|EDIT
 * ```
 */
export declare class AppTypePermissionEntity {
    /**
     * 主键 ID
     * @description UUID 格式的主键
     */
    id: string;
    /**
     * 应用类型 ID
     * @description 外键，关联 sys_app_types 表
     */
    appTypeId: string;
    /**
     * 应用类型
     * @description 关联的应用类型对象
     */
    appType: AppType;
    /**
     * 权限 ID
     * @description 外键，关联 sys_permissions 表
     */
    permissionId: string;
    /**
     * 权限
     * @description 关联的权限对象
     */
    permission: Permission;
    /**
     * 权限值
     * @description 位运算权限值，是 Permission.permissionValue 的子集
     * 用于定义应用类型对该权限的可用操作范围
     */
    permissionValue: bigint;
}
