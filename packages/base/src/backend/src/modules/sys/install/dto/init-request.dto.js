"use strict";
/**
 * @fileoverview 初始化请求 DTO
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
exports.InitRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * 初始化请求 DTO
 */
class InitRequestDto {
    adminPassword;
}
exports.InitRequestDto = InitRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '管理员密码', example: 'Admin@123', minLength: 8, maxLength: 32 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], InitRequestDto.prototype, "adminPassword", void 0);
//# sourceMappingURL=init-request.dto.js.map