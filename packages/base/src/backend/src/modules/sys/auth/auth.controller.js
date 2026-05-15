"use strict";
/**
 * @fileoverview 认证控制器
 * @description 处理用户认证相关请求
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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("../../../common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const api_types_1 = require("../../../common/types/api.types");
/**
 * 认证控制器
 * @description 处理用户登录、登出、Token 刷新等认证相关请求
 */
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    /**
     * 用户登录
     * @param loginDto - 登录请求参数
     * @returns 登录响应（包含 Token）
     */
    async login(loginDto) {
        const result = await this.authService.login(loginDto);
        return api_types_1.ApiResponseUtil.success(result, '登录成功');
    }
    /**
     * 刷新 Token
     * @param refreshTokenDto - 刷新 Token 请求参数
     * @returns 新的 Token 对
     */
    async refreshToken(refreshToken) {
        // 参数验证
        if (!refreshToken) {
            throw new common_1.BadRequestException('refreshToken 不能为空');
        }
        const result = await this.authService.refreshToken(refreshToken);
        return api_types_1.ApiResponseUtil.success(result, '刷新成功');
    }
    /**
     * 获取当前用户信息
     * @param user - 用户信息（从 JWT 中解析）
     * @returns 当前用户信息
     */
    async getCurrentUser(user) {
        const userId = user.id;
        const result = await this.authService.getCurrentUser(userId);
        return api_types_1.ApiResponseUtil.success(result, '获取成功');
    }
    /**
     * 退出登录
     * @param req - 请求对象
     * @returns 退出结果
     */
    async logout(dto) {
        const token = dto.token;
        await this.authService.logout(token);
        return api_types_1.ApiResponseUtil.success(null, '退出成功');
    }
    /**
     * 获取用户可访问的应用实例列表
     * @param user - 用户信息（从 JWT 中解析）
     * @returns 用户可访问的应用实例列表
     */
    async getUserApps(user) {
        const userId = user.id;
        const apps = await this.authService.getUserApps(userId);
        return api_types_1.ApiResponseUtil.success(apps, '获取成功');
    }
    /**
     * 获取用户权限菜单
     * @param user - 用户信息（从 JWT 中解析）
     * @param query - 查询参数（appId）
     * @returns 用户权限菜单树
     */
    async getUserPermissions(user, appId) {
        if (!appId) {
            throw new common_1.BadRequestException('缺少应用标识，请传入 X-App-Id 请求头或 appId 参数');
        }
        const userId = user.id;
        const result = await this.authService.getUserPermissions(userId, appId);
        return api_types_1.ApiResponseUtil.success(result, '获取成功');
    }
    /**
     * 用户自注册
     * @param registerDto - 注册请求参数
     * @returns 登录响应（包含 Token）
     */
    async register(registerDto) {
        const result = await this.authService.register(registerDto);
        return api_types_1.ApiResponseUtil.success(result, '注册成功');
    }
    /**
     * 检查用户名/邮箱/手机号可用性
     * @param query - 检查参数
     * @returns 可用性检查结果
     */
    async checkAvailability(query) {
        const result = await this.authService.checkAvailability(query);
        return api_types_1.ApiResponseUtil.success(result, '检查成功');
    }
    /**
     * 修改密码
     * @param user - 用户信息
     * @param body - 请求体
     * @returns 修改结果
     */
    async changePassword(user, body) {
        if (!body.oldPassword || !body.newPassword) {
            throw new common_1.BadRequestException('原密码和新密码不能为空');
        }
        const userId = user.id;
        await this.authService.changePassword(userId, body.oldPassword, body.newPassword);
        return api_types_1.ApiResponseUtil.success(null, '密码修改成功');
    }
    /**
     * 同步用户权限
     * @param user - 用户信息
     * @param query - 查询参数
     * @returns 用户权限菜单树
     */
    async syncPermissions(user, appId) {
        if (!appId) {
            throw new common_1.BadRequestException('缺少应用标识，请传入 X-App-Id 请求头或 appId 参数');
        }
        const userId = user.id;
        const result = await this.authService.syncPermissions(userId, appId);
        return api_types_1.ApiResponseUtil.success(result, '权限同步成功');
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '用户登录', description: '使用用户名和密码登录系统' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '登录成功',
        type: dto_1.LoginResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '用户名或密码错误' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '刷新 Token', description: '使用刷新 Token 获取新的访问 Token' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '刷新成功',
        type: dto_1.LoginResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '刷新 Token 无效或已过期' }),
    __param(0, (0, common_1.Body)('refreshToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('userinfo'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, swagger_1.ApiOperation)({ summary: '获取当前用户信息', description: '获取已登录用户的详细信息' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '获取成功',
        type: dto_1.UserInfoDto,
    }),
    __param(0, (0, common_2.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [common_2.UserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, swagger_1.ApiOperation)({ summary: '退出登录', description: '使当前 Token 失效（可选认证）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '退出成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LogoutDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('apps'),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, swagger_1.ApiOperation)({
        summary: '获取用户应用列表',
        description: '获取当前用户可访问的应用实例列表，包括作为拥有者和成员的应用',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '获取成功',
        type: [dto_1.AppInstanceItemDto],
    }),
    __param(0, (0, common_2.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [common_2.UserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getUserApps", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, swagger_1.ApiOperation)({
        summary: '获取用户权限菜单',
        description: '获取用户在当前应用实例下的权限菜单树，appId 从请求头 X-App-Id 获取',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '获取成功',
        type: dto_1.UserPermissionsResponseDto,
    }),
    __param(0, (0, common_2.User)()),
    __param(1, (0, common_2.AppId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [common_2.UserDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getUserPermissions", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '用户注册', description: '用户自注册，注册成功后自动登录' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '注册成功',
        type: dto_1.LoginResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '用户名/邮箱/手机号已存在' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('check-availability'),
    (0, swagger_1.ApiOperation)({
        summary: '检查可用性',
        description: '检查用户名、邮箱、手机号是否可注册',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '检查成功',
        type: dto_1.CheckAvailabilityResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CheckAvailabilityDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkAvailability", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, swagger_1.ApiOperation)({ summary: '修改密码', description: '用户修改自己的密码' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '修改成功' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '原密码错误' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未登录' }),
    __param(0, (0, common_2.User)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [common_2.UserDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('sync-permissions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, swagger_1.ApiOperation)({
        summary: '同步权限',
        description: '重新加载用户在当前应用实例下的权限',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '同步成功',
        type: dto_1.UserPermissionsResponseDto,
    }),
    __param(0, (0, common_2.User)()),
    __param(1, (0, common_2.AppId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [common_2.UserDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "syncPermissions", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth', '认证相关接口'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map