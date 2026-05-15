"use strict";
/**
 * @fileoverview 广告管理核心模块
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdCoreModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ad_placement_type_entity_1 = require("./entities/ad-placement-type.entity");
const ad_placement_entity_1 = require("./entities/ad-placement.entity");
const ad_entity_1 = require("./entities/ad.entity");
const ad_placement_type_service_1 = require("./service/ad-placement-type.service");
const ad_placement_service_1 = require("./service/ad-placement.service");
const ad_service_1 = require("./service/ad.service");
let AdCoreModule = class AdCoreModule {
};
exports.AdCoreModule = AdCoreModule;
exports.AdCoreModule = AdCoreModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([ad_placement_type_entity_1.AdPlacementType, ad_placement_entity_1.AdPlacement, ad_entity_1.Ad]),
        ],
        providers: [ad_placement_type_service_1.AdPlacementTypeService, ad_placement_service_1.AdPlacementService, ad_service_1.AdService],
        exports: [ad_placement_type_service_1.AdPlacementTypeService, ad_placement_service_1.AdPlacementService, ad_service_1.AdService],
    })
], AdCoreModule);
//# sourceMappingURL=ad-core.module.js.map