"use strict";
/**
 * @fileoverview 成员响应 DTO
 * @description 应用成员信息的响应数据结构
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailableAvailableRoleDto = exports.MemberResponseDto = exports.MemberRoleInfoDto = exports.MemberUserInfoDto = void 0;
const auth_1 = require("@/modules/sys/auth");
const role_1 = require("@/modules/sys/role");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const common_1 = require("@/common");
class MemberUserInfoDto extends (0, swagger_1.PickType)(auth_1.UserInfoDto, [
    'id',
    'username',
    'nickname',
    'avatar'
]) {
}
exports.MemberUserInfoDto = MemberUserInfoDto;
class MemberRoleInfoDto extends (0, swagger_1.PickType)(role_1.RoleResponseDto, [
    'roleName',
    'roleCode',
    'isBuiltin'
]) {
    roleId;
}
exports.MemberRoleInfoDto = MemberRoleInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberRoleInfoDto.prototype, "roleId", void 0);
/**
 * 成员响应 DTO
 */
class MemberResponseDto {
    /**
     * 成员 ID（应用 - 成员关联 ID）
     */
    id;
    /**
     * 应用 ID
     */
    appId;
    /**
     * 用户 ID
     */
    userId;
    /**
     * 创建时间
     */
    createdAt;
    /**
     * 用户昵称
     */
    nickname;
    /**
     * 用户头像
     */
    avatar;
    /**
     * 用户邮箱
     */
    email;
    /**
     * 用户手机号
     */
    phone;
    /**
     * 用户名
     */
    username;
    /**
     * 应用编码
     */
    appCode;
    /**
     * 应用名称
     */
    appName;
    /**
     * 应用 Logo
     */
    appLogo;
    /**
     * 拥有者 ID
     */
    ownerId;
    /**
     * 排序序号
     */
    sortOrder;
    /**
     * 应用类型 ID
     */
    appTypeId;
    /**
     * 角色列表
     */
    roles;
    /**
     * 是否拥有者角色
     */
    isOwner;
}
exports.MemberResponseDto = MemberResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '成员 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "appId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], MemberResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户昵称' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "nickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户头像' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户邮箱' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户手机号' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户名' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用编码' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "appCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用名称' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "appName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用 Logo' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", typeof (_a = typeof common_1.ImageResourceDto !== "undefined" && common_1.ImageResourceDto) === "function" ? _a : Object)
], MemberResponseDto.prototype, "appLogo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '拥有者 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序序号' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], MemberResponseDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色列表', type: MemberRoleInfoDto, isArray: true }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Array)
], MemberResponseDto.prototype, "roles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否拥有者角色', type: Number, enum() {
            return {
                0: '否',
                1: '是',
            };
        }, }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], MemberResponseDto.prototype, "isOwner", void 0);
/**
 * 可选角色响应 DTO
 */
class AvailableAvailableRoleDto {
    /**
     * 角色 ID
     */
    id;
    /**
     * 角色名称
     */
    roleName;
    /**
     * 角色编码
     */
    roleCode;
    /**
     * 是否内置角色
     */
    isBuiltin;
    /**
     * 是否拥有者角色
     */
    isOwner;
}
exports.AvailableAvailableRoleDto = AvailableAvailableRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AvailableAvailableRoleDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色名称' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AvailableAvailableRoleDto.prototype, "roleName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '角色编码' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AvailableAvailableRoleDto.prototype, "roleCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否内置角色' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], AvailableAvailableRoleDto.prototype, "isBuiltin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否拥有者角色' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], AvailableAvailableRoleDto.prototype, "isOwner", void 0);
//# sourceMappingURL=member-response.dto.js.map