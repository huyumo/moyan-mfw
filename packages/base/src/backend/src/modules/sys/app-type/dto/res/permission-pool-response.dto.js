"use strict";
/**
 * @fileoverview 权限池响应 DTO
 * @description 权限池配置的响应数据结构
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
exports.UpdatePermissionPoolResponseDto = exports.PermissionPoolResponseDto = exports.PermissionTreesResponseDto = void 0;
const permission_1 = require("@/modules/sys/permission");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
// /**
//  * 权限树节点响应 DTO
//  * @description 权限树节点的详细信息
//  */
// export class PermissionTreeNodeDto {
//   /**
//    * 权限 ID
//    */
//   @ApiProperty({ description: '权限 ID' })
//   @Expose()
//   id: string;
//   /**
//    * 权限名称
//    */
//   @ApiProperty({ description: '权限名称' })
//   @Expose()
//   permName: string;
//   /**
//    * 权限编码
//    */
//   @ApiProperty({ description: '权限编码' })
//   @Expose()
//   permCode: string;
//   /**
//    * 权限描述
//    */
//   @ApiPropertyOptional({ description: '权限描述' })
//   @Expose()
//   permDesc?: string;
//   /**
//    * 权限类型
//    * @description PC-平台权限 / NORMAL-普通权限
//    */
//   @ApiProperty({ description: '权限类型', enum: ['PC', 'NORMAL'] })
//   @Expose()
//   permissionType: 'PC' | 'NORMAL';
//   /**
//    * 节点类型
//    * @description MENU-菜单 / PAGE-页面 / TAG-标签
//    */
//   @ApiProperty({ description: '节点类型', enum: ['MENU', 'PAGE', 'TAG'] })
//   @Expose()
//   nodeType: 'MENU' | 'PAGE' | 'TAG';
//   /**
//    * 父权限 ID
//    */
//   @ApiPropertyOptional({ description: '父权限 ID' })
//   @Expose()
//   parentId?: string;
//   /**
//    * 路由路径
//    */
//   @ApiPropertyOptional({ description: '路由路径' })
//   @Expose()
//   routePath?: string;
//   /**
//    * 外部链接
//    */
//   @ApiPropertyOptional({ description: '外部链接 URL' })
//   @Expose()
//   externalUrl?: string;
//   /**
//    * 图标名称
//    */
//   @ApiPropertyOptional({ description: '图标名称' })
//   @Expose()
//   iconName?: string;
//   /**
//    * 排序号
//    */
//   @ApiProperty({ description: '排序号' })
//   @Expose()
//   sortOrder: number;
//   /**
//    * 是否可见
//    */
//   @ApiProperty({ description: '是否可见' })
//   @Expose()
//   isVisible: number;
//   /**
//    * 是否缓存
//    */
//   @ApiProperty({ description: '是否缓存' })
//   @Expose()
//   isCache: number;
//   /**
//    * 显示模式
//    * @description NORMAL-正常显示 / DEV-开发者模式显示
//    */
//   @ApiProperty({ description: '显示模式', enum: ['NORMAL', 'DEV'] })
//   @Expose()
//   showMode: 'NORMAL' | 'DEV';
//   /**
//    * 权限状态
//    */
//   @ApiProperty({ description: '权限状态（1:启用 0:禁用）' })
//   @Expose()
//   permStatus: number;
//   /**
//    * 是否自动同步
//    */
//   @ApiPropertyOptional({ description: '是否自动同步' })
//   @Expose()
//   isAutoSync?: number;
//   /**
//    * 是否选中
//    * @description 前端勾选状态，true=已选中
//    */
//   @ApiProperty({ description: '是否选中（前端勾选状态）' })
//   @Expose()
//   checked: boolean;
//   /**
//    * 权限值
//    * @description 位运算权限值，十进制字符串格式
//    */
//   @ApiPropertyOptional({ description: '权限值（位运算权限值，十进制字符串格式）' })
//   @Expose()
//   permissionValue?: string;
//   /**
//    * 父权限的权限值
//    * @description 权限池场景：Permission 实体定义的 permissionValue；角色权限场景：权限池配置的 permissionValue
//    */
//   @ApiPropertyOptional({ description: '父权限的权限值（十进制字符串格式）' })
//   @Expose()
//   parentPermissionValue?: string;
//   /**
//    * 子节点列表
//    */
//   @ApiPropertyOptional({ description: '子节点列表', type: [PermissionTreeNodeDto] })
//   @Expose()
//   @Type(() => PermissionTreeNodeDto)
//   children?: PermissionTreeNodeDto[];
// }
/**
 * 权限树响应 DTO
 * @description 包含 PC 权限树和普通权限树
 */
class PermissionTreesResponseDto {
    /**
     * PC 权限树
     */
    pcTree;
    /**
     * 普通权限树
     */
    normalTree;
}
exports.PermissionTreesResponseDto = PermissionTreesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'PC 权限树', type: [permission_1.PermissionTreeNodeDto] }),
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => permission_1.PermissionTreeNodeDto),
    __metadata("design:type", Array)
], PermissionTreesResponseDto.prototype, "pcTree", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '普通权限树', type: [permission_1.PermissionTreeNodeDto] }),
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => permission_1.PermissionTreeNodeDto),
    __metadata("design:type", Array)
], PermissionTreesResponseDto.prototype, "normalTree", void 0);
/**
 * 权限池响应 DTO
 * @description 获取权限池配置的响应数据
 */
class PermissionPoolResponseDto {
    /**
     * 应用类型 ID
     */
    appTypeId;
    /**
     * 权限树配置
     */
    permissionTrees;
}
exports.PermissionPoolResponseDto = PermissionPoolResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], PermissionPoolResponseDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '权限树配置', type: PermissionTreesResponseDto }),
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => PermissionTreesResponseDto),
    __metadata("design:type", PermissionTreesResponseDto)
], PermissionPoolResponseDto.prototype, "permissionTrees", void 0);
/**
 * 更新权限池响应 DTO
 * @description 更新权限池配置的响应数据
 */
class UpdatePermissionPoolResponseDto {
    /**
     * 应用类型 ID
     */
    appTypeId;
    /**
     * 更新数量
     */
    updatedCount;
}
exports.UpdatePermissionPoolResponseDto = UpdatePermissionPoolResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '应用类型 ID' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], UpdatePermissionPoolResponseDto.prototype, "appTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新的权限节点数量' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], UpdatePermissionPoolResponseDto.prototype, "updatedCount", void 0);
//# sourceMappingURL=permission-pool-response.dto.js.map