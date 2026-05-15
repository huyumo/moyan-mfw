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
exports.IsOwnerDict = exports.IsBuiltinDict = void 0;
const decorator_1 = require("../core/decorator");
let IsBuiltinDict = class IsBuiltinDict {
    static YES = 1;
    static NO = 0;
};
exports.IsBuiltinDict = IsBuiltinDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '内置', type: 'success' }),
    __metadata("design:type", Object)
], IsBuiltinDict, "YES", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '非内置', type: 'info' }),
    __metadata("design:type", Object)
], IsBuiltinDict, "NO", void 0);
exports.IsBuiltinDict = IsBuiltinDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'is_builtin', label: '是否内置' })
], IsBuiltinDict);
let IsOwnerDict = class IsOwnerDict {
    static YES = 1;
    static NO = 0;
};
exports.IsOwnerDict = IsOwnerDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '拥有者', type: 'success' }),
    __metadata("design:type", Object)
], IsOwnerDict, "YES", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '非拥有者', type: 'info' }),
    __metadata("design:type", Object)
], IsOwnerDict, "NO", void 0);
exports.IsOwnerDict = IsOwnerDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'is_owner', label: '是否拥有者' })
], IsOwnerDict);
//# sourceMappingURL=role.js.map