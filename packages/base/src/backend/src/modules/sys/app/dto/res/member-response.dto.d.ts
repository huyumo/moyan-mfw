/**
 * @fileoverview 成员响应 DTO
 * @description 应用成员信息的响应数据结构
 */
import { ImageResourceDto } from '@/common';
declare const MemberUserInfoDto_base: import("node_modules/@nestjs/common").Type<Pick<unknown, never>>;
export declare class MemberUserInfoDto extends MemberUserInfoDto_base {
}
declare const MemberRoleInfoDto_base: import("node_modules/@nestjs/common").Type<Pick<unknown, never>>;
export declare class MemberRoleInfoDto extends MemberRoleInfoDto_base {
    roleId: string;
}
/**
 * 成员响应 DTO
 */
export declare class MemberResponseDto {
    /**
     * 成员 ID（应用 - 成员关联 ID）
     */
    id: string;
    /**
     * 应用 ID
     */
    appId: string;
    /**
     * 用户 ID
     */
    userId: string;
    /**
     * 创建时间
     */
    createdAt: Date;
    /**
     * 用户昵称
     */
    nickname: string;
    /**
     * 用户头像
     */
    avatar: string;
    /**
     * 用户邮箱
     */
    email: string;
    /**
     * 用户手机号
     */
    phone: string;
    /**
     * 用户名
     */
    username: string;
    /**
     * 应用编码
     */
    appCode: string;
    /**
     * 应用名称
     */
    appName: string;
    /**
     * 应用 Logo
     */
    appLogo: ImageResourceDto;
    /**
     * 拥有者 ID
     */
    ownerId: string;
    /**
     * 排序序号
     */
    sortOrder: number;
    /**
     * 应用类型 ID
     */
    appTypeId: string;
    /**
     * 角色列表
     */
    roles?: MemberRoleInfoDto[];
    /**
     * 是否拥有者角色
     */
    isOwner: number;
}
/**
 * 可选角色响应 DTO
 */
export declare class AvailableAvailableRoleDto {
    /**
     * 角色 ID
     */
    id: string;
    /**
     * 角色名称
     */
    roleName: string;
    /**
     * 角色编码
     */
    roleCode: string;
    /**
     * 是否内置角色
     */
    isBuiltin: number;
    /**
     * 是否拥有者角色
     */
    isOwner: number;
}
export {};
