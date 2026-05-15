"use strict";
/**
 * @fileoverview 创建权限请求 DTO
 * @description 创建权限的请求参数
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
exports.CreatePermissionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const permission_entity_1 = require("../../entities/permission.entity");
/**
 * 创建权限请求 DTO
 */
class CreatePermissionDto {
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
     * 权限类型
     */
    permissionType;
    /**
     * 节点类型
     */
    nodeType;
    /**
     * 父权限 ID
     */
    parentId;
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
    sortOrder = 0;
    /**
     * 是否可见
     */
    isVisible = 1;
    /**
     * 是否缓存
     */
    isCache = 1;
    /**
     * 显示模式
     */
    showMode = permission_entity_1.ShowMode.NORMAL;
    /**
     * 权限状态
     */
    permStatus = 1;
    /**
     * 权限值（位运算）
     */
    permissionValue = 0n;
}
exports.CreatePermissionDto = CreatePermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限名称', example: '用户列表' }),
    (0, class_validator_1.IsNotEmpty)({ message: '权限名称不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "permName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限编码', example: 'system:user-list' }),
    (0, class_validator_1.IsNotEmpty)({ message: '权限编码不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "permCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "permDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限类型', enum: permission_entity_1.PermissionType, default: permission_entity_1.PermissionType.NORMAL }),
    (0, class_validator_1.IsNotEmpty)({ message: '权限类型不能为空' }),
    (0, class_validator_1.IsEnum)(permission_entity_1.PermissionType),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "permissionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '节点类型', enum: permission_entity_1.NodeType, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(permission_entity_1.NodeType),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "nodeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '父权限 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "parentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '路由路径', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "routePath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '外部链接', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "externalUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图标名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "iconName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号', default: 0, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePermissionDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否可见', default: 1, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], CreatePermissionDto.prototype, "isVisible", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否缓存', default: 1, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], CreatePermissionDto.prototype, "isCache", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '显示模式', enum: permission_entity_1.ShowMode, default: permission_entity_1.ShowMode.NORMAL }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(permission_entity_1.ShowMode),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "showMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限状态', default: 1, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], CreatePermissionDto.prototype, "permStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限值（位运算）', default: 0, required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", BigInt)
], CreatePermissionDto.prototype, "permissionValue", void 0);
//# sourceMappingURL=create-permission.dto.js.map