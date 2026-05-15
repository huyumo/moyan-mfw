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
exports.DeveloperDict = exports.GenderDict = void 0;
const decorator_1 = require("../core/decorator");
let GenderDict = class GenderDict {
    static UNKNOWN = 0;
    static MALE = 1;
    static FEMALE = 2;
};
exports.GenderDict = GenderDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '未知', type: 'info' }),
    __metadata("design:type", Object)
], GenderDict, "UNKNOWN", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '男', type: 'primary' }),
    __metadata("design:type", Object)
], GenderDict, "MALE", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '女', type: 'danger' }),
    __metadata("design:type", Object)
], GenderDict, "FEMALE", void 0);
exports.GenderDict = GenderDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'gender', label: '性别' })
], GenderDict);
let DeveloperDict = class DeveloperDict {
    static YES = 1;
    static NO = 0;
};
exports.DeveloperDict = DeveloperDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '是', type: 'success' }),
    __metadata("design:type", Object)
], DeveloperDict, "YES", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '否', type: 'info' }),
    __metadata("design:type", Object)
], DeveloperDict, "NO", void 0);
exports.DeveloperDict = DeveloperDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'developer', label: '开发者' })
], DeveloperDict);
//# sourceMappingURL=user.js.map