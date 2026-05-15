"use strict";
/**
 * @fileoverview 广告内容控制器
 * @description 处理广告内容相关 HTTP 请求
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
exports.AdController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const backend_1 = require("moyan-mfw-base/backend");
const api_response_1 = require("../api-response");
const ad_service_1 = require("../service/ad.service");
const dto_1 = require("../dto");
let AdController = class AdController {
    service;
    constructor(service) {
        this.service = service;
    }
    async create(dto) {
        const result = await this.service.create(dto);
        return api_response_1.ApiResponseUtil.success(result, '创建成功');
    }
    async findAll(query) {
        const result = await this.service.findAll(query);
        return api_response_1.ApiResponseUtil.success(result, '查询成功');
    }
    async findById(id) {
        const result = await this.service.findById(id);
        return api_response_1.ApiResponseUtil.success(result, '查询成功');
    }
    async update(id, dto) {
        const result = await this.service.update(id, dto);
        return api_response_1.ApiResponseUtil.success(result, '更新成功');
    }
    async delete(id) {
        await this.service.delete(id);
        return api_response_1.ApiResponseUtil.success(null, '删除成功');
    }
};
exports.AdController = AdController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '创建广告内容', description: '在指定广告位下创建新的广告内容' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    (0, backend_1.RequirePermission)({ permCode: 'ad:content:create', permissionValue: ['发布'] }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAdDto]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查询广告内容列表', description: '分页查询广告内容列表' }),
    (0, backend_1.ApiPaginatedResponse)(Object),
    (0, backend_1.RequirePermission)({ permCode: 'ad:content:view' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryAdDto]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '查询广告内容详情' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '广告 ID' }),
    (0, backend_1.RequirePermission)({ permCode: 'ad:content:view' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新广告内容' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '广告 ID' }),
    (0, backend_1.RequirePermission)({ permCode: 'ad:content:update', permissionValue: ['编辑'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateAdDto]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: '删除广告内容' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '广告 ID' }),
    (0, backend_1.RequirePermission)({ permCode: 'ad:content:delete', permissionValue: ['删除'] }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "delete", null);
exports.AdController = AdController = __decorate([
    (0, swagger_1.ApiTags)('ad-content', '广告内容相关接口'),
    (0, swagger_1.ApiBearerAuth)('Authorization'),
    (0, common_1.UseGuards)(backend_1.AuthGuard),
    (0, common_1.Controller)('ad-contents'),
    __metadata("design:paramtypes", [ad_service_1.AdService])
], AdController);
//# sourceMappingURL=ad.controller.js.map