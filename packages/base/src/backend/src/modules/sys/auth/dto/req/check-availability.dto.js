"use strict";
/**
 * @fileoverview 检查可用性请求 DTO
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
exports.CheckAvailabilityResponseDto = exports.CheckAvailabilityDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * 检查用户名/邮箱/手机号可用性请求 DTO
 */
class CheckAvailabilityDto {
    username;
    email;
    phone;
}
exports.CheckAvailabilityDto = CheckAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户名',
        required: false,
        example: 'testuser',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckAvailabilityDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '邮箱',
        required: false,
        example: 'test@example.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckAvailabilityDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '手机号',
        required: false,
        example: '13800138000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckAvailabilityDto.prototype, "phone", void 0);
/**
 * 检查可用性响应 DTO
 */
class CheckAvailabilityResponseDto {
    usernameAvailable;
    emailAvailable;
    phoneAvailable;
}
exports.CheckAvailabilityResponseDto = CheckAvailabilityResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户名是否可用',
        example: true,
    }),
    __metadata("design:type", Boolean)
], CheckAvailabilityResponseDto.prototype, "usernameAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '邮箱是否可用',
        example: true,
    }),
    __metadata("design:type", Boolean)
], CheckAvailabilityResponseDto.prototype, "emailAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '手机号是否可用',
        example: true,
    }),
    __metadata("design:type", Boolean)
], CheckAvailabilityResponseDto.prototype, "phoneAvailable", void 0);
//# sourceMappingURL=check-availability.dto.js.map