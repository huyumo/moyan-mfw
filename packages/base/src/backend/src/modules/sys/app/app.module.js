"use strict";
/**
 * @fileoverview 应用模块
 * @description 应用模块定义，包含应用服务和控制器
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const app_entity_1 = require("./entities/app.entity");
const app_member_entity_1 = require("./entities/app-member.entity");
const app_type_entity_1 = require("../app-type/entities/app-type.entity");
const app_member_service_1 = require("./service/app-member.service");
const app_member_controller_1 = require("./controller/app-member.controller");
const app_service_1 = require("./service/app.service");
const app_controller_1 = require("./controller/app.controller");
const user_1 = require("../user");
const role_1 = require("../role");
/**
 * 应用模块
 * @description 提供应用实例管理相关功能
 */
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([app_entity_1.App, app_member_entity_1.AppMember, app_type_entity_1.AppType, user_1.User, role_1.Role]),
        ],
        providers: [app_service_1.AppService, app_member_service_1.AppMemberService],
        controllers: [app_controller_1.AppController, app_member_controller_1.AppMemberController],
        exports: [app_service_1.AppService, app_member_service_1.AppMemberService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map