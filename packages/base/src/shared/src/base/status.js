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
exports.BoolDict = exports.StatusDict = void 0;
const decorator_1 = require("../core/decorator");
let StatusDict = class StatusDict {
    static ENABLED = 1;
    static DISABLED = 0;
};
exports.StatusDict = StatusDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '启用', type: 'success' }),
    __metadata("design:type", Object)
], StatusDict, "ENABLED", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '禁用', type: 'info' }),
    __metadata("design:type", Object)
], StatusDict, "DISABLED", void 0);
exports.StatusDict = StatusDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'status', label: '通用状态' })
], StatusDict);
let BoolDict = class BoolDict {
    static YES = 1;
    static NO = 0;
};
exports.BoolDict = BoolDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '是', type: 'success' }),
    __metadata("design:type", Object)
], BoolDict, "YES", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '否', type: 'info' }),
    __metadata("design:type", Object)
], BoolDict, "NO", void 0);
exports.BoolDict = BoolDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'bool', label: '布尔值' })
], BoolDict);
//# sourceMappingURL=status.js.map