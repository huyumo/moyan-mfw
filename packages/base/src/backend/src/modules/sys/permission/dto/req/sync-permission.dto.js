"use strict";
/**
 * @fileoverview 权限同步请求 DTO
 * @description 同步路由到权限的请求参数
 *
 * 注意：同步路由只是将路由转换为 Permission 实体数据，不涉及应用类型绑定。
 * 应用类型绑定是在"应用类型管理页面"的"权限池配置"中完成的。
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncPermissionDto = exports.RouteNodeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
/**
 * 路由节点 DTO
 */
class RouteNodeDto {
    /**
     * 路由路径
     */
    path;
    /**
     * 路由名称
     */
    name;
    /**
     * 权限值（位运算字符串，如 "6"）
     */
    permissionValue;
    /**
     * 子路由
     */
    children;
}
exports.RouteNodeDto = RouteNodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '路由路径', example: '/sys/user' }),
    (0, class_validator_1.IsNotEmpty)({ message: '路由路径不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RouteNodeDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '路由名称', example: '用户管理' }),
    (0, class_validator_1.IsNotEmpty)({ message: '路由名称不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RouteNodeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限值（位运算）', required: false, example: '6' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RouteNodeDto.prototype, "permissionValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '子路由', required: false, type: () => [RouteNodeDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RouteNodeDto),
    __metadata("design:type", Array)
], RouteNodeDto.prototype, "children", void 0);
/**
 * 权限同步请求 DTO
 */
class SyncPermissionDto {
    /**
     * 路由树结构
     */
    routes;
}
exports.SyncPermissionDto = SyncPermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '路由树结构', type: [RouteNodeDto] }),
    (0, class_validator_1.IsNotEmpty)({ message: '路由数据不能为空' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RouteNodeDto),
    __metadata("design:type", Array)
], SyncPermissionDto.prototype, "routes", void 0);
//# sourceMappingURL=sync-permission.dto.js.map