"use strict";
/**
 * @fileoverview 应用类型权限池实体
 * @description 定义应用类型可用的权限池，角色权限只能从权限池中选择
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
exports.AppTypePermissionEntity = void 0;
const typeorm_1 = require("typeorm");
const app_type_entity_1 = require("./app-type.entity");
const permission_entity_1 = require("../../permission/entities/permission.entity");
/**
 * 应用类型权限池实体
 * @description 应用类型与权限的多对多关联，定义应用类型可用的权限池
 *
 * @example
 * ```typescript
 * // 权限池配置
 * const appTypePermission = new AppTypePermissionEntity();
 * appTypePermission.appTypeId = 'app-type-uuid';
 * appTypePermission.permissionId = 'permission-uuid';
 * appTypePermission.permissionValue = 3n; // ADD|EDIT
 * ```
 */
let AppTypePermissionEntity = class AppTypePermissionEntity {
    /**
     * 主键 ID
     * @description UUID 格式的主键
     */
    id;
    /**
     * 应用类型 ID
     * @description 外键，关联 sys_app_types 表
     */
    appTypeId;
    /**
     * 应用类型
     * @description 关联的应用类型对象
     */
    appType;
    /**
     * 权限 ID
     * @description 外键，关联 sys_permissions 表
     */
    permissionId;
    /**
     * 权限
     * @description 关联的权限对象
     */
    permission;
    /**
     * 权限值
     * @description 位运算权限值，是 Permission.permissionValue 的子集
     * 用于定义应用类型对该权限的可用操作范围
     */
    permissionValue;
};
exports.AppTypePermissionEntity = AppTypePermissionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AppTypePermissionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '应用类型 ID - 外键关联 sys_app_types' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AppTypePermissionEntity.prototype, "appTypeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => app_type_entity_1.AppType, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'appTypeId' }),
    __metadata("design:type", app_type_entity_1.AppType)
], AppTypePermissionEntity.prototype, "appType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, comment: '权限 ID - 外键关联 sys_permissions' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], AppTypePermissionEntity.prototype, "permissionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => permission_entity_1.Permission, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'permissionId' }),
    __metadata("design:type", permission_entity_1.Permission)
], AppTypePermissionEntity.prototype, "permission", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', unsigned: true, default: 0, comment: '权限值 - 位运算权限值，定义可用操作范围' }),
    __metadata("design:type", BigInt)
], AppTypePermissionEntity.prototype, "permissionValue", void 0);
exports.AppTypePermissionEntity = AppTypePermissionEntity = __decorate([
    (0, typeorm_1.Entity)('sys_app_type_permissions'),
    (0, typeorm_1.Unique)(['appTypeId', 'permissionId'])
], AppTypePermissionEntity);
//# sourceMappingURL=app-type-permission.entity.js.map