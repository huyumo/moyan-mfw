"use strict";
/**
 * @fileoverview 创建广告位请求 DTO
 * @description 创建广告位的请求参数
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
exports.CreateAdPlacementDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateAdPlacementDto {
    name;
    code;
    placementTypeId;
    description;
    sortOrder = 0;
}
exports.CreateAdPlacementDto = CreateAdPlacementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位名称', example: '首页顶部横幅' }),
    (0, class_validator_1.IsNotEmpty)({ message: '广告位名称不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64, { message: '广告位名称长度不能超过 64 个字符' }),
    __metadata("design:type", String)
], CreateAdPlacementDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位编码', example: 'home-top-banner' }),
    (0, class_validator_1.IsNotEmpty)({ message: '广告位编码不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64, { message: '广告位编码长度不能超过 64 个字符' }),
    __metadata("design:type", String)
], CreateAdPlacementDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位类型 ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '广告位类型不能为空' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAdPlacementDto.prototype, "placementTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdPlacementDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAdPlacementDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=create-ad-placement.dto.js.map