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
exports.SupplierStatusDict = void 0;
require("reflect-metadata");
const shared_1 = require("moyan-mfw-base/shared");
let SupplierStatusDict = class SupplierStatusDict {
    static PENDING = 0;
    static APPROVED = 1;
    static REJECTED = 2;
};
exports.SupplierStatusDict = SupplierStatusDict;
__decorate([
    (0, shared_1.DictEntry)({ label: '待审核', type: 'warning' }),
    __metadata("design:type", Object)
], SupplierStatusDict, "PENDING", void 0);
__decorate([
    (0, shared_1.DictEntry)({ label: '已通过', type: 'success' }),
    __metadata("design:type", Object)
], SupplierStatusDict, "APPROVED", void 0);
__decorate([
    (0, shared_1.DictEntry)({ label: '已拒绝', type: 'danger' }),
    __metadata("design:type", Object)
], SupplierStatusDict, "REJECTED", void 0);
exports.SupplierStatusDict = SupplierStatusDict = __decorate([
    (0, shared_1.DictMeta)({ key: 'supplier_status', label: '供应商状态', module: '供应商管理' })
], SupplierStatusDict);
//# sourceMappingURL=supplier.js.map