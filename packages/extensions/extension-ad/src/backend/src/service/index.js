"use strict";
/**
 * @fileoverview 服务统一导出
 * @description 统一导出广告管理相关服务
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdService = exports.AdPlacementService = exports.AdPlacementTypeService = void 0;
var ad_placement_type_service_1 = require("./ad-placement-type.service");
Object.defineProperty(exports, "AdPlacementTypeService", { enumerable: true, get: function () { return ad_placement_type_service_1.AdPlacementTypeService; } });
var ad_placement_service_1 = require("./ad-placement.service");
Object.defineProperty(exports, "AdPlacementService", { enumerable: true, get: function () { return ad_placement_service_1.AdPlacementService; } });
var ad_service_1 = require("./ad.service");
Object.defineProperty(exports, "AdService", { enumerable: true, get: function () { return ad_service_1.AdService; } });
//# sourceMappingURL=index.js.map