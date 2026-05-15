"use strict";
/**
 * @fileoverview 应用响应 DTO
 * @description 应用实例信息的响应数据结构
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
exports.AppDetailResponseDto = exports.AppResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const common_1 = require("@/common");
/**
 * 应用响应 DTO
 */
class AppResponseDto {
    /**
     * 应用 ID
     */
    id;
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
     * 拥有者 ID
     */
    ownerId;
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
    /**
     * 创建时间
     */
    createdAt;
    /**
     * 更新时间
     */
    updateAt;
}
exports.AppResponseDto = AppResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AppResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AppResponseDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用名称' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AppResponseDto.prototype, "appName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用编码' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AppResponseDto.prototype, "appCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用描述' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AppResponseDto.prototype, "appDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '拥有者 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AppResponseDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用 Logo', type: common_1.ImageResourceDto }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", typeof (_a = typeof common_1.ImageResourceDto !== "undefined" && common_1.ImageResourceDto) === "function" ? _a : Object)
], AppResponseDto.prototype, "logo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用状态' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], AppResponseDto.prototype, "appStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], AppResponseDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], AppResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], AppResponseDto.prototype, "updateAt", void 0);
/**
 * 应用详情响应 DTO（包含关联信息）
 */
class AppDetailResponseDto extends AppResponseDto {
    /**
     * 应用类型信息
     */
    appType;
    /**
     * 拥有者信息
     */
    owner;
}
exports.AppDetailResponseDto = AppDetailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型信息' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], AppDetailResponseDto.prototype, "appType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '拥有者信息' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], AppDetailResponseDto.prototype, "owner", void 0);
//# sourceMappingURL=app-response.dto.js.map