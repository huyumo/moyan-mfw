"use strict";
/**
 * @fileoverview 用户控制器
 * @description 处理用户相关 HTTP 请求
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const user_service_1 = require("./user.service");
const dto_1 = require("./dto");
const auth_guard_1 = require("../../../common/guards/auth.guard");
const audit_log_decorator_1 = require("../../../common/decorators/audit-log.decorator");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const api_types_1 = require("../../../common/types/api.types");
const common_2 = require("../../../common");
const status_dto_1 = require("@/common/types/status.dto");
/**
 * 用户控制器
 * @description 处理用户相关的 CRUD 请求
 */
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    /**
     * 创建用户
     */
    async create(createUserDto) {
        const result = await this.userService.create(createUserDto);
        return api_types_1.ApiResponseUtil.success(result, '创建成功');
    }
    async adminCreate(dto) {
        const result = await this.userService.adminCreate(dto);
        return api_types_1.ApiResponseUtil.success(result, '创建成功');
    }
    /**
     * 查询用户列表
     */
    async findAll(query) {
        const result = await this.userService.findAll(query);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    async findOneByKeyword(keyword, searchBy = 'both') {
        const result = await this.userService.findOneByKeyword(keyword, searchBy);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 根据 ID 查询用户
     */
    async findById(id) {
        const result = await this.userService.findById(id);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 更新用户
     */
    async update(id, updateUserDto) {
        const result = await this.userService.update(id, updateUserDto);
        return api_types_1.ApiResponseUtil.success(result, '更新成功');
    }
    /**
     * 删除用户
     */
    async delete(id) {
        await this.userService.delete(id);
        return api_types_1.ApiResponseUtil.success(null, '删除成功');
    }
    /**
     * 更新用户状态
     */
    async updateStatus(id, body) {
        const { status } = body;
        // 验证状态值有效性
        if (status === undefined || status === null) {
            throw new common_1.BadRequestException('状态值不能为空');
        }
        if (status !== 0 && status !== 1) {
            throw new common_1.BadRequestException('状态值必须是 0 或 1');
        }
        const result = await this.userService.updateStatus(id, status);
        return api_types_1.ApiResponseUtil.success(result, '更新成功');
    }
    /**
     * 重置用户密码
     */
    async resetPassword(id, body) {
        const { password } = body;
        await this.userService.resetPassword(id, password);
        return api_types_1.ApiResponseUtil.success(null, '重置成功');
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '创建用户', description: '创建新的系统用户' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '创建成功',
        type: dto_1.UserResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '用户名已存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.USER, event: 'CREATE_USER', description: '创建用户' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:user', permissionValue: ['添加'] }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('admin-create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '管理员创建用户', description: '管理员创建用户，使用系统默认密码' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '创建成功',
        type: dto_1.UserResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '用户名已存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.USER, event: 'ADMIN_CREATE_USER', description: '管理员创建用户' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:user', permissionValue: ['添加'] }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AdminCreateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "adminCreate", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查询用户列表', description: '分页查询用户列表' }),
    (0, common_2.ApiPaginatedResponse)(dto_1.UserResponseDto),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:user' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('find-one'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '精确查找用户', description: '根据用户名或手机号精确匹配查找单个用户' }),
    (0, swagger_1.ApiQuery)({ name: 'keyword', description: '搜索关键词' }),
    (0, swagger_1.ApiQuery)({ name: 'searchBy', description: '搜索方式: username | phone | both', enum: ['username', 'phone', 'both'], required: false }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: dto_1.UserResponseDto,
    }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:user' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:member' }),
    __param(0, (0, common_1.Query)('keyword')),
    __param(1, (0, common_1.Query)('searchBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findOneByKeyword", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '根据 ID 查询用户', description: '查询指定用户的详细信息' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '用户 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: dto_1.UserResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '用户不存在' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:user' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '更新用户', description: '更新指定用户的信息' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '用户 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '更新成功',
        type: dto_1.UserResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '用户不存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.USER, event: 'UPDATE_USER', description: '更新用户' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:user', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '删除用户', description: '删除指定的用户（软删除）' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '用户 ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '删除成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '用户不存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.USER, event: 'DELETE_USER', description: '删除用户' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:user', permissionValue: ['删除'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "delete", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '更新用户状态', description: '启用或禁用指定用户' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功', type: dto_1.UserResponseDto }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.USER, event: 'UPDATE_USER_STATUS', description: '更新用户状态' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:user', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_a = typeof status_dto_1.StatusDto !== "undefined" && status_dto_1.StatusDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '重置用户密码', description: '重置指定用户的密码' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '重置成功' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '密码格式错误' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.USER, event: 'RESET_USER_PASSWORD', description: '重置用户密码' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:user', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "resetPassword", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('user', '用户相关接口'),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
//# sourceMappingURL=user.controller.js.map