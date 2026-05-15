"use strict";
/**
 * @fileoverview 初始化响应 DTO
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
exports.InitStatusResponseDto = exports.InitResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * 初始化响应 DTO
 */
class InitResponseDto {
    appTypeId;
    appId;
    adminUserId;
    message;
}
exports.InitResponseDto = InitResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID', example: 'f7eecf8d-0576-4935-bbc9-ca22b9b4bb9f' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitResponseDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用实例 ID', example: 'e38ef2a3-e5b4-4b9f-a4f3-1b5e15dc8814' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitResponseDto.prototype, "appId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '管理员用户 ID', example: '38deb03d-615b-4ade-93d0-e173d1af40d1' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitResponseDto.prototype, "adminUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '初始化消息', example: '初始化成功' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitResponseDto.prototype, "message", void 0);
/**
 * 初始化状态响应 DTO
 */
class InitStatusResponseDto {
    initialized;
}
exports.InitStatusResponseDto = InitStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否已初始化', example: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Boolean)
], InitStatusResponseDto.prototype, "initialized", void 0);
//# sourceMappingURL=init-response.dto.js.map