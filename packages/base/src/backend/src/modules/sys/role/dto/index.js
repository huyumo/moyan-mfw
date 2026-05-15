"use strict";
/**
 * @fileoverview 角色模块 DTO 统一导出
 * @description 导出角色模块的所有 DTO
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissionResponseDto = exports.RolePermissionTreesResponseDto = exports.RoleResponseDto = exports.QueryRoleDto = exports.AssignPermissionsDto = exports.UpdateRoleDto = exports.CreateRoleDto = void 0;
// Request DTOs
var create_role_dto_1 = require("./req/create-role.dto");
Object.defineProperty(exports, "CreateRoleDto", { enumerable: true, get: function () { return create_role_dto_1.CreateRoleDto; } });
var update_role_dto_1 = require("./req/update-role.dto");
Object.defineProperty(exports, "UpdateRoleDto", { enumerable: true, get: function () { return update_role_dto_1.UpdateRoleDto; } });
var assign_permissions_dto_1 = require("./req/assign-permissions.dto");
Object.defineProperty(exports, "AssignPermissionsDto", { enumerable: true, get: function () { return assign_permissions_dto_1.AssignPermissionsDto; } });
var query_role_dto_1 = require("./req/query-role.dto");
Object.defineProperty(exports, "QueryRoleDto", { enumerable: true, get: function () { return query_role_dto_1.QueryRoleDto; } });
// Response DTOs
var role_response_dto_1 = require("./res/role-response.dto");
Object.defineProperty(exports, "RoleResponseDto", { enumerable: true, get: function () { return role_response_dto_1.RoleResponseDto; } });
var role_permission_response_dto_1 = require("./res/role-permission-response.dto");
Object.defineProperty(exports, "RolePermissionTreesResponseDto", { enumerable: true, get: function () { return role_permission_response_dto_1.RolePermissionTreesResponseDto; } });
Object.defineProperty(exports, "RolePermissionResponseDto", { enumerable: true, get: function () { return role_permission_response_dto_1.RolePermissionResponseDto; } });
//# sourceMappingURL=index.js.map