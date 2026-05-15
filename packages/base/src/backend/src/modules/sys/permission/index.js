"use strict";
/**
 * @fileoverview 权限模块统一导出
 * @description 导出权限模块的所有内容
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
exports.PermissionModule = exports.PermissionController = exports.PermissionService = exports.RolePermission = exports.ShowMode = exports.NodeType = exports.PermissionType = exports.Permission = void 0;
// Entities
var permission_entity_1 = require("./entities/permission.entity");
Object.defineProperty(exports, "Permission", { enumerable: true, get: function () { return permission_entity_1.Permission; } });
Object.defineProperty(exports, "PermissionType", { enumerable: true, get: function () { return permission_entity_1.PermissionType; } });
Object.defineProperty(exports, "NodeType", { enumerable: true, get: function () { return permission_entity_1.NodeType; } });
Object.defineProperty(exports, "ShowMode", { enumerable: true, get: function () { return permission_entity_1.ShowMode; } });
var role_permission_entity_1 = require("../role/entities/role-permission.entity");
Object.defineProperty(exports, "RolePermission", { enumerable: true, get: function () { return role_permission_entity_1.RolePermission; } });
// Services
var permission_service_1 = require("./permission.service");
Object.defineProperty(exports, "PermissionService", { enumerable: true, get: function () { return permission_service_1.PermissionService; } });
// Controllers
var permission_controller_1 = require("./permission.controller");
Object.defineProperty(exports, "PermissionController", { enumerable: true, get: function () { return permission_controller_1.PermissionController; } });
// DTOs
__exportStar(require("./dto"), exports);
// Module
var permission_module_1 = require("./permission.module");
Object.defineProperty(exports, "PermissionModule", { enumerable: true, get: function () { return permission_module_1.PermissionModule; } });
//# sourceMappingURL=index.js.map