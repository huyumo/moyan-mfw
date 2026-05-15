"use strict";
/**
 * @fileoverview 创建广告类型配置请求 DTO
 * @description 创建广告位类型配置的请求参数
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
exports.CreateAdPlacementTypeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateAdPlacementTypeDto {
    name;
    code;
    width;
    height;
    description;
    sortOrder = 0;
}
exports.CreateAdPlacementTypeDto = CreateAdPlacementTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型名称', example: '首页横幅' }),
    (0, class_validator_1.IsNotEmpty)({ message: '类型名称不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64, { message: '类型名称长度不能超过 64 个字符' }),
    __metadata("design:type", String)
], CreateAdPlacementTypeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型编码', example: 'home-banner' }),
    (0, class_validator_1.IsNotEmpty)({ message: '类型编码不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64, { message: '类型编码长度不能超过 64 个字符' }),
    __metadata("design:type", String)
], CreateAdPlacementTypeDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '宽度(px)', example: 750 }),
    (0, class_validator_1.IsNotEmpty)({ message: '宽度不能为空' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: '宽度必须大于 0' }),
    __metadata("design:type", Number)
], CreateAdPlacementTypeDto.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '高度(px)', example: 300 }),
    (0, class_validator_1.IsNotEmpty)({ message: '高度不能为空' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: '高度必须大于 0' }),
    __metadata("design:type", Number)
], CreateAdPlacementTypeDto.prototype, "height", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdPlacementTypeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAdPlacementTypeDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=create-ad-placement-type.dto.js.map