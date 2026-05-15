"use strict";
/**
 * @fileoverview 权限模块 DTO 统一导出
 * @description 导出权限模块的所有 DTO
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionTreeNodeDto = exports.PermissionResponseDto = exports.RouteNodeDto = exports.SyncPermissionDto = exports.QueryPermissionDto = exports.UpdatePermissionDto = exports.CreatePermissionDto = void 0;
// Request DTOs
var create_permission_dto_1 = require("./req/create-permission.dto");
Object.defineProperty(exports, "CreatePermissionDto", { enumerable: true, get: function () { return create_permission_dto_1.CreatePermissionDto; } });
var update_permission_dto_1 = require("./req/update-permission.dto");
Object.defineProperty(exports, "UpdatePermissionDto", { enumerable: true, get: function () { return update_permission_dto_1.UpdatePermissionDto; } });
var query_permission_dto_1 = require("./req/query-permission.dto");
Object.defineProperty(exports, "QueryPermissionDto", { enumerable: true, get: function () { return query_permission_dto_1.QueryPermissionDto; } });
var sync_permission_dto_1 = require("./req/sync-permission.dto");
Object.defineProperty(exports, "SyncPermissionDto", { enumerable: true, get: function () { return sync_permission_dto_1.SyncPermissionDto; } });
Object.defineProperty(exports, "RouteNodeDto", { enumerable: true, get: function () { return sync_permission_dto_1.RouteNodeDto; } });
// Response DTOs
var permission_response_dto_1 = require("./res/permission-response.dto");
Object.defineProperty(exports, "PermissionResponseDto", { enumerable: true, get: function () { return permission_response_dto_1.PermissionResponseDto; } });
Object.defineProperty(exports, "PermissionTreeNodeDto", { enumerable: true, get: function () { return permission_response_dto_1.PermissionTreeNodeDto; } });
//# sourceMappingURL=index.js.map