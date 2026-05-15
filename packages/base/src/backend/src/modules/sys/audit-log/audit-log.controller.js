"use strict";
/**
 * @fileoverview 审计日志控制器
 * @description 处理审计日志相关 HTTP 请求
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
exports.AuditLogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_log_service_1 = require("./audit-log.service");
const dto_1 = require("./dto");
const auth_guard_1 = require("../../../common/guards/auth.guard");
const require_permission_decorator_1 = require("../../../common/decorators/require-permission.decorator");
const api_types_1 = require("../../../common/types/api.types");
const common_2 = require("../../../common");
/**
 * 审计日志控制器
 * @description 处理审计日志相关的查询请求
 */
let AuditLogController = class AuditLogController {
    auditLogService;
    constructor(auditLogService) {
        this.auditLogService = auditLogService;
    }
    /**
     * 查询审计日志列表
     */
    async findAll(query) {
        const result = await this.auditLogService.findAll(query);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 根据 ID 查询审计日志
     */
    async findById(id) {
        const result = await this.auditLogService.findById(id);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 根据目标 ID 查询审计日志列表
     */
    async findByTargetId(targetId) {
        const result = await this.auditLogService.findByTargetId(targetId);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 根据操作人 ID 查询审计日志列表
     */
    async findByOperatorId(operatorId) {
        const result = await this.auditLogService.findByOperatorId(operatorId);
        return api_types_1.ApiResponseUtil.success(result, '查询成功');
    }
    /**
     * 删除指定时间之前的审计日志
     */
    async deleteBeforeDate(beforeDate) {
        const date = new Date(beforeDate);
        const deleted = await this.auditLogService.deleteBeforeDate(date);
        return api_types_1.ApiResponseUtil.success({ deleted }, `已删除 ${deleted} 条日志`);
    }
};
exports.AuditLogController = AuditLogController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查询审计日志列表', description: '分页查询审计日志列表' }),
    (0, common_2.ApiPaginatedResponse)(dto_1.AuditLogResponseDto),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:audit-log' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryAuditLogDto]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据 ID 查询审计日志', description: '查询指定审计日志的详细信息' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '审计日志 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: dto_1.AuditLogResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '审计日志不存在' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:audit-log' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('target/:targetId'),
    (0, swagger_1.ApiOperation)({ summary: '根据目标 ID 查询审计日志', description: '查询指定目标的所有审计日志' }),
    (0, swagger_1.ApiParam)({ name: 'targetId', description: '目标 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: [dto_1.AuditLogResponseDto],
    }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:audit-log' }),
    __param(0, (0, common_1.Param)('targetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "findByTargetId", null);
__decorate([
    (0, common_1.Get)('operator/:operatorId'),
    (0, swagger_1.ApiOperation)({ summary: '根据操作人 ID 查询审计日志', description: '查询指定操作人的所有审计日志' }),
    (0, swagger_1.ApiParam)({ name: 'operatorId', description: '操作人 ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '查询成功',
        type: [dto_1.AuditLogResponseDto],
    }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:audit-log' }),
    __param(0, (0, common_1.Param)('operatorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "findByOperatorId", null);
__decorate([
    (0, common_1.Delete)('before/:beforeDate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '清理审计日志', description: '删除指定日期之前的审计日志' }),
    (0, swagger_1.ApiParam)({ name: 'beforeDate', description: '日期 (YYYY-MM-DD)' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '删除成功' }),
    (0, require_permission_decorator_1.RequirePermission)({ permCode: 'pc_root:sys:audit-log', permissionValue: ['删除'] }),
    __param(0, (0, common_1.Param)('beforeDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "deleteBeforeDate", null);
exports.AuditLogController = AuditLogController = __decorate([
    (0, swagger_1.ApiTags)('audit-log', '审计日志相关接口'),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Controller)('audit-logs'),
    __metadata("design:paramtypes", [audit_log_service_1.AuditLogService])
], AuditLogController);
//# sourceMappingURL=audit-log.controller.js.map