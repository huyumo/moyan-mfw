"use strict";
/**
 * @fileoverview 创建用户请求 DTO
 * @description 创建用户的请求参数
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
exports.CreateUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const user_base_dto_1 = require("./user-base.dto");
/**
 * 创建用户请求 DTO
 */
class CreateUserDto extends user_base_dto_1.UserBaseDto {
    username;
    password;
    phone;
    email;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户名', example: 'zhangsan' }),
    (0, class_validator_1.IsNotEmpty)({ message: '用户名不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 64, { message: '用户名长度应在 2-64 字符之间' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '密码', example: 'Test@123' }),
    (0, class_validator_1.IsNotEmpty)({ message: '密码不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 32, { message: '密码长度应在 6-32 字符之间' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, {
        message: '密码必须包含至少一个字母和一个数字',
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '手机号', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 20, { message: '手机号长度应在 20 字符以内' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '邮箱', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: '邮箱格式不正确' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
//# sourceMappingURL=create-user.dto.js.map