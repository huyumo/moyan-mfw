"use strict";
/**
 * @fileoverview 角色权限关联实体
 * @description 角色与权限的多对多关联关系
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
exports.RolePermission = void 0;
const typeorm_1 = require("typeorm");
const role_entity_1 = require("./role.entity");
const permission_entity_1 = require("../../permission/entities/permission.entity");
/**
 * 角色权限关联实体
 * @description 记录角色与权限的关联关系及权限值
 */
let RolePermission = class RolePermission {
    /**
     * 主键 ID
     */
    id;
    /**
     * 角色 ID
     */
    roleId;
    /**
     * 角色
     */
    role;
    /**
     * 权限 ID
     */
    permissionId;
    /**
     * 权限
     */
    permission;
    /**
     * 权限值
     * @description 位运算权限值，定义角色在此权限点上的具体操作权限
     */
    permissionValue;
};
exports.RolePermission = RolePermission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RolePermission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '角色 ID' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], RolePermission.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role),
    (0, typeorm_1.JoinColumn)({ name: 'roleId' }),
    __metadata("design:type", role_entity_1.Role)
], RolePermission.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '权限 ID' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], RolePermission.prototype, "permissionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => permission_entity_1.Permission),
    (0, typeorm_1.JoinColumn)({ name: 'permissionId' }),
    __metadata("design:type", permission_entity_1.Permission)
], RolePermission.prototype, "permission", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', unsigned: true, comment: '权限值 - 位运算权限值，定义具体操作权限' }),
    __metadata("design:type", BigInt)
], RolePermission.prototype, "permissionValue", void 0);
exports.RolePermission = RolePermission = __decorate([
    (0, typeorm_1.Entity)('sys_role_permissions'),
    (0, typeorm_1.Unique)(['roleId', 'permissionId'])
], RolePermission);
//# sourceMappingURL=role-permission.entity.js.map