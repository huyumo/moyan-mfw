"use strict";
/**
 * @fileoverview 角色权限响应 DTO
 * @description 角色权限配置的响应数据结构
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
exports.RolePermissionResponseDto = exports.RolePermissionTreesResponseDto = void 0;
const app_type_1 = require("@/modules/sys/app-type");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
/**
 * 角色权限树响应 DTO
 * @description 包含 PC 权限树和普通权限树
 */
class RolePermissionTreesResponseDto extends app_type_1.PermissionTreesResponseDto {
}
exports.RolePermissionTreesResponseDto = RolePermissionTreesResponseDto;
/**
 * 角色权限响应 DTO
 * @description 获取角色权限配置的响应数据
 */
class RolePermissionResponseDto {
    /**
     * 角色 ID
     */
    roleId;
    /**
     * 权限树配置
     */
    permissionTrees;
}
exports.RolePermissionResponseDto = RolePermissionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], RolePermissionResponseDto.prototype, "roleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限树配置', type: RolePermissionTreesResponseDto }),
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => RolePermissionTreesResponseDto),
    __metadata("design:type", RolePermissionTreesResponseDto)
], RolePermissionResponseDto.prototype, "permissionTrees", void 0);
//# sourceMappingURL=role-permission-response.dto.js.map