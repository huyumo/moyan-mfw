"use strict";
/**
 * @fileoverview 广告扩展包后端入口
 * @description 导出 CoreModule（仅 Service+Entity）、完整 AdModule、实体、DTO
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AD_EXTENSION_PERMISSION_VALUES = exports.QueryAdDto = exports.UpdateAdDto = exports.CreateAdDto = exports.QueryAdPlacementDto = exports.UpdateAdPlacementDto = exports.CreateAdPlacementDto = exports.QueryAdPlacementTypeDto = exports.UpdateAdPlacementTypeDto = exports.CreateAdPlacementTypeDto = exports.AdService = exports.AdPlacementService = exports.AdPlacementTypeService = exports.Ad = exports.AdPlacement = exports.AdPlacementType = exports.default = exports.AdModule = exports.AdCoreModule = void 0;
var ad_core_module_1 = require("./ad-core.module");
Object.defineProperty(exports, "AdCoreModule", { enumerable: true, get: function () { return ad_core_module_1.AdCoreModule; } });
var ad_module_1 = require("./ad.module");
Object.defineProperty(exports, "AdModule", { enumerable: true, get: function () { return ad_module_1.AdModule; } });
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return ad_module_1.AdModule; } });
var entities_1 = require("./entities");
Object.defineProperty(exports, "AdPlacementType", { enumerable: true, get: function () { return entities_1.AdPlacementType; } });
Object.defineProperty(exports, "AdPlacement", { enumerable: true, get: function () { return entities_1.AdPlacement; } });
Object.defineProperty(exports, "Ad", { enumerable: true, get: function () { return entities_1.Ad; } });
var service_1 = require("./service");
Object.defineProperty(exports, "AdPlacementTypeService", { enumerable: true, get: function () { return service_1.AdPlacementTypeService; } });
Object.defineProperty(exports, "AdPlacementService", { enumerable: true, get: function () { return service_1.AdPlacementService; } });
Object.defineProperty(exports, "AdService", { enumerable: true, get: function () { return service_1.AdService; } });
var dto_1 = require("./dto");
Object.defineProperty(exports, "CreateAdPlacementTypeDto", { enumerable: true, get: function () { return dto_1.CreateAdPlacementTypeDto; } });
Object.defineProperty(exports, "UpdateAdPlacementTypeDto", { enumerable: true, get: function () { return dto_1.UpdateAdPlacementTypeDto; } });
Object.defineProperty(exports, "QueryAdPlacementTypeDto", { enumerable: true, get: function () { return dto_1.QueryAdPlacementTypeDto; } });
Object.defineProperty(exports, "CreateAdPlacementDto", { enumerable: true, get: function () { return dto_1.CreateAdPlacementDto; } });
Object.defineProperty(exports, "UpdateAdPlacementDto", { enumerable: true, get: function () { return dto_1.UpdateAdPlacementDto; } });
Object.defineProperty(exports, "QueryAdPlacementDto", { enumerable: true, get: function () { return dto_1.QueryAdPlacementDto; } });
Object.defineProperty(exports, "CreateAdDto", { enumerable: true, get: function () { return dto_1.CreateAdDto; } });
Object.defineProperty(exports, "UpdateAdDto", { enumerable: true, get: function () { return dto_1.UpdateAdDto; } });
Object.defineProperty(exports, "QueryAdDto", { enumerable: true, get: function () { return dto_1.QueryAdDto; } });
var shared_1 = require("moyan-mfw-extension-ad/shared");
Object.defineProperty(exports, "AD_EXTENSION_PERMISSION_VALUES", { enumerable: true, get: function () { return shared_1.AD_EXTENSION_PERMISSION_VALUES; } });
//# sourceMappingURL=index.js.map