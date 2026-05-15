"use strict";
/**
 * @fileoverview 广告位查询参数 DTO
 * @description 广告位列表查询参数
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
exports.QueryAdPlacementDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const backend_1 = require("moyan-mfw-base/backend");
class QueryAdPlacementDto extends backend_1.PaginationQueryDto {
    name;
    code;
    placementTypeId;
    status;
}
exports.QueryAdPlacementDto = QueryAdPlacementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位名称（模糊查询）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAdPlacementDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位编码（模糊查询）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAdPlacementDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位类型 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAdPlacementDto.prototype, "placementTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态', enum: [0, 1], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], QueryAdPlacementDto.prototype, "status", void 0);
//# sourceMappingURL=query-ad-placement.dto.js.map