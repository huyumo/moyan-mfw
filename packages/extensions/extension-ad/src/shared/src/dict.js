"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdLinkTypeDict = void 0;
/**
 * @fileoverview 广告管理扩展包字典定义
 * @description 使用 moyan-mfw-base/shared 装饰器定义扩展包专属字典，供前后端共用
 */
const shared_1 = require("moyan-mfw-base/shared");
let AdLinkTypeDict = class AdLinkTypeDict {
    static MINIAPP = 'miniapp';
    static INTERNAL = 'internal';
    static EXTERNAL = 'external';
};
exports.AdLinkTypeDict = AdLinkTypeDict;
__decorate([
    (0, shared_1.DictEntry)({ label: '小程序跳转', type: 'primary' }),
    __metadata("design:type", Object)
], AdLinkTypeDict, "MINIAPP", void 0);
__decorate([
    (0, shared_1.DictEntry)({ label: 'App内部跳转', type: 'success' }),
    __metadata("design:type", Object)
], AdLinkTypeDict, "INTERNAL", void 0);
__decorate([
    (0, shared_1.DictEntry)({ label: '外部链接跳转', type: 'warning' }),
    __metadata("design:type", Object)
], AdLinkTypeDict, "EXTERNAL", void 0);
exports.AdLinkTypeDict = AdLinkTypeDict = __decorate([
    (0, shared_1.DictMeta)({ key: 'ad_link_type', label: '广告跳转类型', module: '广告管理' })
], AdLinkTypeDict);
//# sourceMappingURL=dict.js.map