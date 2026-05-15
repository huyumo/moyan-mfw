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
exports.MultiAppEnabledDict = void 0;
const decorator_1 = require("../core/decorator");
let MultiAppEnabledDict = class MultiAppEnabledDict {
    static YES = 1;
    static NO = 0;
};
exports.MultiAppEnabledDict = MultiAppEnabledDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '支持', type: 'success' }),
    __metadata("design:type", Object)
], MultiAppEnabledDict, "YES", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '不支持', type: 'info' }),
    __metadata("design:type", Object)
], MultiAppEnabledDict, "NO", void 0);
exports.MultiAppEnabledDict = MultiAppEnabledDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'multi_app_enabled', label: '是否支持多应用，用户是否可以成为当前应用类型的多个应用实例的成员' })
], MultiAppEnabledDict);
//# sourceMappingURL=app.js.map