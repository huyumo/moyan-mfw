"use strict";
/**
 * @fileoverview 认证响应 DTO
 * @description 登录响应数据结构
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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAppsResponseDto = exports.AppInstanceItemDto = exports.UserInfoDto = exports.LoginResponseDto = exports.UserSummaryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@/common");
/**
 * 用户信息 DTO（登录响应中嵌套使用）
 */
class UserSummaryDto {
    /**
     * 用户名
     */
    username;
    /**
     * 昵称
     */
    nickname;
    /**
     * 头像
     */
    avatar;
}
exports.UserSummaryDto = UserSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户名' }),
    __metadata("design:type", String)
], UserSummaryDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '昵称' }),
    __metadata("design:type", String)
], UserSummaryDto.prototype, "nickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '头像', type: common_1.ImageResourceDto }),
    __metadata("design:type", typeof (_a = typeof common_1.ImageResourceDto !== "undefined" && common_1.ImageResourceDto) === "function" ? _a : Object)
], UserSummaryDto.prototype, "avatar", void 0);
/**
 * 登录响应 DTO
 */
class LoginResponseDto {
    /**
     * 访问 Token
     */
    accessToken;
    /**
     * 刷新 Token
     */
    refreshToken;
    /**
     * Token 类型
     */
    tokenType;
    /**
     * 过期时间（秒）
     */
    expiresIn;
    /**
     * 用户信息
     */
    user;
}
exports.LoginResponseDto = LoginResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '访问 Token' }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '刷新 Token' }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Token 类型', example: 'Bearer' }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "tokenType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '过期时间（秒）', example: 86400 }),
    __metadata("design:type", Number)
], LoginResponseDto.prototype, "expiresIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户信息', type: UserSummaryDto }),
    __metadata("design:type", UserSummaryDto)
], LoginResponseDto.prototype, "user", void 0);
/**
 * 用户信息响应 DTO
 */
class UserInfoDto {
    /**
     * 用户 ID
     */
    id;
    /**
     * 用户名
     */
    username;
    /**
     * 昵称
     */
    nickname;
    /**
     * 头像
     */
    avatar;
    /**
     * 角色列表
     */
    roles;
}
exports.UserInfoDto = UserInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户 ID' }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户名' }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '昵称' }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "nickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '头像', type: common_1.ImageResourceDto }),
    __metadata("design:type", typeof (_b = typeof common_1.ImageResourceDto !== "undefined" && common_1.ImageResourceDto) === "function" ? _b : Object)
], UserInfoDto.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色列表', type: [String] }),
    __metadata("design:type", Array)
], UserInfoDto.prototype, "roles", void 0);
/**
 * 应用实例项 DTO
 * @description 用户可访问的应用实例信息
 */
class AppInstanceItemDto {
    /**
     * 应用实例 ID
     */
    appId;
    /**
     * 应用实例名称
     */
    appName;
    /**
     * 应用实例编码
     */
    appCode;
    /**
     * 应用类型 ID
     */
    appTypeId;
    /**
     * 应用类型编码
     */
    appTypeCode;
    /**
     * 应用类型名称
     */
    appTypeName;
    /**
     * 用户身份
     */
    role;
    /**
     * 应用 Logo
     */
    logo;
}
exports.AppInstanceItemDto = AppInstanceItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用实例 ID' }),
    __metadata("design:type", String)
], AppInstanceItemDto.prototype, "appId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用实例名称' }),
    __metadata("design:type", String)
], AppInstanceItemDto.prototype, "appName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用实例编码' }),
    __metadata("design:type", String)
], AppInstanceItemDto.prototype, "appCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID' }),
    __metadata("design:type", String)
], AppInstanceItemDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型编码' }),
    __metadata("design:type", String)
], AppInstanceItemDto.prototype, "appTypeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型名称' }),
    __metadata("design:type", String)
], AppInstanceItemDto.prototype, "appTypeName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户身份', enum: ['owner', 'member'] }),
    __metadata("design:type", String)
], AppInstanceItemDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用 Logo', required: false, type: common_1.ImageResourceDto }),
    __metadata("design:type", typeof (_c = typeof common_1.ImageResourceDto !== "undefined" && common_1.ImageResourceDto) === "function" ? _c : Object)
], AppInstanceItemDto.prototype, "logo", void 0);
/**
 * 用户应用列表响应 DTO
 */
class UserAppsResponseDto {
    /**
     * 应用实例列表
     */
    apps;
}
exports.UserAppsResponseDto = UserAppsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户可访问的应用实例列表', type: [AppInstanceItemDto] }),
    __metadata("design:type", Array)
], UserAppsResponseDto.prototype, "apps", void 0);
//# sourceMappingURL=auth-response.dto.js.map