"use strict";
/**
 * @fileoverview 广告管理完整模块
 * @description CoreModule + Controller，提供完整的 HTTP API
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdModule = void 0;
const common_1 = require("@nestjs/common");
const ad_core_module_1 = require("./ad-core.module");
const ad_placement_type_controller_1 = require("./controller/ad-placement-type.controller");
const ad_placement_controller_1 = require("./controller/ad-placement.controller");
const ad_controller_1 = require("./controller/ad.controller");
let AdModule = class AdModule {
};
exports.AdModule = AdModule;
exports.AdModule = AdModule = __decorate([
    (0, common_1.Module)({
        imports: [ad_core_module_1.AdCoreModule],
        controllers: [ad_placement_type_controller_1.AdPlacementTypeController, ad_placement_controller_1.AdPlacementController, ad_controller_1.AdController],
        exports: [ad_core_module_1.AdCoreModule],
    })
], AdModule);
//# sourceMappingURL=ad.module.js.map