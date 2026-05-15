"use strict";
/**
 * @fileoverview 权限模块
 * @description 权限模块定义，包含权限服务和控制器
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const permission_entity_1 = require("./entities/permission.entity");
const permission_value_entity_1 = require("./entities/permission-value.entity");
const permission_service_1 = require("./permission.service");
const permission_controller_1 = require("./permission.controller");
const permission_values_controller_1 = require("./permission-values.controller");
const permission_value_sync_service_1 = require("./permission-value-sync.service");
/**
 * 权限模块
 * @description 提供权限管理相关功能
 */
let PermissionModule = class PermissionModule {
};
exports.PermissionModule = PermissionModule;
exports.PermissionModule = PermissionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([permission_entity_1.Permission, permission_value_entity_1.PermissionValue]),
        ],
        providers: [permission_service_1.PermissionService, permission_value_sync_service_1.PermissionValueSyncService],
        controllers: [permission_controller_1.PermissionController, permission_values_controller_1.PermissionValuesController],
        exports: [permission_service_1.PermissionService, permission_value_sync_service_1.PermissionValueSyncService],
    })
], PermissionModule);
//# sourceMappingURL=permission.module.js.map