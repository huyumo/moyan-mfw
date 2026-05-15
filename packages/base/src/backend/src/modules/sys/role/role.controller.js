"use strict";
/**
 * @fileoverview 角色控制器
 * @description 处理角色相关 HTTP 请求
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
exports.RoleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const role_service_1 = require("./role.service");
const dto_1 = require("./dto");
const auth_guard_1 = require("../../../common/guards/auth.guard");
const audit_log_decorator_1 = require("../../../common/decorators/audit-log.decorator");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const api_types_1 = require("../../../common/types/api.types");
const common_2 = require("../../../common");
/**
 * 角色控制器
 * @description 处理角色相关的 CRUD 请求
 */
let RoleController = class RoleController {
    roleService;
    constructor(roleService) {
        this.roleService = roleService;
    }
    /**
     * 创建角色
     */
    async create(createRoleDto) {
        const result = await this.roleService.create(createRoleDto);
        return api_types_1.ApiResponseUtil.success(result, '创建成功');
    }
    /**
     * 查询角色列表
     */
    async findAll(query) {
        const result = await this.roleService.findAll(query);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 根据 ID 查询角色
     */
    async findById(id) {
        const result = await this.roleService.findById(id);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 更新角色
     */
    async update(id, updateRoleDto) {
        const result = await this.roleService.update(id, updateRoleDto);
        return api_types_1.ApiResponseUtil.success(result, '更新成功');
    }
    /**
     * 删除角色
     */
    async delete(id) {
        await this.roleService.delete(id);
        return api_types_1.ApiResponseUtil.success(null, '删除成功');
    }
    /**
     * 为角色分配权限
     */
    async assignPermissions(id, assignPermissionsDto) {
        await this.roleService.assignPermissions(id, assignPermissionsDto);
        return api_types_1.ApiResponseUtil.success(null, '分配成功');
    }
    /**
     * 获取角色的权限列表
     */
    async getRolePermissions(id) {
        const result = await this.roleService.getRolePermissionTree(id);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
};
exports.RoleController = RoleController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '创建角色', description: '创建新的系统角色' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '创建成功',
        type: dto_1.RoleResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '角色编码已存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.ROLE, event: 'CREATE_ROLE', description: '创建角色' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:role', permissionValue: ['添加'] }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateRoleDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查询角色列表', description: '分页查询角色列表' }),
    (0, common_2.ApiPaginatedResponse)(dto_1.RoleResponseDto),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:role' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryRoleDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据 ID 查询角色', description: '查询指定角色的详细信息' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '角色 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: dto_1.RoleResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '角色不存在' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:role' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新角色', description: '更新指定角色的信息' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '角色 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '更新成功',
        type: dto_1.RoleResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '角色不存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.ROLE, event: 'UPDATE_ROLE', description: '更新角色' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:role', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateRoleDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '删除角色', description: '删除指定的角色（软删除）' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '角色 ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '删除成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '角色不存在' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: '内置角色不允许删除' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.ROLE, event: 'DELETE_ROLE', description: '删除角色' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:role', permissionValue: ['删除'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/permissions'),
    (0, swagger_1.ApiOperation)({ summary: '分配权限', description: '为指定角色分配权限' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '角色 ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '分配成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '角色不存在' }),
    (0, audit_log_decorator_1.AuditLog)({ module: audit_log_decorator_1.AuditModule.ROLE, event: 'ASSIGN_PERMISSIONS', description: '分配权限' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:role', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AssignPermissionsDto]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "assignPermissions", null);
__decorate([
    (0, common_1.Get)(':id/permissions'),
    (0, swagger_1.ApiOperation)({ summary: '获取角色权限', description: '获取指定角色的权限树配置' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '角色 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: dto_1.RolePermissionResponseDto,
    }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:role' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RoleController.prototype, "getRolePermissions", null);
exports.RoleController = RoleController = __decorate([
    (0, swagger_1.ApiTags)('role', '角色相关接口'),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Controller)('roles'),
    __metadata("design:paramtypes", [role_service_1.RoleService])
], RoleController);
//# sourceMappingURL=role.controller.js.map