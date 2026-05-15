"use strict";
/**
 * @fileoverview 成员控制器
 * @description 处理应用成员相关 HTTP 请求
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
exports.AppMemberController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_member_service_1 = require("../service/app-member.service");
const dto_1 = require("../dto");
const auth_guard_1 = require("../../../../common/guards/auth.guard");
const audit_log_decorator_1 = require("../../../../common/decorators/audit-log.decorator");
const require_permission_decorator_1 = require("../../../../common/decorators/require-permission.decorator");
const api_types_1 = require("../../../../common/types/api.types");
const common_2 = require("../../../../common");
const member_response_dto_1 = require("../dto/res/member-response.dto");
/**
 * 成员控制器
 * @description 处理应用成员相关的 CRUD 请求
 */
let AppMemberController = class AppMemberController {
    appMemberService;
    constructor(appMemberService) {
        this.appMemberService = appMemberService;
    }
    /**
     * 添加应用成员
     */
    async addMember(appId, addMemberDto) {
        const result = await this.appMemberService.addMember(appId, addMemberDto);
        return api_types_1.ApiResponseUtil.success(result, '添加成功');
    }
    /**
     * 获取应用成员列表
     */
    async getMembers(appId, query) {
        const result = await this.appMemberService.getMembers(appId, query);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 更新成员角色
     */
    async updateRoles(appId, userId, updateDto) {
        await this.appMemberService.updateRoles(appId, userId, updateDto);
        return api_types_1.ApiResponseUtil.success(null, '更新成功');
    }
    /**
     * 移除应用成员
     */
    async removeMember(appId, userId) {
        await this.appMemberService.removeMember(appId, userId);
        return api_types_1.ApiResponseUtil.success(null, '移除成功');
    }
    /**
     * 获取可选角色列表
     */
    async getAvailableRoles(appId) {
        const result = await this.appMemberService.getAvailableRoles(appId);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
};
exports.AppMemberController = AppMemberController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '添加应用成员', description: '添加用户到应用成员列表' }),
    (0, swagger_1.ApiParam)({ name: 'appId', description: '应用 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '添加成功',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '应用或用户不存在' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '成员已存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.MEMBER, event: 'ADD_MEMBER', description: '添加应用成员' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:member', permissionValue: ['添加'] }),
    __param(0, (0, common_1.Param)('appId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddMemberDto]),
    __metadata("design:returntype", Promise)
], AppMemberController.prototype, "addMember", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取应用成员列表', description: '分页查询应用成员列表' }),
    (0, common_2.ApiPaginatedResponse)(member_response_dto_1.MemberResponseDto),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:member' }),
    __param(0, (0, common_1.Param)('appId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.QueryMemberDto]),
    __metadata("design:returntype", Promise)
], AppMemberController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Put)(':userId/roles'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '更新成员角色', description: '更新成员在应用中的角色列表（全量替换）' }),
    (0, swagger_1.ApiParam)({ name: 'appId', description: '应用 ID' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: '用户 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '更新成功',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '应用或成员不存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.MEMBER, event: 'UPDATE_MEMBER_ROLES', description: '更新成员角色' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:member', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('appId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateMemberRolesDto]),
    __metadata("design:returntype", Promise)
], AppMemberController.prototype, "updateRoles", null);
__decorate([
    (0, common_1.Delete)(':userId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '移除应用成员', description: '从应用中移除成员及其角色' }),
    (0, swagger_1.ApiParam)({ name: 'appId', description: '应用 ID' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: '用户 ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '移除成功' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '不能移除拥有者' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '成员不存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.MEMBER, event: 'REMOVE_MEMBER', description: '移除应用成员' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:member', permissionValue: ['删除'] }),
    __param(0, (0, common_1.Param)('appId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppMemberController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Get)('/available-roles'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '获取可选角色列表', description: '获取应用可分配的角色列表' }),
    (0, swagger_1.ApiParam)({ name: 'appId', description: '应用 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: [member_response_dto_1.AvailableAvailableRoleDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '应用不存在' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:member' }),
    __param(0, (0, common_1.Param)('appId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppMemberController.prototype, "getAvailableRoles", null);
exports.AppMemberController = AppMemberController = __decorate([
    (0, swagger_1.ApiTags)('member', '应用成员相关接口'),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Controller)('apps/:appId/members'),
    __metadata("design:paramtypes", [app_member_service_1.AppMemberService])
], AppMemberController);
//# sourceMappingURL=app-member.controller.js.map