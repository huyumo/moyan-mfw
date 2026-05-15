"use strict";
/**
 * @fileoverview 权限池更新请求 DTO
 * @description 更新应用类型权限池配置的请求参数
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
exports.UpdatePermissionPoolDto = exports.PermissionTreesDto = exports.PermissionTreePayloadDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
/**
 * 权限树节点请求体
 * @description 用于提交权限节点的勾选状态和权限值
 */
class PermissionTreePayloadDto {
    /**
     * 权限 ID
     */
    id;
    /**
     * 是否选中
     * @description true=加入权限池，false=移除
     */
    checked;
    /**
     * 权限值
     * @description 位运算权限值，十进制字符串格式
     */
    permissionValue;
    /**
     * 子节点
     */
    children;
}
exports.PermissionTreePayloadDto = PermissionTreePayloadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限 ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PermissionTreePayloadDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否选中（true=加入权限池，false=移除）' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PermissionTreePayloadDto.prototype, "checked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '权限值（位运算权限值，十进制字符串格式）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PermissionTreePayloadDto.prototype, "permissionValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '子节点列表', type: [PermissionTreePayloadDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PermissionTreePayloadDto),
    __metadata("design:type", Array)
], PermissionTreePayloadDto.prototype, "children", void 0);
/**
 * 权限树请求体
 * @description 包含 PC 权限树和普通权限树
 */
class PermissionTreesDto {
    /**
     * PC 权限树
     */
    pcTree;
    /**
     * 普通权限树
     */
    normalTree;
}
exports.PermissionTreesDto = PermissionTreesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'PC 权限树', type: [PermissionTreePayloadDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PermissionTreePayloadDto),
    __metadata("design:type", Array)
], PermissionTreesDto.prototype, "pcTree", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '普通权限树', type: [PermissionTreePayloadDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PermissionTreePayloadDto),
    __metadata("design:type", Array)
], PermissionTreesDto.prototype, "normalTree", void 0);
/**
 * 更新权限池请求 DTO
 * @description 更新应用类型权限池配置
 */
class UpdatePermissionPoolDto {
    /**
     * 权限树配置
     */
    permissionTrees;
}
exports.UpdatePermissionPoolDto = UpdatePermissionPoolDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限树配置', type: PermissionTreesDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PermissionTreesDto),
    __metadata("design:type", PermissionTreesDto)
], UpdatePermissionPoolDto.prototype, "permissionTrees", void 0);
//# sourceMappingURL=update-permission-pool.dto.js.map