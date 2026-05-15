"use strict";
/**
 * @fileoverview 应用查询参数 DTO
 * @description 应用列表查询参数
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
exports.QueryAppDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const common_1 = require("../../../../../common");
/**
 * 应用查询参数 DTO
 * @description 继承自 PaginationQueryDto，自动获得分页参数
 */
class QueryAppDto extends common_1.PaginationQueryDto {
    /**
     * 应用名称（模糊查询）
     */
    appName;
    /**
     * 应用编码（模糊查询）
     */
    appCode;
    /**
     * 应用类型 ID
     */
    appTypeId;
    /**
     * 拥有者 ID
     */
    ownerId;
    /**
     * 应用状态
     */
    appStatus;
}
exports.QueryAppDto = QueryAppDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用名称（模糊查询）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAppDto.prototype, "appName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用编码（模糊查询）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAppDto.prototype, "appCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAppDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '拥有者 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAppDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用状态', enum: [0, 1], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], QueryAppDto.prototype, "appStatus", void 0);
//# sourceMappingURL=query-app.dto.js.map