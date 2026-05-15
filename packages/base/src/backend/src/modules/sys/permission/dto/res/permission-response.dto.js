"use strict";
/**
 * @fileoverview 权限响应 DTO
 * @description 权限信息的响应数据结构
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
exports.PermissionResponseDto = exports.PermissionTreeNodeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const permission_entity_1 = require("../../entities/permission.entity");
/**
 * 权限树节点 DTO
 * 用于返回树形结构的权限数据
 */
class PermissionTreeNodeDto {
    /**
     * 权限 ID
     */
    id;
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
     * 是否选中
     */
    checked;
    /**
     * 是否自动同步
     */
    isAutoSync;
    /**
     * 权限值（位运算）
     */
    permissionValue;
    /**
     * 父权限值（位运算）
     */
    parentPermissionValue;
    /**
     * 子权限列表
     */
    children;
    /**
     * 创建时间
     */
    createdAt;
    /**
     * 更新时间
     */
    updateAt;
}
exports.PermissionTreeNodeDto = PermissionTreeNodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限名称' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "permName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限编码' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "permCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限描述', required: false }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "permDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限类型', enum: permission_entity_1.PermissionType }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "permissionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '节点类型', enum: permission_entity_1.NodeType }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "nodeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '父权限 ID', required: false }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "parentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '路由路径', required: false }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "routePath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '外部链接', required: false }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "externalUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图标名称', required: false }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "iconName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], PermissionTreeNodeDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否可见' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], PermissionTreeNodeDto.prototype, "isVisible", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否缓存' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], PermissionTreeNodeDto.prototype, "isCache", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '显示模式', enum: permission_entity_1.ShowMode }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "showMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限状态' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], PermissionTreeNodeDto.prototype, "permStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否选中' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean)
], PermissionTreeNodeDto.prototype, "checked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否自动同步：1=同步生成 0=手动添加', required: false }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], PermissionTreeNodeDto.prototype, "isAutoSync", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限值（位运算）', example: '7', required: false }),
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.toString()),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "permissionValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '父权限值（位运算）', example: '7', required: false }),
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.toString()),
    __metadata("design:type", String)
], PermissionTreeNodeDto.prototype, "parentPermissionValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '子权限列表', type: () => [PermissionTreeNodeDto], required: false }),
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => PermissionTreeNodeDto),
    __metadata("design:type", Array)
], PermissionTreeNodeDto.prototype, "children", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], PermissionTreeNodeDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], PermissionTreeNodeDto.prototype, "updateAt", void 0);
/**
 * 权限响应 DTO
 */
class PermissionResponseDto {
    /**
     * 权限 ID
     */
    id;
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
    /**
     * 创建时间
     */
    createdAt;
    /**
     * 更新时间
     */
    updateAt;
}
exports.PermissionResponseDto = PermissionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限名称' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "permName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限编码' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "permCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限描述' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "permDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限类型', enum: permission_entity_1.PermissionType }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "permissionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '节点类型', enum: permission_entity_1.NodeType }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "nodeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '父权限 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "parentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '路由路径' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "routePath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '外部链接' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "externalUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图标名称' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "iconName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], PermissionResponseDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否可见' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], PermissionResponseDto.prototype, "isVisible", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否缓存' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], PermissionResponseDto.prototype, "isCache", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '显示模式', enum: permission_entity_1.ShowMode }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "showMode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限状态' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], PermissionResponseDto.prototype, "permStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限值（位运算）', example: '7' }),
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.toString()),
    __metadata("design:type", String)
], PermissionResponseDto.prototype, "permissionValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], PermissionResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], PermissionResponseDto.prototype, "updateAt", void 0);
//# sourceMappingURL=permission-response.dto.js.map