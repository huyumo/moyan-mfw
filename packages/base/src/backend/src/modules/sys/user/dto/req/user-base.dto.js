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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBaseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const common_1 = require("@/common");
/**
 * 用户公共字段基类
 * @description CreateUserDto / AdminCreateUserDto / UpdateUserDto 共享字段
 */
class UserBaseDto {
    nickname;
    avatar;
    gender;
}
exports.UserBaseDto = UserBaseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '昵称', example: '张三', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 64, { message: '昵称长度应在 1-64 字符之间' }),
    __metadata("design:type", String)
], UserBaseDto.prototype, "nickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '头像', required: false, type: common_1.ImageResourceDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => common_1.ImageResourceDto),
    __metadata("design:type", typeof (_a = typeof common_1.ImageResourceDto !== "undefined" && common_1.ImageResourceDto) === "function" ? _a : Object)
], UserBaseDto.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '性别 (0:未知 1:男 2:女)', default: 0, required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UserBaseDto.prototype, "gender", void 0);
//# sourceMappingURL=user-base.dto.js.map