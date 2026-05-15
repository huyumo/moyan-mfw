"use strict";
/**
 * @fileoverview 应用类型查询参数 DTO
 * @description 应用类型列表查询参数
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
exports.QueryAppTypeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const common_1 = require("../../../../../common");
/**
 * 应用类型查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
class QueryAppTypeDto extends common_1.PaginationQueryDto {
    /**
     * 类型名称（模糊查询）
     */
    typeName;
    /**
     * 类型编码（模糊查询）
     */
    typeCode;
    /**
     * 类型状态
     */
    typeStatus;
    /**
     * 排序字段
     * @default 'sortOrder'
     */
    sortField = 'sortOrder';
}
exports.QueryAppTypeDto = QueryAppTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型名称（模糊查询）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAppTypeDto.prototype, "typeName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型编码（模糊查询）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAppTypeDto.prototype, "typeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型状态', enum: [0, 1], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], QueryAppTypeDto.prototype, "typeStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序字段', default: 'sortOrder', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAppTypeDto.prototype, "sortField", void 0);
//# sourceMappingURL=query-app-type.dto.js.map