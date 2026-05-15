"use strict";
/**
 * @fileoverview 用户实体
 * @description 系统用户基础实体，存储用户登录和基本信息
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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../common/entities/base.entity");
const common_1 = require("@/common");
const shared_1 = require("moyan-mfw-base/shared");
/**
 * 用户实体类
 * @description 系统用户基础表，存储用户登录和基本信息
 */
let User = class User extends base_entity_1.Base {
    /**
     * 用户 ID
     * @description 主键，UUID 格式
     */
    id;
    /**
     * 用户名
     * @description 登录账号 - 用户登录系统的唯一标识，全局唯一，支持邮箱/手机号/自定义用户名
     */
    username;
    /**
     * 密码哈希
     * @description 使用 bcrypt 加密存储，盐值 rounds=10
     */
    password;
    /**
     * 昵称
     * @description 用户昵称 - 用于前台展示的用户名称，支持中文、字母、数字，长度 2-50 字符
     */
    nickname;
    /**
     * 手机号
     * @description 用户手机号 - 用于接收通知和找回密码，全球唯一
     */
    phone;
    /**
     * 邮箱
     * @description 用户邮箱 - 用于接收通知和找回密码
     */
    email;
    /**
     * 头像
     * @description 用户头像 - ImageResource 对象
     */
    avatar;
    /**
     * 性别
     * @description 性别 - 0:未知 1:男 2:女
     */
    gender;
    /**
     * 用户状态
     * @description 状态 - 1:启用 0:禁用 - 控制用户是否可登录系统
     */
    userStatus;
    /**
     * 是否开发者
     * @description 是否开发者标记 - 开发者拥有系统全部权限
     */
    isDeveloper;
    /**
     * 关联角色
     * @description 用户关联的所有角色，通过 sys_user_role 关联表管理
     */
    // 注：实际关系通过 UserRole 实体管理，避免循环依赖
    roles;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '登录账号 - 用户登录系统的唯一标识，全局唯一' }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, comment: '密码哈希 - 使用 bcrypt 加密存储，盐值 rounds=10' }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true, comment: '用户昵称 - 用于前台展示，支持中文、字母、数字' }),
    __metadata("design:type", String)
], User.prototype, "nickname", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true, comment: '手机号 - 用于接收通知和找回密码，全球唯一' }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, nullable: true, comment: '邮箱 - 用于接收通知和找回密码' }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true, comment: '头像 - ImageResource 对象' }),
    __metadata("design:type", typeof (_a = typeof common_1.ImageResourceDto !== "undefined" && common_1.ImageResourceDto) === "function" ? _a : Object)
], User.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.GenderDict.UNKNOWN, comment: (0, shared_1.toDescription)(shared_1.GenderDict) }),
    __metadata("design:type", Number)
], User.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.StatusDict.ENABLED, comment: (0, shared_1.toDescription)(shared_1.StatusDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], User.prototype, "userStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.DeveloperDict.NO, comment: (0, shared_1.toDescription)(shared_1.DeveloperDict) }),
    __metadata("design:type", Number)
], User.prototype, "isDeveloper", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('sys_users'),
    (0, typeorm_1.Unique)(['username']),
    (0, typeorm_1.Unique)(['phone'])
], User);
//# sourceMappingURL=user.entity.js.map