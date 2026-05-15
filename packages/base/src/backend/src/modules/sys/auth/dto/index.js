"use strict";
/**
 * @fileoverview 认证模块 DTO 统一导出
 * @description 导出认证模块的所有 DTO
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPermissionsResponseDto = exports.UserAppsResponseDto = exports.AppInstanceItemDto = exports.UserInfoDto = exports.LoginResponseDto = exports.LogoutDto = exports.RegisterDto = exports.CheckAvailabilityResponseDto = exports.CheckAvailabilityDto = exports.RefreshTokenDto = exports.LoginDto = void 0;
// Request DTOs
var login_dto_1 = require("./req/login.dto");
Object.defineProperty(exports, "LoginDto", { enumerable: true, get: function () { return login_dto_1.LoginDto; } });
var refresh_token_dto_1 = require("./req/refresh-token.dto");
Object.defineProperty(exports, "RefreshTokenDto", { enumerable: true, get: function () { return refresh_token_dto_1.RefreshTokenDto; } });
var check_availability_dto_1 = require("./req/check-availability.dto");
Object.defineProperty(exports, "CheckAvailabilityDto", { enumerable: true, get: function () { return check_availability_dto_1.CheckAvailabilityDto; } });
Object.defineProperty(exports, "CheckAvailabilityResponseDto", { enumerable: true, get: function () { return check_availability_dto_1.CheckAvailabilityResponseDto; } });
var register_dto_1 = require("./req/register.dto");
Object.defineProperty(exports, "RegisterDto", { enumerable: true, get: function () { return register_dto_1.RegisterDto; } });
var logout_dto_1 = require("./req/logout.dto");
Object.defineProperty(exports, "LogoutDto", { enumerable: true, get: function () { return logout_dto_1.LogoutDto; } });
// Response DTOs
var auth_response_dto_1 = require("./res/auth-response.dto");
Object.defineProperty(exports, "LoginResponseDto", { enumerable: true, get: function () { return auth_response_dto_1.LoginResponseDto; } });
Object.defineProperty(exports, "UserInfoDto", { enumerable: true, get: function () { return auth_response_dto_1.UserInfoDto; } });
Object.defineProperty(exports, "AppInstanceItemDto", { enumerable: true, get: function () { return auth_response_dto_1.AppInstanceItemDto; } });
Object.defineProperty(exports, "UserAppsResponseDto", { enumerable: true, get: function () { return auth_response_dto_1.UserAppsResponseDto; } });
var user_permissions_response_dto_1 = require("./res/user-permissions-response.dto");
Object.defineProperty(exports, "UserPermissionsResponseDto", { enumerable: true, get: function () { return user_permissions_response_dto_1.UserPermissionsResponseDto; } });
//# sourceMappingURL=index.js.map