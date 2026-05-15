"use strict";
/**
 * @fileoverview 用户角色关联实体
 * @description 用户与角色的多对多关联关系，通过 appId 实现应用实例级隔离
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
exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../user/entities/user.entity");
const role_entity_1 = require("./role.entity");
/**
 * 用户角色关联实体
 * @description 记录用户在指定应用实例下的角色分配，每个 UserRole 必须绑定到具体应用实例
 */
let UserRole = class UserRole {
    /**
     * 主键 ID
     */
    id;
    /**
     * 用户 ID
     */
    userId;
    /**
     * 用户
     */
    user;
    /**
     * 角色 ID
     */
    roleId;
    /**
     * 角色
     */
    role;
    /**
     * 应用实例 ID
     * @description 角色分配所属的应用实例，每个 UserRole 必须绑定到一个具体的应用实例
     */
    appId;
};
exports.UserRole = UserRole;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserRole.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '用户 ID' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserRole.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], UserRole.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '角色 ID' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserRole.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role),
    (0, typeorm_1.JoinColumn)({ name: 'roleId' }),
    __metadata("design:type", role_entity_1.Role)
], UserRole.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '应用实例 ID - 角色分配所属的具体应用实例' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], UserRole.prototype, "appId", void 0);
exports.UserRole = UserRole = __decorate([
    (0, typeorm_1.Entity)('sys_user_roles'),
    (0, typeorm_1.Unique)(['userId', 'roleId', 'appId'])
], UserRole);
//# sourceMappingURL=user-role.entity.js.map