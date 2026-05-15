"use strict";
/**
 * @fileoverview 权限实体
 * @description 系统权限实体，定义系统中的所有权限点
 */
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
exports.Permission = exports.ShowMode = exports.NodeType = exports.PermissionType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../common/entities/base.entity");
const shared_1 = require("moyan-mfw-base/shared");
/**
 * 权限类型枚举
 */
var PermissionType;
(function (PermissionType) {
    /** 平台权限 - 跨应用的全局权限 */
    PermissionType["PC"] = "PC";
    /** 普通权限 - 单个应用的权限 */
    PermissionType["NORMAL"] = "NORMAL";
})(PermissionType || (exports.PermissionType = PermissionType = {}));
/**
 * 节点类型枚举
 */
var NodeType;
(function (NodeType) {
    /** 菜单节点 */
    NodeType["MENU"] = "MENU";
    /** 页面节点 */
    NodeType["PAGE"] = "PAGE";
    /** 标签/按钮节点 */
    NodeType["TAG"] = "TAG";
})(NodeType || (exports.NodeType = NodeType = {}));
/**
 * 显示模式枚举
 */
var ShowMode;
(function (ShowMode) {
    /** 正常显示 */
    ShowMode["NORMAL"] = "NORMAL";
    /** 开发者模式显示 */
    ShowMode["DEV"] = "DEV";
})(ShowMode || (exports.ShowMode = ShowMode = {}));
/**
 * 权限实体类
 * @description 系统权限表，定义系统中的所有权限点
 */
let Permission = class Permission extends base_entity_1.Base {
    /**
     * 权限 ID
     * @description 主键，UUID 格式
     */
    id;
    /**
     * 权限名称
     * @description 权限的中文名称
     */
    permName;
    /**
     * 权限编码
     * @description 权限的唯一标识，根据tree 树结构自动组装，例如：normal_root:xxx:xxx:xxx，pc_root:sys:permission
     */
    permCode;
    /**
     * 权限描述
     * @description 权限的详细描述
     */
    permDesc;
    /**
     * 权限类型
     * @description PC-平台权限 / NORMAL-普通权限
     */
    permissionType;
    /**
     * 节点类型
     * @description MENU-菜单/PAGE-页面/TAG-标签
     */
    nodeType;
    /**
     * 父权限 ID
     * @description 父级权限 ID，用于构建树形结构
     */
    parentId;
    /**
     * 父权限
     * @description 父级权限对象
     */
    parent;
    /**
     * 子权限列表
     * @description 子权限列表
     */
    children;
    /**
     * 路由路径
     * @description 前端路由路径，用于菜单导航
     */
    routePath;
    /**
     * 是否自动同步
     * @description 是否由系统自动同步生成
     */
    isAutoSync;
    /**
     * 外部链接
     * @description 外部跳转 URL，用于外链菜单
     */
    externalUrl;
    /**
     * 图标名称
     * @description 前端展示的图标名称
     */
    iconName;
    /**
     * 排序
     * @description 权限排序号，数值越小越靠前
     */
    sortOrder;
    /**
     * 是否可见
     * @description 是否在前端菜单中显示
     */
    isVisible;
    /**
     * 是否缓存
     * @description 是否缓存页面
     */
    isCache;
    /**
     * 显示模式
     * @description NORMAL-正常显示 / DEV-开发者模式显示
     */
    showMode;
    /**
     * 权限状态
     * @description 状态 - 1:启用 0:禁用 - 控制权限是否可用
     */
    permStatus;
    /**
     * 权限值
     * @description 位运算权限值，用于细粒度权限控制
     */
    permissionValue;
    /**
     * 关联角色
     * @description 关联此权限的所有角色（通过 sys_role_permissions 关联表）
     */
    // 注：实际关系通过 RolePermission 实体管理，避免循环依赖
    roles;
};
exports.Permission = Permission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Permission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, comment: '权限名称 - 权限的中文名称' }),
    __metadata("design:type", String)
], Permission.prototype, "permName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, comment: '权限编码 - 唯一标识，根据树结构自动组装' }),
    __metadata("design:type", String)
], Permission.prototype, "permCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '权限描述 - 详细说明' }),
    __metadata("design:type", String)
], Permission.prototype, "permDesc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PermissionType, comment: (0, shared_1.toDescription)(shared_1.PermissionTypeDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Permission.prototype, "permissionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: NodeType, nullable: true, comment: (0, shared_1.toDescription)(shared_1.NodeTypeDict) }),
    __metadata("design:type", String)
], Permission.prototype, "nodeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36, nullable: true, comment: '父权限 ID - 构建树形结构' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], Permission.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Permission, (permission) => permission.children),
    (0, typeorm_1.JoinColumn)({ name: 'parentId' }),
    __metadata("design:type", Permission)
], Permission.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Permission, (permission) => permission.parent),
    __metadata("design:type", Array)
], Permission.prototype, "children", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '路由路径 - 前端路由路径' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Permission.prototype, "routePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.IsAutoSyncDict.NO, comment: (0, shared_1.toDescription)(shared_1.IsAutoSyncDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Permission.prototype, "isAutoSync", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true, comment: '外部链接 URL - 用于外链菜单' }),
    __metadata("design:type", String)
], Permission.prototype, "externalUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true, comment: '图标名称 - 前端展示的图标' }),
    __metadata("design:type", String)
], Permission.prototype, "iconName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, comment: '排序号 - 数值越小越靠前' }),
    __metadata("design:type", Number)
], Permission.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.IsVisibleDict.YES, comment: (0, shared_1.toDescription)(shared_1.IsVisibleDict) }),
    __metadata("design:type", Number)
], Permission.prototype, "isVisible", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.IsCacheDict.YES, comment: (0, shared_1.toDescription)(shared_1.IsCacheDict) }),
    __metadata("design:type", Number)
], Permission.prototype, "isCache", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ShowMode, default: ShowMode.NORMAL, comment: (0, shared_1.toDescription)(shared_1.ShowModeDict) }),
    __metadata("design:type", String)
], Permission.prototype, "showMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: shared_1.StatusDict.ENABLED, comment: (0, shared_1.toDescription)(shared_1.StatusDict) }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Permission.prototype, "permStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', unsigned: true, default: 0, comment: '权限值 - 位运算权限值，用于细粒度权限控制' }),
    __metadata("design:type", BigInt)
], Permission.prototype, "permissionValue", void 0);
exports.Permission = Permission = __decorate([
    (0, typeorm_1.Entity)('sys_permissions'),
    (0, typeorm_1.Unique)(['permCode'])
], Permission);
//# sourceMappingURL=permission.entity.js.map