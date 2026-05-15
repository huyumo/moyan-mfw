"use strict";
/**
 * @fileoverview 应用控制器
 * @description 处理应用实例相关 HTTP 请求
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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_service_1 = require("../service/app.service");
const dto_1 = require("../dto");
const auth_guard_1 = require("../../../../common/guards/auth.guard");
const audit_log_decorator_1 = require("../../../../common/decorators/audit-log.decorator");
const require_permission_decorator_1 = require("../../../../common/decorators/require-permission.decorator");
const api_types_1 = require("../../../../common/types/api.types");
const common_2 = require("../../../../common");
/**
 * 应用控制器
 * @description 处理应用实例相关的 CRUD 请求
 */
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    /**
     * 创建应用实例
     */
    async create(createAppDto) {
        const result = await this.appService.create(createAppDto);
        return api_types_1.ApiResponseUtil.success(result, '创建成功');
    }
    /**
     * 查询应用实例列表
     */
    async findAll(query) {
        const result = await this.appService.findAll(query);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 根据 ID 查询应用实例
     */
    async findById(id) {
        const result = await this.appService.findById(id);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 更新应用实例
     */
    async update(id, updateAppDto) {
        const result = await this.appService.update(id, updateAppDto);
        return api_types_1.ApiResponseUtil.success(result, '更新成功');
    }
    /**
     * 删除应用实例
     */
    async delete(id) {
        await this.appService.delete(id);
        return api_types_1.ApiResponseUtil.success(null, '删除成功');
    }
    /**
     * 变更负责人
     */
    async changeOwner(id, ownerId) {
        const result = await this.appService.changeOwner(id, ownerId);
        return api_types_1.ApiResponseUtil.success(result, '变更成功');
    }
    /**
     * 更新应用实例状态
     */
    async updateStatus(id, status) {
        const result = await this.appService.updateStatus(id, status);
        return api_types_1.ApiResponseUtil.success(result, '更新成功');
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '创建应用实例', description: '创建新的应用实例' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '创建成功',
        type: dto_1.AppDetailResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '应用编码已存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.APP, event: 'CREATE_APP', description: '创建应用实例' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app', permissionValue: ['添加'] }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAppDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查询应用实例列表', description: '分页查询应用实例列表' }),
    (0, common_2.ApiPaginatedResponse)(dto_1.AppDetailResponseDto),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryAppDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据 ID 查询应用实例', description: '查询指定应用实例的详细信息' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '应用实例 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: dto_1.AppDetailResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '应用实例不存在' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新应用实例', description: '更新指定应用实例的信息' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '应用实例 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '更新成功',
        type: dto_1.AppDetailResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '应用实例不存在' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '应用编码已存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.APP, event: 'UPDATE_APP', description: '更新应用实例' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateAppDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '删除应用实例', description: '删除指定的应用实例（软删除）' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '应用实例 ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '删除成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '应用实例不存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.APP, event: 'DELETE_APP', description: '删除应用实例' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app', permissionValue: ['删除'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "delete", null);
__decorate([
    (0, common_1.Put)(':id/owner'),
    (0, swagger_1.ApiOperation)({ summary: '变更负责人', description: '变更应用实例的负责人' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '应用实例 ID' }),
    (0, swagger_1.ApiQuery)({ name: 'ownerId', description: '新负责人 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '变更成功',
        type: dto_1.AppDetailResponseDto,
    }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.APP, event: 'CHANGE_OWNER', description: '变更负责人' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('ownerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "changeOwner", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: '更新应用实例状态', description: '启用或禁用指定应用实例' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '应用实例 ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', description: '状态 (1:启用 0:禁用)', enum: [0, 1] }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '更新成功',
        type: dto_1.AppDetailResponseDto,
    }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.APP, event: 'UPDATE_APP_STATUS', description: '更新应用实例状态' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateStatus", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('app', '应用实例相关接口'),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Controller)('apps'),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map