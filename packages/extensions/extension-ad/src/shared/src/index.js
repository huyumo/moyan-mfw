"use strict";
/**
 * @fileoverview 共享类型定义
 * @description 前后端通信接口类型与常量
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AD_EXTENSION_PERMISSION_VALUES = exports.AD_PATHS = exports.AdLinkTypeDict = exports.LINK_TYPE_LABELS = exports.LINK_TYPE = void 0;
var constants_1 = require("./constants");
Object.defineProperty(exports, "LINK_TYPE", { enumerable: true, get: function () { return constants_1.LINK_TYPE; } });
Object.defineProperty(exports, "LINK_TYPE_LABELS", { enumerable: true, get: function () { return constants_1.LINK_TYPE_LABELS; } });
var dict_1 = require("./dict");
Object.defineProperty(exports, "AdLinkTypeDict", { enumerable: true, get: function () { return dict_1.AdLinkTypeDict; } });
var paths_1 = require("./paths");
Object.defineProperty(exports, "AD_PATHS", { enumerable: true, get: function () { return paths_1.AD_PATHS; } });
var permission_values_1 = require("./permission-values");
Object.defineProperty(exports, "AD_EXTENSION_PERMISSION_VALUES", { enumerable: true, get: function () { return permission_values_1.AD_EXTENSION_PERMISSION_VALUES; } });
//# sourceMappingURL=index.js.map