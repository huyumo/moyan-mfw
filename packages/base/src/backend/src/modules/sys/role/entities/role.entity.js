"use strict";
/**
 * @fileoverview 角色实体
 * @description 系统角色实体，用于 RBAC 权限管理
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
exports.Role = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../common/entities/base.entity");
const shared_1 = require("moyan-mfw-base/shared");
/**
 * 角色实体类
 * @description 系统角色表，用于 RBAC 权限管理
 */
let Role = class Role extends base_entity_1.Base {
    /**
     * 角色 ID
     * @description 主键，UUID 格式
     */
    id;
    /**
     * 应用实例 ID
     * @description 关联的应用实例 ID，为空时表示全局角色
     */
    appId;
    /**
     * 应用类型 ID
     * @description 关联的应用类型 ID，为空时表示全局角色
     */
    appTypeId;
    /**
     * 角色名称
     * @description 角色名称 - 用于展示的角色别名
     */
    roleName;
    /**
     * 角色编码
     * @description 角色编码 - 角色的唯一标识，全局唯一
     */
    roleCode;
    /**
     * 角色描述
     * @description 角色描述信息
     */
    roleDesc;
    /**
     * 是否内置
     * @description 是否系统内置角色 - 内置角色不允许删除
     */
    isBuiltin;
    /**
     * 是否拥有者角色
     * @description 是否拥有者角色 - 拥有者拥有应用的全部权限
     */
    isOwner;
    /**
     * 角色状态
     * @description 状态 - 1:启用 0:禁用 - 控制角色是否可用
     */
    roleStatus;
    /**
     * 排序
     * @description 角色排序号，数值越小越靠前
     */
    sortOrder;
    /**
     * 关联权限
     * @description 角色关联的所有权限，通过 sys_role_permissions 关联表管理
     */
    // 注：实际关系通过 RolePermission 实体管理，避免循环依赖
    permissions;
};
exports.Role = Role;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Role.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, nullable: true, comment: '应用实例 ID - 关联的应用实例，为空时表示全局角色' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Role.prototype, "appId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, nullable: true, comment: '应用类型 ID - 关联的应用类型，为空时表示全局角色' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Role.prototype, "appTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '角色名称 - 用于展示的角色别名' }),
    __metadata("design:type", String)
], Role.prototype, "roleName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '角色编码 - 角色的唯一标识，全局唯一' }),
    __metadata("design:type", String)
], Role.prototype, "roleCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '角色描述信息' }),
    __metadata("design:type", String)
], Role.prototype, "roleDesc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.IsBuiltinDict.NO, comment: (0, shared_1.toDescription)(shared_1.IsBuiltinDict) }),
    __metadata("design:type", Number)
], Role.prototype, "isBuiltin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.IsOwnerDict.NO, comment: (0, shared_1.toDescription)(shared_1.IsOwnerDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Role.prototype, "isOwner", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.StatusDict.ENABLED, comment: (0, shared_1.toDescription)(shared_1.StatusDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Role.prototype, "roleStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' }),
    __metadata("design:type", Number)
], Role.prototype, "sortOrder", void 0);
exports.Role = Role = __decorate([
    (0, typeorm_1.Entity)('sys_roles'),
    (0, typeorm_1.Unique)(['roleCode'])
], Role);
//# sourceMappingURL=role.entity.js.map