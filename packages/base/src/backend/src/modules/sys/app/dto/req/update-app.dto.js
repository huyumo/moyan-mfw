"use strict";
/**
 * @fileoverview 更新应用请求 DTO
 * @description 更新应用实例的请求参数
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
exports.UpdateAppDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const common_1 = require("@/common");
/**
 * 更新应用请求 DTO
 */
class UpdateAppDto {
    /**
     * 应用编码
     */
    appCode;
    /**
     * 应用名称
     */
    appName;
    /**
     * 应用描述
     */
    appDesc;
    /**
     * 应用 Logo
     */
    logo;
    /**
     * 应用状态
     */
    appStatus;
    /**
     * 排序号
     */
    sortOrder;
}
exports.UpdateAppDto = UpdateAppDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用编码', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppDto.prototype, "appCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppDto.prototype, "appName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppDto.prototype, "appDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用 Logo', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => common_1.ImageResourceDto),
    __metadata("design:type", typeof (_a = typeof common_1.ImageResourceDto !== "undefined" && common_1.ImageResourceDto) === "function" ? _a : Object)
], UpdateAppDto.prototype, "logo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用状态 (1:启用 0:禁用)', required: false, enum: [0, 1] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateAppDto.prototype, "appStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateAppDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=update-app.dto.js.map