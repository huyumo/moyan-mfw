"use strict";
/**
 * @fileoverview 创建广告内容请求 DTO
 * @description 创建广告的请求参数
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
exports.CreateAdDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateAdDto {
    placementId;
    title;
    imageUrl;
    linkType;
    linkUrl;
    miniAppId;
    miniAppPath;
    internalRoute;
    startTime;
    endTime;
    sortOrder = 0;
}
exports.CreateAdDto = CreateAdDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告位 ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '广告位不能为空' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAdDto.prototype, "placementId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告标题', example: '双十一大促' }),
    (0, class_validator_1.IsNotEmpty)({ message: '广告标题不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128, { message: '标题长度不能超过 128 个字符' }),
    __metadata("design:type", String)
], CreateAdDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '广告图片 URL' }),
    (0, class_validator_1.IsNotEmpty)({ message: '广告图片不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateAdDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '跳转类型', enum: ['miniapp', 'internal', 'external'], example: 'miniapp' }),
    (0, class_validator_1.IsNotEmpty)({ message: '跳转类型不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['miniapp', 'internal', 'external'], { message: '跳转类型只能是 miniapp / internal / external' }),
    __metadata("design:type", String)
], CreateAdDto.prototype, "linkType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '跳转链接', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateAdDto.prototype, "linkUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '小程序 AppId（linkType=miniapp 时）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateAdDto.prototype, "miniAppId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '小程序路径（linkType=miniapp 时）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateAdDto.prototype, "miniAppPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'App 内部路由路径（linkType=internal 时）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateAdDto.prototype, "internalRoute", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '投放开始时间', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAdDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '投放结束时间', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAdDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAdDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=create-ad.dto.js.map