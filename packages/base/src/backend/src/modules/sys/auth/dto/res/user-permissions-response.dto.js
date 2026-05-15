"use strict";
/**
 * @fileoverview 用户权限菜单响应 DTO
 * @description 用户权限菜单树结构响应
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
exports.UserPermissionsResponseDto = void 0;
const permission_1 = require("@/modules/sys/permission");
const swagger_1 = require("@nestjs/swagger");
// import { PermissionTreeNodeDto } from '..';
// /**
//  * 权限树节点 DTO
//  * @description 用于前端导航渲染的菜单节点
//  * 符合统一类型定义文档中的 PermissionTreeNode 结构
//  */
// export class PermissionTreeNodeDto {
//   /**
//    * 权限 ID
//    */
//   @ApiProperty({ description: '权限 ID' })
//   id: string;
//   /**
//    * 权限名称
//    */
//   @ApiProperty({ description: '权限名称' })
//   permName: string;
//   /**
//    * 权限编码
//    */
//   @ApiProperty({ description: '权限编码' })
//   permCode: string;
//   /**
//    * 权限描述
//    */
//   @ApiProperty({ description: '权限描述', required: false })
//   permDesc?: string;
//   /**
//    * 权限类型
//    */
//   @ApiProperty({
//     description: '权限类型',
//     enum: ['PC', 'NORMAL'],
//     example: 'PC',
//   })
//   permissionType: 'PC' | 'NORMAL';
//   /**
//    * 节点类型
//    */
//   @ApiProperty({
//     description: '节点类型',
//     enum: ['MENU', 'PAGE', 'TAG'],
//     example: 'MENU',
//   })
//   nodeType: 'MENU' | 'PAGE' | 'TAG';
//   /**
//    * 父权限 ID
//    */
//   @ApiProperty({ description: '父权限 ID', required: false })
//   parentId?: string;
//   /**
//    * 路由路径
//    */
//   @ApiProperty({ description: '路由路径', required: false })
//   routePath?: string;
//   /**
//    * 外部链接
//    */
//   @ApiProperty({ description: '外部链接', required: false })
//   externalUrl?: string;
//   /**
//    * 图标名称
//    */
//   @ApiProperty({ description: '图标名称', required: false })
//   iconName?: string;
//   /**
//    * 排序值
//    */
//   @ApiProperty({ description: '排序值', example: 0 })
//   sortOrder: number;
//   /**
//    * 是否可见
//    */
//   @ApiProperty({ description: '是否可见：1-是 0-否', example: 1 })
//   isVisible: number;
//   /**
//    * 是否缓存
//    */
//   @ApiProperty({ description: '是否缓存：1-是 0-否', example: 1 })
//   isCache: number;
//   /**
//    * 显示模式
//    */
//   @ApiProperty({
//     description: '显示模式',
//     enum: ['NORMAL', 'DEV'],
//     example: 'NORMAL',
//   })
//   showMode: 'NORMAL' | 'DEV';
//   /**
//    * 是否选中
//    */
//   @ApiProperty({ description: '是否选中', example: false })
//   checked: boolean;
//   /**
//    * 权限状态
//    */
//   @ApiProperty({ description: '权限状态：1-启用 0-禁用', example: 1 })
//   permStatus: number;
//   /**
//    * 权限值
//    * @description 位运算权限值，bigint 序列化为十进制字符串
//    */
//   @ApiProperty({
//     description: '位运算权限值（十进制字符串）',
//     example: '7',
//     required: false,
//   })
//   permissionValue?: string;
//   /**
//    * 子节点
//    */
//   @ApiProperty({
//     description: '子节点',
//     type: [PermissionTreeNodeDto],
//     required: false,
//   })
//   children?: PermissionTreeNodeDto[];
// }
/**
 * 用户权限菜单响应 DTO
 * @description 用户在指定应用实例下的权限菜单树
 */
class UserPermissionsResponseDto {
    /**
     * 菜单树
     */
    menuTree;
    /**
     * 权限列表（扁平化）
     * @description 用于前端权限判断的扁平化权限列表
     */
    permissions;
    /**
     * 应用类型 ID
     */
    appTypeId;
    /**
     * 权限值映射
     * @description 用户权限值映射（permCode → permissionValue）
     */
    permissionValueMap;
}
exports.UserPermissionsResponseDto = UserPermissionsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户权限菜单树',
        type: [permission_1.PermissionTreeNodeDto],
    }),
    __metadata("design:type", Array)
], UserPermissionsResponseDto.prototype, "menuTree", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户权限列表（扁平化）',
        type: [String],
        example: ['system:user-list:view', 'system:role:edit'],
    }),
    __metadata("design:type", Array)
], UserPermissionsResponseDto.prototype, "permissions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID' }),
    __metadata("design:type", String)
], UserPermissionsResponseDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: 'json',
        description: '权限值映射（permCode → permissionValue）',
        example: { 'pc_root:sys:app': '7', 'pc_root:sys:role': '3' },
        required: false,
    }),
    __metadata("design:type", Object)
], UserPermissionsResponseDto.prototype, "permissionValueMap", void 0);
//# sourceMappingURL=user-permissions-response.dto.js.map