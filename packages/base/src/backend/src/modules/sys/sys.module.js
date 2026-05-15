"use strict";
/**
 * @fileoverview 系统管理领域模块
 * @description 聚合 sys 下的所有子模块，作为系统管理域的统一入口
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SysModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const role_module_1 = require("./role/role.module");
const permission_module_1 = require("./permission/permission.module");
const app_type_module_1 = require("./app-type/app-type.module");
const app_module_1 = require("./app/app.module");
const audit_log_module_1 = require("./audit-log/audit-log.module");
const install_module_1 = require("./install/install.module");
const upload_module_1 = require("./upload/upload.module");
let SysModule = class SysModule {
};
exports.SysModule = SysModule;
exports.SysModule = SysModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            role_module_1.RoleModule,
            permission_module_1.PermissionModule,
            app_type_module_1.AppTypeModule,
            app_module_1.AppModule,
            audit_log_module_1.AuditLogModule,
            install_module_1.InstallModule,
            upload_module_1.UploadFileModule,
        ],
    })
], SysModule);
//# sourceMappingURL=sys.module.js.map