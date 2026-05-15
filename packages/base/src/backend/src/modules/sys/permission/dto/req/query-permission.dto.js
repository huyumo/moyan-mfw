"use strict";
/**
 * @fileoverview 权限查询参数 DTO
 * @description 权限列表查询参数
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
exports.QueryPermissionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const permission_entity_1 = require("../../entities/permission.entity");
const common_1 = require("../../../../../common");
/**
 * 权限查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
class QueryPermissionDto extends common_1.PaginationQueryDto {
    /**
     * 应用类型 ID
     */
    appTypeId;
    /**
     * 权限名称（模糊查询）
     */
    permName;
    /**
     * 权限编码（模糊查询）
     */
    permCode;
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
     * 排序字段
     * @default 'sortOrder'
     */
    sortField = 'sortOrder';
}
exports.QueryPermissionDto = QueryPermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryPermissionDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限名称（模糊查询）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryPermissionDto.prototype, "permName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限编码（模糊查询）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryPermissionDto.prototype, "permCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限类型', enum: permission_entity_1.PermissionType, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(permission_entity_1.PermissionType),
    __metadata("design:type", String)
], QueryPermissionDto.prototype, "permissionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '节点类型', enum: permission_entity_1.NodeType, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(permission_entity_1.NodeType),
    __metadata("design:type", String)
], QueryPermissionDto.prototype, "nodeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '父权限 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryPermissionDto.prototype, "parentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序字段', default: 'sortOrder', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryPermissionDto.prototype, "sortField", void 0);
//# sourceMappingURL=query-permission.dto.js.map