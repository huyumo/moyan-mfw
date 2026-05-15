"use strict";
/**
 * @fileoverview 更新广告位请求 DTO
 * @description 更新广告位的请求参数
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
exports.UpdateAdPlacementDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateAdPlacementDto {
    name;
    code;
    placementTypeId;
    description;
    status;
    sortOrder;
}
exports.UpdateAdPlacementDto = UpdateAdPlacementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], UpdateAdPlacementDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位编码', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], UpdateAdPlacementDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位类型 ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateAdPlacementDto.prototype, "placementTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdPlacementDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态: 1=启用 0=禁用', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateAdPlacementDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateAdPlacementDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=update-ad-placement.dto.js.map