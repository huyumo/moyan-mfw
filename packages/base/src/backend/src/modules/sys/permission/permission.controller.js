"use strict";
/**
 * @fileoverview 权限控制器
 * @description 处理权限相关 HTTP 请求
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
exports.PermissionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permission_service_1 = require("./permission.service");
const dto_1 = require("./dto");
const dto_2 = require("./dto");
const auth_guard_1 = require("../../../common/guards/auth.guard");
const audit_log_decorator_1 = require("../../../common/decorators/audit-log.decorator");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const api_types_1 = require("../../../common/types/api.types");
const common_2 = require("../../../common");
/**
 * 权限控制器
 * @description 处理权限相关的 CRUD 请求
 */
let PermissionController = class PermissionController {
    permissionService;
    constructor(permissionService) {
        this.permissionService = permissionService;
    }
    /**
     * 创建权限
     */
    async create(createPermissionDto) {
        const result = await this.permissionService.create(createPermissionDto);
        return api_types_1.ApiResponseUtil.success(result, '创建成功');
    }
    /**
     * 查询权限列表
     */
    async findAll(query) {
        const result = await this.permissionService.findAll(query);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 查询所有权限（树形结构）
     */
    async findAllTree(permissionType) {
        const result = await this.permissionService.findAllTreeWithChildren(permissionType);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 获取权限树
     */
    async getPermissionTree(parentId) {
        const result = await this.permissionService.getPermissionTreeWithChildren(parentId);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 根据 ID 查询权限
     */
    async findById(id) {
        const result = await this.permissionService.findById(id);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 更新权限
     */
    async update(id, updatePermissionDto) {
        const result = await this.permissionService.update(id, updatePermissionDto);
        return api_types_1.ApiResponseUtil.success(result, '更新成功');
    }
    /**
     * 删除权限
     */
    async delete(id) {
        await this.permissionService.delete(id);
        return api_types_1.ApiResponseUtil.success(null, '删除成功');
    }
    /**
     * 批量创建权限
     */
    async batchCreate(permissions) {
        const result = await this.permissionService.batchCreate(permissions);
        return api_types_1.ApiResponseUtil.success(result, '批量创建成功');
    }
    /**
     * 同步路由到权限表
     */
    async syncPermissions(syncDto) {
        const result = await this.permissionService.syncPermissions(syncDto.routes);
        return api_types_1.ApiResponseUtil.success(result, '权限同步成功');
    }
};
exports.PermissionController = PermissionController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '创建权限', description: '创建新的系统权限' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '创建成功',
        type: dto_1.PermissionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '权限编码已存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.PERMISSION, event: 'CREATE_PERMISSION', description: '创建权限' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission-pc', permissionValue: ['添加'] }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission', permissionValue: ['添加'] }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查询权限列表', description: '分页查询权限列表' }),
    (0, common_2.ApiPaginatedResponse)(dto_1.PermissionResponseDto),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission-pc' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryPermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('tree/all'),
    (0, swagger_1.ApiOperation)({ summary: '查询所有权限树', description: '获取完整的权限树形结构' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: [dto_2.PermissionTreeNodeDto],
    }),
    (0, swagger_1.ApiQuery)({ name: 'permissionType', required: false, description: '权限类型：PC/NORMAL', enum: ['PC', 'NORMAL'] }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission-pc' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission' }),
    __param(0, (0, common_1.Query)('permissionType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "findAllTree", null);
__decorate([
    (0, common_1.Get)('tree'),
    (0, swagger_1.ApiOperation)({ summary: '获取权限树', description: '获取指定父节点的权限树' }),
    (0, swagger_1.ApiQuery)({ name: 'parentId', required: false, description: '父权限 ID，不传则查询根节点' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: [dto_2.PermissionTreeNodeDto],
    }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission-pc' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission' }),
    __param(0, (0, common_1.Query)('parentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "getPermissionTree", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据 ID 查询权限', description: '查询指定权限的详细信息' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '权限 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: dto_1.PermissionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '权限不存在' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission-pc' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新权限', description: '更新指定权限的信息' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '权限 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '更新成功',
        type: dto_1.PermissionResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '权限不存在' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '权限编码已存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.PERMISSION, event: 'UPDATE_PERMISSION', description: '更新权限' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission-pc', permissionValue: ['编辑'] }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '删除权限', description: '删除指定的权限（软删除）' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '权限 ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '删除成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '权限不存在' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '存在子权限，无法删除' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.PERMISSION, event: 'DELETE_PERMISSION', description: '删除权限' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission-pc', permissionValue: ['删除'] }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission', permissionValue: ['删除'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '批量创建权限', description: '批量创建系统权限' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '创建成功',
        type: [dto_1.PermissionResponseDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '权限编码已存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.PERMISSION, event: 'BATCH_CREATE_PERMISSIONS', description: '批量创建权限' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission-pc', permissionValue: ['添加'] }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission', permissionValue: ['添加'] }),
    (0, swagger_1.ApiBody)({ type: dto_1.CreatePermissionDto, isArray: true }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "batchCreate", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '同步路由到权限表', description: '将前端路由同步到权限定义表（全局权限），返回最新权限树' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '同步成功',
        type: [dto_2.PermissionTreeNodeDto],
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.PERMISSION, event: 'SYNC_PERMISSIONS', description: '同步权限路由' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:permission-pc', permissionValue: ['添加'] }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_2.SyncPermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionController.prototype, "syncPermissions", null);
exports.PermissionController = PermissionController = __decorate([
    (0, swagger_1.ApiTags)('permission', '权限相关接口'),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Controller)('permissions'),
    __metadata("design:paramtypes", [permission_service_1.PermissionService])
], PermissionController);
//# sourceMappingURL=permission.controller.js.map