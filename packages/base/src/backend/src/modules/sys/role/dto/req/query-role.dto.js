"use strict";
/**
 * @fileoverview 角色查询参数 DTO
 * @description 角色列表查询参数
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
exports.QueryRoleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const common_1 = require("../../../../../common");
/**
 * 角色查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
class QueryRoleDto extends common_1.PaginationQueryDto {
    /**
     * 角色编码（模糊查询）
     */
    roleCode;
    /**
     * 角色名称（模糊查询）
     */
    roleName;
    /**
     * 角色状态
     */
    roleStatus;
    /**
     * 应用类型 ID
     */
    appTypeId;
    /**
     * 应用 ID
     */
    appId;
    /**
     * 排序字段
     * @default 'sortOrder'
     */
    sortField = 'sortOrder';
}
exports.QueryRoleDto = QueryRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色编码（模糊查询）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryRoleDto.prototype, "roleCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色名称（模糊查询）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryRoleDto.prototype, "roleName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色状态', enum: [0, 1], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], QueryRoleDto.prototype, "roleStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID，如果提供appId ，则appTypeId不必提供，以appId为准，否则提供appTypeId ，则只查询内置角色', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryRoleDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用 ID ，如果提供appId ，则appTypeId不必提供，以appId为准', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryRoleDto.prototype, "appId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序字段', default: 'sortOrder', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryRoleDto.prototype, "sortField", void 0);
//# sourceMappingURL=query-role.dto.js.map