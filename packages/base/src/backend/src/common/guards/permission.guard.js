"use strict";
/**
 * @fileoverview 权限守卫
 * @description 验证用户是否拥有所需的权限（基于位运算），支持多装饰器 OR 检查
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const require_permission_decorator_1 = require("../decorators/require-permission.decorator");
const skip_permission_decorator_1 = require("../decorators/skip-permission.decorator");
const permissions_1 = require("../constants/permissions");
const role_permission_entity_1 = require("../../modules/sys/role/entities/role-permission.entity");
const user_role_entity_1 = require("../../modules/sys/role/entities/user-role.entity");
const app_id_decorator_1 = require("../decorators/app-id.decorator");
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
let PermissionGuard = class PermissionGuard {
    reflector;
    rolePermissionRepository;
    userRoleRepository;
    constructor(reflector, rolePermissionRepository, userRoleRepository) {
        this.reflector = reflector;
        this.rolePermissionRepository = rolePermissionRepository;
        this.userRoleRepository = userRoleRepository;
    }
    async canActivate(context) {
        const skipPermission = this.reflector.getAllAndOverride(skip_permission_decorator_1.SKIP_PERMISSION_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skipPermission) {
            return true;
        }
        // 获取所有 @RequirePermission 装饰器（支持多次注解）
        const requirePermissions = this.reflector.getAllAndOverride(require_permission_decorator_1.REQUIRE_PERMISSION, [context.getHandler(), context.getClass()]);
        // 转换为数组（getAllAndOverride 可能返回单个对象或数组）
        const permissionsArray = Array.isArray(requirePermissions)
            ? requirePermissions
            : (requirePermissions ? [requirePermissions] : []);
        // 如果没有要求权限，直接放行
        if (permissionsArray.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('未授权');
        }
        // 检查用户是否是开发者（拥有全部权限）
        if (user.isDeveloper === 1) {
            return true;
        }
        // 检查用户角色是否包含所需权限
        if (!user.roleIds || user.roleIds.length === 0) {
            throw new common_1.ForbiddenException('权限不足');
        }
        // 提取当前请求的 appId，按应用实例过滤有效角色
        const appId = (0, app_id_decorator_1.resolveAppId)(request);
        const effectiveRoleIds = appId
            ? await this.resolveEffectiveRoleIds(user.id, appId)
            : user.roleIds;
        // 查询用户当前应用下的有效角色权限
        const userRolePermissions = effectiveRoleIds.length > 0
            ? await this.rolePermissionRepository.find({
                where: { roleId: (0, typeorm_2.In)(effectiveRoleIds) },
                relations: ['permission'],
            })
            : [];
        // 构建用户权限映射：permCode → permissionValue (位运算合并)
        const userPermissionMap = new Map();
        for (const rp of userRolePermissions) {
            if (rp.permission && rp.permission.permStatus === 1) {
                const permCode = rp.permission.permCode;
                // TypeORM 返回的 permissionValue 可能是 number/string/bigint，统一转换为 bigint
                const rpPermValue = typeof rp.permissionValue === 'string'
                    ? BigInt(rp.permissionValue)
                    : typeof rp.permissionValue === 'number'
                        ? BigInt(rp.permissionValue)
                        : rp.permissionValue;
                const existing = userPermissionMap.get(permCode);
                if (existing) {
                    // 合并权限值（位运算 OR）
                    userPermissionMap.set(permCode, existing | rpPermValue);
                }
                else {
                    userPermissionMap.set(permCode, rpPermValue);
                }
            }
        }
        // 多装饰器 OR 检查：只要匹配其中一个权限即可
        for (const options of permissionsArray) {
            const { permCode, permissionValue } = this.normalizeOptions(options);
            if (!permissionValue) {
                // 没有指定 permissionValue，只检查 permCode
                if (userPermissionMap.has(permCode)) {
                    return true;
                }
            }
            else {
                // 检查用户是否有该 permCode 的权限
                const userValue = userPermissionMap.get(permCode);
                if (!userValue) {
                    continue; // 用户没有该 permCode 的权限，检查下一个装饰器
                }
                // 位运算检查：用户权限是否包含所需权限
                // 公式：(userValue & requiredValue) === requiredValue
                // 或者至少包含一位：(userValue & requiredValue) !== 0n
                if ((userValue & permissionValue) !== 0n) {
                    return true; // 用户拥有至少一位匹配的权限
                }
            }
        }
        // 所有装饰器都未匹配通过
        throw new common_1.ForbiddenException('权限不足');
    }
    /**
     * 规范化权限选项，将字符串数组转换为 bigint
     */
    normalizeOptions(options) {
        // 字符串数组转换为 bigint
        const permissionValue = (0, permissions_1.buildPerValue)(options.permissionValue || []);
        return {
            permCode: options.permCode,
            permissionValue,
        };
    }
    /**
     * 解析用户在指定应用实例下的有效角色 ID
     * @description 查询 sys_user_roles 获取该用户在此应用下被分配的角色
     */
    async resolveEffectiveRoleIds(userId, appId) {
        const userRoles = await this.userRoleRepository.find({
            where: { userId, appId },
        });
        return userRoles.map((ur) => ur.roleId);
    }
};
exports.PermissionGuard = PermissionGuard;
exports.PermissionGuard = PermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(2, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __metadata("design:paramtypes", [core_1.Reflector,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PermissionGuard);
//# sourceMappingURL=permission.guard.js.map