"use strict";
/**
 * @fileoverview 认证模块
 * @description 认证模块定义，包含认证服务和控制器
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("../user/entities/user.entity");
const user_role_entity_1 = require("../role/entities/user-role.entity");
const role_entity_1 = require("../role/entities/role.entity");
const app_entity_1 = require("../app/entities/app.entity");
const app_member_entity_1 = require("../app/entities/app-member.entity");
const app_type_entity_1 = require("../app-type/entities/app-type.entity");
const app_type_permission_entity_1 = require("../app-type/entities/app-type-permission.entity");
const permission_entity_1 = require("../permission/entities/permission.entity");
const role_permission_entity_1 = require("../role/entities/role-permission.entity");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
/**
 * 认证模块
 * @description 提供用户认证相关功能
 */
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                user_role_entity_1.UserRole,
                role_entity_1.Role,
                app_entity_1.App,
                app_member_entity_1.AppMember,
                app_type_entity_1.AppType,
                app_type_permission_entity_1.AppTypePermissionEntity,
                permission_entity_1.Permission,
                role_permission_entity_1.RolePermission,
            ]),
        ],
        providers: [auth_service_1.AuthService],
        controllers: [auth_controller_1.AuthController],
        exports: [auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map