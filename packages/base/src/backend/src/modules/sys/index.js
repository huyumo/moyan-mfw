"use strict";
/**
 * @fileoverview Sys 模块统一导出
 * @description 导出 sys 模块下的所有子模块
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SysModule = void 0;
// 导出各子模块
__exportStar(require("./user"), exports);
__exportStar(require("./role"), exports);
__exportStar(require("./permission"), exports);
__exportStar(require("./app-type"), exports);
__exportStar(require("./audit-log"), exports);
__exportStar(require("./upload"), exports);
var sys_module_1 = require("./sys.module");
Object.defineProperty(exports, "SysModule", { enumerable: true, get: function () { return sys_module_1.SysModule; } });
//# sourceMappingURL=index.js.map