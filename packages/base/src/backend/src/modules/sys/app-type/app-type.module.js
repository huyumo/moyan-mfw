"use strict";
/**
 * @fileoverview 应用类型模块
 * @description 应用类型模块定义，包含应用类型服务和控制器
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppTypeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const app_type_entity_1 = require("./entities/app-type.entity");
const role_entity_1 = require("../role/entities/role.entity");
const app_type_service_1 = require("./app-type.service");
const app_type_controller_1 = require("./app-type.controller");
let AppTypeModule = class AppTypeModule {
};
exports.AppTypeModule = AppTypeModule;
exports.AppTypeModule = AppTypeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([app_type_entity_1.AppType, role_entity_1.Role]),
        ],
        providers: [app_type_service_1.AppTypeService],
        controllers: [app_type_controller_1.AppTypeController],
        exports: [app_type_service_1.AppTypeService],
    })
], AppTypeModule);
//# sourceMappingURL=app-type.module.js.map