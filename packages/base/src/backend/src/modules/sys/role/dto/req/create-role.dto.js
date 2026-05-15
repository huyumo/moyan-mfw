"use strict";
/**
 * @fileoverview 创建角色请求 DTO
 * @description 创建角色的请求参数
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
exports.CreateRoleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * 创建角色请求 DTO
 */
class CreateRoleDto {
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
     * 排序号
     */
    sortOrder = 0;
    /**
     * 是否内置
     */
    isBuiltin = 0;
}
exports.CreateRoleDto = CreateRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色名称', example: '管理员' }),
    (0, class_validator_1.IsNotEmpty)({ message: '角色名称不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "roleName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色编码', example: 'admin' }),
    (0, class_validator_1.IsNotEmpty)({ message: '角色编码不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "roleCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "roleDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用实例 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "appId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号', default: 0, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateRoleDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否内置', default: 0, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], CreateRoleDto.prototype, "isBuiltin", void 0);
//# sourceMappingURL=create-role.dto.js.map