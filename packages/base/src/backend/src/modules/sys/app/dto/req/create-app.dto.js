"use strict";
/**
 * @fileoverview 创建应用请求 DTO
 * @description 创建应用实例的请求参数
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAppDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const common_1 = require("@/common");
/**
 * 创建应用请求 DTO
 */
class CreateAppDto {
    /**
     * 应用类型 ID
     */
    appTypeId;
    /**
     * 应用名称
     */
    appName;
    /**
     * 应用编码
     */
    appCode;
    /**
     * 应用描述
     */
    appDesc;
    /**
     * 应用 Logo
     */
    logo;
    /**
     * 排序号
     */
    sortOrder = 0;
}
exports.CreateAppDto = CreateAppDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '应用类型 ID 不能为空' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用名称', example: '商城系统-北京' }),
    (0, class_validator_1.IsNotEmpty)({ message: '应用名称不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "appName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用编码', example: 'mall-beijing' }),
    (0, class_validator_1.IsNotEmpty)({ message: '应用编码不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "appCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAppDto.prototype, "appDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用 Logo', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => common_1.ImageResourceDto),
    __metadata("design:type", typeof (_a = typeof common_1.ImageResourceDto !== "undefined" && common_1.ImageResourceDto) === "function" ? _a : Object)
], CreateAppDto.prototype, "logo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateAppDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=create-app.dto.js.map