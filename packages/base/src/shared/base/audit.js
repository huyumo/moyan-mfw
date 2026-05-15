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
exports.AuditModuleDict = void 0;
const decorator_1 = require("../core/decorator");
let AuditModuleDict = class AuditModuleDict {
    static AUTH = 'AUTH';
    static USER = 'USER';
    static ROLE = 'ROLE';
    static PERMISSION = 'PERMISSION';
    static APP = 'APP';
    static APP_TYPE = 'APP_TYPE';
    static MEMBER = 'MEMBER';
    static SYSTEM = 'SYSTEM';
    static UPLOAD = 'UPLOAD';
};
exports.AuditModuleDict = AuditModuleDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '认证', type: 'primary' }),
    __metadata("design:type", Object)
], AuditModuleDict, "AUTH", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '用户', type: 'success' }),
    __metadata("design:type", Object)
], AuditModuleDict, "USER", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '角色', type: 'warning' }),
    __metadata("design:type", Object)
], AuditModuleDict, "ROLE", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '权限', type: 'danger' }),
    __metadata("design:type", Object)
], AuditModuleDict, "PERMISSION", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '应用', type: 'primary' }),
    __metadata("design:type", Object)
], AuditModuleDict, "APP", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '应用类型', type: 'info' }),
    __metadata("design:type", Object)
], AuditModuleDict, "APP_TYPE", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '成员', type: 'success' }),
    __metadata("design:type", Object)
], AuditModuleDict, "MEMBER", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '系统', type: 'warning' }),
    __metadata("design:type", Object)
], AuditModuleDict, "SYSTEM", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '上传', type: 'info' }),
    __metadata("design:type", Object)
], AuditModuleDict, "UPLOAD", void 0);
exports.AuditModuleDict = AuditModuleDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'audit_module', label: '审计模块' })
], AuditModuleDict);
//# sourceMappingURL=audit.js.map