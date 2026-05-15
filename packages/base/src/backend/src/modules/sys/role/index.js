"use strict";
/**
 * @fileoverview 角色模块统一导出
 * @description 导出角色模块的所有内容
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
exports.RoleModule = exports.RoleController = exports.RoleService = exports.RolePermission = exports.UserRole = exports.Role = void 0;
// Entities
var role_entity_1 = require("./entities/role.entity");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return role_entity_1.Role; } });
var user_role_entity_1 = require("./entities/user-role.entity");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return user_role_entity_1.UserRole; } });
var role_permission_entity_1 = require("./entities/role-permission.entity");
Object.defineProperty(exports, "RolePermission", { enumerable: true, get: function () { return role_permission_entity_1.RolePermission; } });
// DTOs
__exportStar(require("./dto"), exports);
// Service
var role_service_1 = require("./role.service");
Object.defineProperty(exports, "RoleService", { enumerable: true, get: function () { return role_service_1.RoleService; } });
// Controller
var role_controller_1 = require("./role.controller");
Object.defineProperty(exports, "RoleController", { enumerable: true, get: function () { return role_controller_1.RoleController; } });
// Module
var role_module_1 = require("./role.module");
Object.defineProperty(exports, "RoleModule", { enumerable: true, get: function () { return role_module_1.RoleModule; } });
//# sourceMappingURL=index.js.map