"use strict";
/**
 * @fileoverview 应用类型控制器
 * @description 处理应用类型相关 HTTP 请求
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
exports.AppTypeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_type_service_1 = require("./app-type.service");
const dto_1 = require("./dto");
const update_permission_pool_dto_1 = require("./dto/req/update-permission-pool.dto");
const permission_pool_response_dto_1 = require("./dto/res/permission-pool-response.dto");
const auth_guard_1 = require("../../../common/guards/auth.guard");
const audit_log_decorator_1 = require("../../../common/decorators/audit-log.decorator");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const api_types_1 = require("../../../common/types/api.types");
const common_2 = require("../../../common");
const permission_1 = require("../permission");
const status_dto_1 = require("@/common/types/status.dto");
/**
 * 应用类型控制器
 * @description 处理应用类型相关的 CRUD 请求
 */
let AppTypeController = class AppTypeController {
    appTypeService;
    constructor(appTypeService) {
        this.appTypeService = appTypeService;
    }
    /**
     * 创建应用类型
     */
    async create(createAppTypeDto) {
        const result = await this.appTypeService.create(createAppTypeDto);
        return api_types_1.ApiResponseUtil.success(result, '创建成功');
    }
    /**
     * 查询应用类型列表
     */
    async findAll(query) {
        const result = await this.appTypeService.findAll(query);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 查询所有应用类型
     */
    async findAllList() {
        const result = await this.appTypeService.findAllList();
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 根据 ID 查询应用类型
     */
    async findById(id) {
        const result = await this.appTypeService.findById(id);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 获取权限池配置
     */
    async getPermissionPool(appTypeId) {
        const result = await this.appTypeService.getPermissionPool(appTypeId);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 更新权限池配置
     */
    async updatePermissionPool(appTypeId, updateDto) {
        const result = await this.appTypeService.updatePermissionPool(appTypeId, updateDto);
        return api_types_1.ApiResponseUtil.success(result, '更新成功');
    }
    /**
     * 更新应用类型
     */
    async update(id, updateAppTypeDto) {
        const result = await this.appTypeService.update(id, updateAppTypeDto);
        return api_types_1.ApiResponseUtil.success(result, '更新成功');
    }
    /**
     * 删除应用类型
     */
    async delete(id) {
        await this.appTypeService.delete(id);
        return api_types_1.ApiResponseUtil.success(null, '删除成功');
    }
    /**
     * 更新应用类型状态
     */
    async updateStatus(id, body) {
        const result = await this.appTypeService.updateStatus(id, body.status);
        return api_types_1.ApiResponseUtil.success(result, '更新成功');
    }
};
exports.AppTypeController = AppTypeController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '创建应用类型', description: '创建新的应用类型' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '创建成功',
        type: dto_1.AppTypeResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '类型编码已存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.APP_TYPE, event: 'CREATE_APP_TYPE', description: '创建应用类型' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app-type', permissionValue: ['添加'] }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAppTypeDto]),
    __metadata("design:returntype", Promise)
], AppTypeController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查询应用类型列表', description: '分页查询应用类型列表' }),
    (0, common_2.ApiPaginatedResponse)(dto_1.AppTypeResponseDto),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app-type' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryAppTypeDto]),
    __metadata("design:returntype", Promise)
], AppTypeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: '查询所有应用类型', description: '获取所有应用类型列表' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: [dto_1.AppTypeResponseDto],
    }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app-type' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppTypeController.prototype, "findAllList", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据 ID 查询应用类型', description: '查询指定应用类型的详细信息' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '应用类型 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: dto_1.AppTypeResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '应用类型不存在' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app-type' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppTypeController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':appTypeId/permission-pool'),
    (0, swagger_1.ApiOperation)({ summary: '获取权限池配置', description: '获取应用类型的权限池配置，包含权限树和勾选状态' }),
    (0, swagger_1.ApiParam)({ name: 'appTypeId', description: '应用类型 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: permission_pool_response_dto_1.PermissionPoolResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '应用类型不存在' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app-type' }),
    __param(0, (0, common_1.Param)('appTypeId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppTypeController.prototype, "getPermissionPool", null);
__decorate([
    (0, common_1.Put)(':appTypeId/permission-pool'),
    (0, swagger_1.ApiOperation)({ summary: '更新权限池配置', description: '更新应用类型的权限池配置，批量更新权限节点' }),
    (0, swagger_1.ApiParam)({ name: 'appTypeId', description: '应用类型 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '更新成功',
        type: permission_pool_response_dto_1.UpdatePermissionPoolResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '应用类型不存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.APP_TYPE, event: 'UPDATE_PERMISSION_POOL', description: '更新权限池配置' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app-type', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('appTypeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_permission_pool_dto_1.UpdatePermissionPoolDto]),
    __metadata("design:returntype", Promise)
], AppTypeController.prototype, "updatePermissionPool", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新应用类型', description: '更新指定应用类型的信息' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '应用类型 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '更新成功',
        type: dto_1.AppTypeResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '应用类型不存在' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '类型编码已存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.APP_TYPE, event: 'UPDATE_APP_TYPE', description: '更新应用类型' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app-type', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateAppTypeDto]),
    __metadata("design:returntype", Promise)
], AppTypeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '删除应用类型', description: '删除指定的应用类型（软删除）' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '应用类型 ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '删除成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '应用类型不存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.APP_TYPE, event: 'DELETE_APP_TYPE', description: '删除应用类型' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app-type', permissionValue: ['删除'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppTypeController.prototype, "delete", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: '更新应用类型状态', description: '启用或禁用指定应用类型' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '应用类型 ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', description: '状态 (1:启用 0:禁用)', enum: [0, 1] }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '更新成功',
        type: dto_1.AppTypeResponseDto,
    }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.APP_TYPE, event: 'UPDATE_APP_TYPE_STATUS', description: '更新应用类型状态' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:app-type', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_a = typeof status_dto_1.StatusDto !== "undefined" && status_dto_1.StatusDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], AppTypeController.prototype, "updateStatus", null);
exports.AppTypeController = AppTypeController = __decorate([
    (0, swagger_1.ApiTags)('app-type', '应用类型相关接口'),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, swagger_1.ApiExtraModels)(permission_1.PermissionTreeNodeDto),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Controller)('app-types'),
    __metadata("design:paramtypes", [app_type_service_1.AppTypeService])
], AppTypeController);
//# sourceMappingURL=app-type.controller.js.map