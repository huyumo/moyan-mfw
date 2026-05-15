"use strict";
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
exports.AdminCreateUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const user_base_dto_1 = require("./user-base.dto");
class AdminCreateUserDto extends user_base_dto_1.UserBaseDto {
    username;
    phone;
}
exports.AdminCreateUserDto = AdminCreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户名', example: 'zhangsan' }),
    (0, class_validator_1.IsNotEmpty)({ message: '用户名不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 20, { message: '用户名长度应在 2-20 字符之间' }),
    (0, class_validator_1.Matches)(/^[a-zA-Z][a-zA-Z0-9]{0,19}$/, {
        message: '用户名须以字母开头，仅允许字母和数字',
    }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '手机号', example: '13800138000' }),
    (0, class_validator_1.IsNotEmpty)({ message: '手机号不能为空' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 20, { message: '手机号长度应在 20 字符以内' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "phone", void 0);
//# sourceMappingURL=admin-create-user.dto.js.map