"use strict";
/**
 * @fileoverview 认证服务
 * @description 处理用户认证相关业务逻辑
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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../user/entities/user.entity");
const user_role_entity_1 = require("../role/entities/user-role.entity");
const role_entity_1 = require("../role/entities/role.entity");
const permission_entity_1 = require("../permission/entities/permission.entity");
const role_permission_entity_1 = require("../role/entities/role-permission.entity");
const app_type_permission_entity_1 = require("../app-type/entities/app-type-permission.entity");
const encrypt_1 = require("../../../common/utils/encrypt");
const business_exception_1 = require("../../../common/exceptions/business.exception");
const encrypt_2 = require("../../../common/utils/encrypt");
const sql_util_1 = require("../../../common/utils/sql.util");
const tree_util_1 = require("@/common/utils/tree.util");
/**
 * 认证服务
 */
let AuthService = class AuthService {
    entityManager;
    dataSource;
    userRepository;
    userRoleRepository;
    roleRepository;
    permissionRepository;
    rolePermissionRepository;
    appTypePermissionRepository;
    jwtService;
    configService;
    constructor(entityManager, dataSource, userRepository, userRoleRepository, roleRepository, permissionRepository, rolePermissionRepository, appTypePermissionRepository, jwtService, configService) {
        this.entityManager = entityManager;
        this.dataSource = dataSource;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.appTypePermissionRepository = appTypePermissionRepository;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    getJwtConfig() {
        return this.configService.get('jwt', {
            expiresIn: 7200,
            refreshExpiresIn: 7200,
        });
    }
    /**
     * 用户登录
     * @param loginDto - 登录请求参数
     * @returns 登录响应（包含 Token）
     */
    async login(loginDto) {
        const { username, password } = loginDto;
        // 查找用户
        const user = await this.userRepository.findOne({
            where: { username },
        });
        if (!user) {
            // 用户不存在，返回 401 错误码
            throw new business_exception_1.BusinessException('用户名或密码错误', 401);
        }
        // 检查用户状态
        if (user.userStatus !== 1) {
            throw new business_exception_1.BusinessException('用户已被禁用', 403);
        }
        // 验证密码
        const isPasswordValid = await (0, encrypt_1.verifyPassword)(password, user.password);
        if (!isPasswordValid) {
            // 密码错误，返回 401 错误码
            throw new business_exception_1.BusinessException('用户名或密码错误', 401);
        }
        // 查询用户角色
        const userRoles = await this.userRoleRepository.find({
            where: { userId: user.id },
            relations: ['role'],
        });
        // 生成 Token
        const payload = {
            sub: user.id,
            username: user.username,
            roleIds: userRoles.map((ur) => ur.roleId),
        };
        const accessToken = await this.jwtService.signAsync(payload);
        const jwtConfig = this.getJwtConfig();
        const refreshExpiresIn = jwtConfig.refreshExpiresIn;
        const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: refreshExpiresIn });
        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: jwtConfig.expiresIn,
            user: {
                username: user.username,
                nickname: user.nickname || user.username,
                avatar: user.avatar,
            },
        };
    }
    /**
     * 刷新 Token
     * @param refreshToken - 刷新 Token
     * @returns 新的 Token 对
     */
    async refreshToken(refreshToken) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken);
            const user = await this.userRepository.findOne({
                where: { id: payload.sub },
            });
            if (!user) {
                throw new business_exception_1.BusinessException('用户不存在', 404);
            }
            const userRoles = await this.userRoleRepository.find({
                where: { userId: user.id },
                relations: ['role'],
            });
            const newPayload = {
                sub: user.id,
                username: user.username,
                roleIds: userRoles.map((ur) => ur.roleId),
                iat: Date.now() / 1000,
            };
            const jwtConfig = this.getJwtConfig();
            const accessExpiresIn = jwtConfig.expiresIn;
            const accessToken = await this.jwtService.signAsync(newPayload, {
                expiresIn: accessExpiresIn,
            });
            const refreshExpiresIn = jwtConfig.refreshExpiresIn;
            const newRefreshToken = await this.jwtService.signAsync(newPayload, {
                expiresIn: refreshExpiresIn,
            });
            return {
                accessToken,
                refreshToken: newRefreshToken,
                tokenType: 'Bearer',
                expiresIn: jwtConfig.expiresIn,
            };
        }
        catch (error) {
            // Token 验证失败，返回 401 错误码
            throw new business_exception_1.BusinessException('刷新 Token 无效或已过期', 401);
        }
    }
    /**
     * 获取当前用户信息
     * @param userId - 用户 ID
     * @returns 用户信息
     */
    async getCurrentUser(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new business_exception_1.BusinessException('用户不存在', 404);
        }
        // 查询用户角色
        const userRoles = await this.userRoleRepository.find({
            where: { userId: user.id },
            relations: ['role'],
        });
        return {
            id: user.id,
            username: user.username,
            nickname: user.nickname || user.username,
            avatar: user.avatar,
            // 返回角色名称列表
            roles: userRoles.map((ur) => ur.role.roleName) || [],
        };
    }
    /**
     * 退出登录
     * @description 清理 Token（可在 Redis 中将 Token 加入黑名单）
     * @param token - 当前 Token
     */
    async logout(_token) {
        // TODO-TASK-2026-04-07-001: 将 Token 加入 Redis 黑名单
        // await this.redisService.setex(`token_blacklist:${token}`, expiresIn, '1');
    }
    /**
     * 获取用户可访问的应用实例列表
     * @param userId - 用户 ID
     * @returns 用户可访问的应用实例列表
     */
    async getUserApps(userId) {
        const sql = `
      SELECT
        sam.appId,
        sa.appName,
        sa.appCode,
        sa.appTypeId,
        sat.typeCode AS appTypeCode,
        sat.typeName AS appTypeName,
        IF(sa.ownerId = sam.userId, 'owner', 'member') AS role,
        sa.logo
      FROM sys_app_members sam
      INNER JOIN sys_apps sa ON sa.id = sam.appId
      INNER JOIN sys_app_types sat ON sat.id = sa.appTypeId
      WHERE sam.userId = :userId AND sa.appStatus = 1
    `;
        return (0, sql_util_1.executeRawSql)(this.entityManager, sql, { userId });
    }
    /**
     * 获取用户权限菜单
     * @param userId - 用户 ID
     * @param appId - 应用实例 ID
     * @returns 用户权限菜单树
     */
    async getUserPermissions(userId, appId) {
        const sql = `
    SELECT sa.appTypeId appTypeId FROM sys_apps sa WHERE sa.id = :appId ;
    SELECT 
      sp.id,
      sp.permCode,
      sp.permName,
      sp.permissionType,
      sp.nodeType,
      sp.parentId,
      sp.routePath,
      sp.externalUrl,
      sp.iconName,
      sp.sortOrder,
      sp.isVisible,
      sp.isCache,
      sp.showMode,
      BIT_OR(sp.permissionValue) permissionValue
    FROM sys_user_roles sur
    INNER JOIN sys_roles sr ON sur.roleId = sr.id
    INNER JOIN sys_role_permissions srp ON srp.roleId = sr.id
    INNER JOIN sys_permissions sp ON sp.id = srp.permissionId
    WHERE 
      sur.userId = :userId AND 
      sur.appId = :appId AND
      sp.isVisible = 1
    GROUP BY sp.permCode
    ORDER BY sp.sortOrder ASC;
    `;
        const [appTypeIdResult, result] = await (0, sql_util_1.executeRawSql)(this.entityManager, sql, { userId, appId }, true);
        const menuTree = (0, tree_util_1.flatToTree)(result);
        const permissions = result.map((item) => item.permCode);
        const appTypeId = appTypeIdResult[0]?.appTypeId || '';
        // 构建 permissionValueMap
        const permissionValueMap = {};
        for (const item of result) {
            if (item.permissionValue) {
                permissionValueMap[item.permCode] = item.permissionValue.toString();
            }
        }
        return {
            menuTree,
            permissions: permissions,
            appTypeId: appTypeId,
            permissionValueMap,
        };
    }
    /**
     * 用户自注册
     * @param registerDto - 注册请求参数
     * @returns 登录响应（包含 Token）
     */
    async register(registerDto) {
        const { username, password, nickname, email, phone } = registerDto;
        // 检查用户名是否已存在
        const existingUser = await this.userRepository.findOne({
            where: { username },
        });
        if (existingUser) {
            throw new business_exception_1.BusinessException('用户名已存在', 400);
        }
        // 检查邮箱是否已存在
        if (email) {
            const existingEmail = await this.userRepository.findOne({
                where: { email },
            });
            if (existingEmail) {
                throw new business_exception_1.BusinessException('邮箱已被注册', 400);
            }
        }
        // 检查手机号是否已存在
        if (phone) {
            const existingPhone = await this.userRepository.findOne({
                where: { phone },
            });
            if (existingPhone) {
                throw new business_exception_1.BusinessException('手机号已被注册', 400);
            }
        }
        // 加密密码
        const hashedPassword = await (0, encrypt_2.hashPassword)(password);
        // 创建用户
        const user = this.userRepository.create({
            username,
            password: hashedPassword,
            nickname: nickname || username,
            email,
            phone,
            userStatus: 1,
            gender: 0,
            isDeveloper: 0,
        });
        await this.userRepository.save(user);
        // 生成 Token
        const payload = {
            sub: user.id,
            username: user.username,
            roleIds: [],
        };
        const accessToken = await this.jwtService.signAsync(payload);
        const jwtConfig = this.getJwtConfig();
        const refreshExpiresIn = jwtConfig.refreshExpiresIn;
        const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: refreshExpiresIn });
        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: jwtConfig.expiresIn,
            user: {
                username: user.username,
                nickname: user.nickname || user.username,
                avatar: user.avatar,
            },
        };
    }
    /**
     * 检查用户名/邮箱/手机号可用性
     * @param checkDto - 检查请求参数
     * @returns 可用性检查结果
     */
    async checkAvailability(checkDto) {
        const result = {};
        if (checkDto.username) {
            const user = await this.userRepository.findOne({
                where: { username: checkDto.username },
            });
            result.usernameAvailable = !user;
        }
        if (checkDto.email) {
            const user = await this.userRepository.findOne({
                where: { email: checkDto.email },
            });
            result.emailAvailable = !user;
        }
        if (checkDto.phone) {
            const user = await this.userRepository.findOne({
                where: { phone: checkDto.phone },
            });
            result.phoneAvailable = !user;
        }
        return result;
    }
    /**
     * 修改密码
     * @param userId - 用户 ID
     * @param oldPassword - 旧密码
     * @param newPassword - 新密码
     */
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new business_exception_1.BusinessException('用户不存在', 404);
        }
        // 验证旧密码
        const isPasswordValid = await (0, encrypt_1.verifyPassword)(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new business_exception_1.BusinessException('原密码错误', 400);
        }
        // 加密新密码
        const hashedPassword = await (0, encrypt_2.hashPassword)(newPassword);
        await this.userRepository.update(userId, { password: hashedPassword });
    }
    /**
     * 同步用户权限（重新加载用户权限缓存）
     * @param userId - 用户 ID
     * @param appId - 应用实例 ID
     * @returns 用户权限菜单树
     */
    async syncPermissions(userId, appId) {
        // 直接调用 getUserPermissions 重新获取权限
        return this.getUserPermissions(userId, appId);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectEntityManager)()),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(user_role_entity_1.UserRole)),
    __param(4, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(5, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(6, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __param(7, (0, typeorm_1.InjectRepository)(app_type_permission_entity_1.AppTypePermissionEntity)),
    __metadata("design:paramtypes", [typeorm_2.EntityManager,
        typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map