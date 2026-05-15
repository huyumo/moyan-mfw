"use strict";
/**
 * @fileoverview 创建应用类型请求 DTO
 * @description 创建应用类型的请求参数
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
exports.CreateAppTypeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * 创建应用类型请求 DTO
 */
class CreateAppTypeDto {
    /**
     * 类型名称
     */
    typeName;
    /**
     * 类型编码
     */
    typeCode;
    /**
     * 类型描述
     */
    typeDesc;
    /**
     * 图标
     */
    icon;
    /**
     * 是否支持多应用
     */
    multiAppEnabled = 0;
    /**
     * 类型状态
     */
    typeStatus = 1;
    /**
     * 排序号
     */
    sortOrder = 0;
}
exports.CreateAppTypeDto = CreateAppTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型名称', example: 'Web 应用' }),
    (0, class_validator_1.IsNotEmpty)({ message: '类型名称不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppTypeDto.prototype, "typeName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型编码', example: 'web' }),
    (0, class_validator_1.IsNotEmpty)({ message: '类型编码不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppTypeDto.prototype, "typeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppTypeDto.prototype, "typeDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图标 URL 或图标名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppTypeDto.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否支持多应用', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], CreateAppTypeDto.prototype, "multiAppEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型状态', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], CreateAppTypeDto.prototype, "typeStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAppTypeDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=create-app-type.dto.js.map