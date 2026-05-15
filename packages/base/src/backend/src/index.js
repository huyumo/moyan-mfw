"use strict";
/**
 * @fileoverview 包入口文件
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDicts = exports.syncAppTypesConfig = exports.runSeeds = exports.InstallService = exports.AuditLogService = exports.AppMemberService = exports.AppService = exports.AppTypeService = exports.PermissionService = exports.RoleService = exports.UserService = exports.AuthService = exports.AuditLog = exports.AppMember = exports.App = exports.AppType = exports.Permission = exports.Role = exports.UserEntity = exports.createExtensionBackendApp = exports.createBaseBackendApp = void 0;
// === 应用工厂 ===
var create_base_backend_app_1 = require("./create-base-backend-app");
Object.defineProperty(exports, "createBaseBackendApp", { enumerable: true, get: function () { return create_base_backend_app_1.createBaseBackendApp; } });
var create_extension_backend_app_1 = require("./create-extension-backend-app");
Object.defineProperty(exports, "createExtensionBackendApp", { enumerable: true, get: function () { return create_extension_backend_app_1.createExtensionBackendApp; } });
// === 公共模块 ===
__exportStar(require("./common/index"), exports);
// === 核心实体类 ===
var user_entity_1 = require("./modules/sys/user/entities/user.entity");
Object.defineProperty(exports, "UserEntity", { enumerable: true, get: function () { return user_entity_1.User; } });
var role_entity_1 = require("./modules/sys/role/entities/role.entity");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return role_entity_1.Role; } });
var permission_entity_1 = require("./modules/sys/permission/entities/permission.entity");
Object.defineProperty(exports, "Permission", { enumerable: true, get: function () { return permission_entity_1.Permission; } });
var app_type_entity_1 = require("./modules/sys/app-type/entities/app-type.entity");
Object.defineProperty(exports, "AppType", { enumerable: true, get: function () { return app_type_entity_1.AppType; } });
var app_entity_1 = require("./modules/sys/app/entities/app.entity");
Object.defineProperty(exports, "App", { enumerable: true, get: function () { return app_entity_1.App; } });
var app_member_entity_1 = require("./modules/sys/app/entities/app-member.entity");
Object.defineProperty(exports, "AppMember", { enumerable: true, get: function () { return app_member_entity_1.AppMember; } });
var audit_log_entity_1 = require("./modules/sys/audit-log/entities/audit-log.entity");
Object.defineProperty(exports, "AuditLog", { enumerable: true, get: function () { return audit_log_entity_1.AuditLog; } });
// === 核心服务 ===
var auth_service_1 = require("./modules/sys/auth/auth.service");
Object.defineProperty(exports, "AuthService", { enumerable: true, get: function () { return auth_service_1.AuthService; } });
var user_service_1 = require("./modules/sys/user/user.service");
Object.defineProperty(exports, "UserService", { enumerable: true, get: function () { return user_service_1.UserService; } });
var role_service_1 = require("./modules/sys/role/role.service");
Object.defineProperty(exports, "RoleService", { enumerable: true, get: function () { return role_service_1.RoleService; } });
var permission_service_1 = require("./modules/sys/permission/permission.service");
Object.defineProperty(exports, "PermissionService", { enumerable: true, get: function () { return permission_service_1.PermissionService; } });
var app_type_service_1 = require("./modules/sys/app-type/app-type.service");
Object.defineProperty(exports, "AppTypeService", { enumerable: true, get: function () { return app_type_service_1.AppTypeService; } });
var app_service_1 = require("./modules/sys/app/service/app.service");
Object.defineProperty(exports, "AppService", { enumerable: true, get: function () { return app_service_1.AppService; } });
var app_member_service_1 = require("./modules/sys/app/service/app-member.service");
Object.defineProperty(exports, "AppMemberService", { enumerable: true, get: function () { return app_member_service_1.AppMemberService; } });
var audit_log_service_1 = require("./modules/sys/audit-log/audit-log.service");
Object.defineProperty(exports, "AuditLogService", { enumerable: true, get: function () { return audit_log_service_1.AuditLogService; } });
var install_service_1 = require("./modules/sys/install/install.service");
Object.defineProperty(exports, "InstallService", { enumerable: true, get: function () { return install_service_1.InstallService; } });
// === 数据库种子 ===
var index_1 = require("./database/seeds/index");
Object.defineProperty(exports, "runSeeds", { enumerable: true, get: function () { return index_1.runSeeds; } });
// === 应用类型同步 ===
var app_type_sync_1 = require("./modules/sys/app-type/app-type-sync");
Object.defineProperty(exports, "syncAppTypesConfig", { enumerable: true, get: function () { return app_type_sync_1.syncAppTypesConfig; } });
// === 数据字典种子 ===
var dict_seeder_1 = require("./database/seeds/dict.seeder");
Object.defineProperty(exports, "seedDicts", { enumerable: true, get: function () { return dict_seeder_1.seedDicts; } });
//# sourceMappingURL=index.js.map