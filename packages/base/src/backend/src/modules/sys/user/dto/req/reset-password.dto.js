"use strict";
/**
 * @fileoverview 重置密码请求 DTO
 * @description 重置用户密码的请求参数
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
exports.ResetPasswordDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
/**
 * 重置密码请求 DTO
 */
class ResetPasswordDto {
    password;
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '新密码', example: 'Test@123' }),
    (0, class_validator_1.IsNotEmpty)({ message: '密码不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 32, { message: '密码长度应在 6-32 字符之间' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, {
        message: '密码必须包含至少一个字母和一个数字',
    }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
//# sourceMappingURL=reset-password.dto.js.map