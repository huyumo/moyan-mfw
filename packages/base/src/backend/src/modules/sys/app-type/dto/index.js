"use strict";
/**
 * @fileoverview 应用类型 DTO 统一导出
 * @description 导出应用类型模块的所有 DTO
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionTreesResponseDto = exports.UpdatePermissionPoolResponseDto = exports.PermissionPoolResponseDto = exports.AppTypeResponseDto = exports.UpdatePermissionPoolDto = exports.QueryAppTypeDto = exports.UpdateAppTypeDto = exports.CreateAppTypeDto = void 0;
// Request DTOs
var create_app_type_dto_1 = require("./req/create-app-type.dto");
Object.defineProperty(exports, "CreateAppTypeDto", { enumerable: true, get: function () { return create_app_type_dto_1.CreateAppTypeDto; } });
var update_app_type_dto_1 = require("./req/update-app-type.dto");
Object.defineProperty(exports, "UpdateAppTypeDto", { enumerable: true, get: function () { return update_app_type_dto_1.UpdateAppTypeDto; } });
var query_app_type_dto_1 = require("./req/query-app-type.dto");
Object.defineProperty(exports, "QueryAppTypeDto", { enumerable: true, get: function () { return query_app_type_dto_1.QueryAppTypeDto; } });
var update_permission_pool_dto_1 = require("./req/update-permission-pool.dto");
Object.defineProperty(exports, "UpdatePermissionPoolDto", { enumerable: true, get: function () { return update_permission_pool_dto_1.UpdatePermissionPoolDto; } });
// Response DTOs
var app_type_response_dto_1 = require("./res/app-type-response.dto");
Object.defineProperty(exports, "AppTypeResponseDto", { enumerable: true, get: function () { return app_type_response_dto_1.AppTypeResponseDto; } });
var permission_pool_response_dto_1 = require("./res/permission-pool-response.dto");
Object.defineProperty(exports, "PermissionPoolResponseDto", { enumerable: true, get: function () { return permission_pool_response_dto_1.PermissionPoolResponseDto; } });
Object.defineProperty(exports, "UpdatePermissionPoolResponseDto", { enumerable: true, get: function () { return permission_pool_response_dto_1.UpdatePermissionPoolResponseDto; } });
Object.defineProperty(exports, "PermissionTreesResponseDto", { enumerable: true, get: function () { return permission_pool_response_dto_1.PermissionTreesResponseDto; } });
//# sourceMappingURL=index.js.map