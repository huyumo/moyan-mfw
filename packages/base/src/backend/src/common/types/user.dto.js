"use strict";
/**
 * @fileoverview 用户 DTO
 * @description 从 JWT Token 中解析的用户信息，用于 @User() 装饰器
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
exports.UserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
/**
 * 用户 DTO
 * @description 从请求中获取的用户信息，由 AuthGuard 从 JWT Token 解析注入
 */
class UserDto {
    /**
     * 用户 ID
     */
    id;
    /**
     * 用户名
     */
    username;
    /**
     * 角色 ID 列表
     */
    roleIds;
}
exports.UserDto = UserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户 ID' }),
    __metadata("design:type", String)
], UserDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户名' }),
    __metadata("design:type", String)
], UserDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色 ID 列表', type: [String], required: false }),
    __metadata("design:type", Array)
], UserDto.prototype, "roleIds", void 0);
//# sourceMappingURL=user.dto.js.map