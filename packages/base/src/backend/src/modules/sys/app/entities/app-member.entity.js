"use strict";
/**
 * @fileoverview 应用成员关联实体
 * @description 应用与成员的关联关系
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
exports.AppMember = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../common/entities/base.entity");
const app_entity_1 = require("./app.entity");
const user_entity_1 = require("../../user/entities/user.entity");
/**
 * 应用成员关联实体
 * @description 记录应用与成员的关联关系，包含成员在应用中的角色
 */
let AppMember = class AppMember extends base_entity_1.Base {
    /**
     * 主键 ID
     */
    id;
    /**
     * 应用 ID
     */
    appId;
    /**
     * 应用
     */
    app;
    /**
     * 用户 ID
     */
    userId;
    /**
     * 用户
     */
    user;
};
exports.AppMember = AppMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AppMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '应用 ID' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AppMember.prototype, "appId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => app_entity_1.App),
    (0, typeorm_1.JoinColumn)({ name: 'appId' }),
    __metadata("design:type", app_entity_1.App)
], AppMember.prototype, "app", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '用户 ID' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AppMember.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], AppMember.prototype, "user", void 0);
exports.AppMember = AppMember = __decorate([
    (0, typeorm_1.Entity)('sys_app_members'),
    (0, typeorm_1.Unique)(['appId', 'userId'])
], AppMember);
//# sourceMappingURL=app-member.entity.js.map