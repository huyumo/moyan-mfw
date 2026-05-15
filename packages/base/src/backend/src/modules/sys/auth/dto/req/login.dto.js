"use strict";
/**
 * @fileoverview 登录请求 DTO
 * @description 用户登录请求参数
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
exports.LoginDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * 登录请求 DTO
 */
class LoginDto {
    /**
     * 用户名
     */
    username;
    /**
     * 密码
     */
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户名', example: 'admin' }),
    (0, class_validator_1.IsNotEmpty)({ message: '用户名不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 64, { message: '用户名长度应在 2-64 字符之间' }),
    __metadata("design:type", String)
], LoginDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '密码', example: '123456' }),
    (0, class_validator_1.IsNotEmpty)({ message: '密码不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 32, { message: '密码长度应在 6-32 字符之间' }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
//# sourceMappingURL=login.dto.js.map