"use strict";
/**
 * @fileoverview 应用类型响应 DTO
 * @description 应用类型信息的响应数据结构
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
exports.AppTypeResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
/**
 * 应用类型响应 DTO
 */
class AppTypeResponseDto {
    /**
     * 应用类型 ID
     */
    id;
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
    /**
     * 创建时间
     */
    createdAt;
    /**
     * 更新时间
     */
    updateAt;
    builtinRoleCount;
}
exports.AppTypeResponseDto = AppTypeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AppTypeResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型名称' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AppTypeResponseDto.prototype, "typeName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型编码' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AppTypeResponseDto.prototype, "typeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型描述' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AppTypeResponseDto.prototype, "typeDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图标' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AppTypeResponseDto.prototype, "icon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否支持多应用' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], AppTypeResponseDto.prototype, "multiAppEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型状态' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], AppTypeResponseDto.prototype, "typeStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序号' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], AppTypeResponseDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], AppTypeResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], AppTypeResponseDto.prototype, "updateAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '内置角色数量' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], AppTypeResponseDto.prototype, "builtinRoleCount", void 0);
//# sourceMappingURL=app-type-response.dto.js.map