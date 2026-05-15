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
exports.IsCacheDict = exports.IsVisibleDict = exports.IsAutoSyncDict = exports.ShowModeDict = exports.NodeTypeDict = exports.PermissionTypeDict = void 0;
const decorator_1 = require("../core/decorator");
let PermissionTypeDict = class PermissionTypeDict {
    static PC = 'PC';
    static NORMAL = 'NORMAL';
};
exports.PermissionTypeDict = PermissionTypeDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '平台权限', type: 'primary' }),
    __metadata("design:type", Object)
], PermissionTypeDict, "PC", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '普通权限', type: 'success' }),
    __metadata("design:type", Object)
], PermissionTypeDict, "NORMAL", void 0);
exports.PermissionTypeDict = PermissionTypeDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'permission_type', label: '权限类型' })
], PermissionTypeDict);
let NodeTypeDict = class NodeTypeDict {
    static MENU = 'MENU';
    static PAGE = 'PAGE';
    static TAG = 'TAG';
};
exports.NodeTypeDict = NodeTypeDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '菜单', type: 'primary' }),
    __metadata("design:type", Object)
], NodeTypeDict, "MENU", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '页面', type: 'success' }),
    __metadata("design:type", Object)
], NodeTypeDict, "PAGE", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '标签', type: 'warning' }),
    __metadata("design:type", Object)
], NodeTypeDict, "TAG", void 0);
exports.NodeTypeDict = NodeTypeDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'node_type', label: '节点类型' })
], NodeTypeDict);
let ShowModeDict = class ShowModeDict {
    static NORMAL = 'NORMAL';
    static DEV = 'DEV';
};
exports.ShowModeDict = ShowModeDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '正常', type: 'success' }),
    __metadata("design:type", Object)
], ShowModeDict, "NORMAL", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '开发者模式', type: 'warning' }),
    __metadata("design:type", Object)
], ShowModeDict, "DEV", void 0);
exports.ShowModeDict = ShowModeDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'show_mode', label: '显示模式' })
], ShowModeDict);
let IsAutoSyncDict = class IsAutoSyncDict {
    static YES = 1;
    static NO = 0;
};
exports.IsAutoSyncDict = IsAutoSyncDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '是', type: 'success' }),
    __metadata("design:type", Object)
], IsAutoSyncDict, "YES", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '否', type: 'info' }),
    __metadata("design:type", Object)
], IsAutoSyncDict, "NO", void 0);
exports.IsAutoSyncDict = IsAutoSyncDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'is_auto_sync', label: '是否自动同步' })
], IsAutoSyncDict);
let IsVisibleDict = class IsVisibleDict {
    static YES = 1;
    static NO = 0;
};
exports.IsVisibleDict = IsVisibleDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '是', type: 'success' }),
    __metadata("design:type", Object)
], IsVisibleDict, "YES", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '否', type: 'info' }),
    __metadata("design:type", Object)
], IsVisibleDict, "NO", void 0);
exports.IsVisibleDict = IsVisibleDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'is_visible', label: '是否可见' })
], IsVisibleDict);
let IsCacheDict = class IsCacheDict {
    static YES = 1;
    static NO = 0;
};
exports.IsCacheDict = IsCacheDict;
__decorate([
    (0, decorator_1.DictEntry)({ label: '是', type: 'success' }),
    __metadata("design:type", Object)
], IsCacheDict, "YES", void 0);
__decorate([
    (0, decorator_1.DictEntry)({ label: '否', type: 'info' }),
    __metadata("design:type", Object)
], IsCacheDict, "NO", void 0);
exports.IsCacheDict = IsCacheDict = __decorate([
    (0, decorator_1.DictMeta)({ key: 'is_cache', label: '是否缓存' })
], IsCacheDict);
//# sourceMappingURL=permission.js.map