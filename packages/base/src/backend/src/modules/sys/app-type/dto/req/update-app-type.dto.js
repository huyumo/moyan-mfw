"use strict";
/**
 * @fileoverview 更新应用类型请求 DTO
 * @description 更新应用类型的请求参数
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
exports.UpdateAppTypeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * 更新应用类型请求 DTO
 */
class UpdateAppTypeDto {
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
    multiAppEnabled;
    /**
     * 类型状态
     */
    typeStatus;
    /**
     * 排序号
     */
    sortOrder;
}
exports.UpdateAppTypeDto = UpdateAppTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppTypeDto.prototype, "typeName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型编码', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppTypeDto.prototype, "typeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppTypeDto.prototype, "typeDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图标 URL 或图标名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppTypeDto.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否支持多应用', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], UpdateAppTypeDto.prototype, "multiAppEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型状态', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], UpdateAppTypeDto.prototype, "typeStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateAppTypeDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=update-app-type.dto.js.map