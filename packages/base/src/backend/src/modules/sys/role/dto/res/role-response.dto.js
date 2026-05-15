"use strict";
/**
 * @fileoverview 角色响应 DTO
 * @description 角色信息的响应数据结构
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
exports.RoleResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
/**
 * 角色响应 DTO
 */
class RoleResponseDto {
    /**
     * 角色 ID
     */
    id;
    /**
     * 角色名称
     */
    roleName;
    /**
     * 角色编码
     */
    roleCode;
    /**
     * 角色描述
     */
    roleDesc;
    /**
     * 应用类型 ID
     */
    appTypeId;
    /**
     * 应用实例 ID
     */
    appId;
    /**
     * 是否内置
     */
    isBuiltin;
    /**
     * 是否拥有者角色
     */
    isOwner;
    /**
     * 角色状态
     */
    roleStatus;
    /**
     * 排序号
     */
    sortOrder;
    /**
     * 创建时间
     */
    createdAt;
    /**
     * 更新时间
     */
    updateAt;
}
exports.RoleResponseDto = RoleResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RoleResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色名称' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RoleResponseDto.prototype, "roleName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色编码' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RoleResponseDto.prototype, "roleCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色描述' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RoleResponseDto.prototype, "roleDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RoleResponseDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用实例 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RoleResponseDto.prototype, "appId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否内置' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], RoleResponseDto.prototype, "isBuiltin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否拥有者角色' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], RoleResponseDto.prototype, "isOwner", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色状态 (1:启用 0:禁用)' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], RoleResponseDto.prototype, "roleStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], RoleResponseDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], RoleResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], RoleResponseDto.prototype, "updateAt", void 0);
//# sourceMappingURL=role-response.dto.js.map