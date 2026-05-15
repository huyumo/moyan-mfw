"use strict";
/**
 * @fileoverview 更新权限请求 DTO
 * @description 更新权限的请求参数
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
exports.UpdatePermissionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const permission_entity_1 = require("../../entities/permission.entity");
/**
 * 更新权限请求 DTO
 */
class UpdatePermissionDto {
    /**
     * 权限名称
     */
    permName;
    /**
     * 权限编码
     */
    permCode;
    /**
     * 权限描述
     */
    permDesc;
    /**
     * 节点类型
     */
    nodeType;
    /**
     * 路由路径
     */
    routePath;
    /**
     * 外部链接
     */
    externalUrl;
    /**
     * 图标名称
     */
    iconName;
    /**
     * 排序号
     */
    sortOrder;
    /**
     * 是否可见
     */
    isVisible;
    /**
     * 是否缓存
     */
    isCache;
    /**
     * 显示模式
     */
    showMode;
    /**
     * 权限状态
     */
    permStatus;
    /**
     * 权限值（位运算）
     */
    permissionValue;
}
exports.UpdatePermissionDto = UpdatePermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "permName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限编码', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "permCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "permDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '节点类型', enum: permission_entity_1.NodeType, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(permission_entity_1.NodeType),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "nodeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '路由路径', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "routePath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '外部链接', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "externalUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图标名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "iconName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePermissionDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否可见', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], UpdatePermissionDto.prototype, "isVisible", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否缓存', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], UpdatePermissionDto.prototype, "isCache", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '显示模式', enum: permission_entity_1.ShowMode, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(permission_entity_1.ShowMode),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "showMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限状态', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], UpdatePermissionDto.prototype, "permStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限值（位运算）', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", BigInt)
], UpdatePermissionDto.prototype, "permissionValue", void 0);
//# sourceMappingURL=update-permission.dto.js.map