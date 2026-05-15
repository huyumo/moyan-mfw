"use strict";
/**
 * @fileoverview 角色模块
 * @description 角色模块定义，包含角色服务和控制器
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const role_entity_1 = require("./entities/role.entity");
const user_role_entity_1 = require("./entities/user-role.entity");
const role_permission_entity_1 = require("./entities/role-permission.entity");
const role_service_1 = require("./role.service");
const role_controller_1 = require("./role.controller");
/**
 * 角色模块
 * @description 提供角色管理相关功能
 */
let RoleModule = class RoleModule {
};
exports.RoleModule = RoleModule;
exports.RoleModule = RoleModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([role_entity_1.Role, user_role_entity_1.UserRole, role_permission_entity_1.RolePermission]),
        ],
        providers: [role_service_1.RoleService],
        controllers: [role_controller_1.RoleController],
        exports: [role_service_1.RoleService],
    })
], RoleModule);
//# sourceMappingURL=role.module.js.map