/**
 * @fileoverview 认证响应 DTO
 * @description 登录响应数据结构
 */
import { ImageResourceDto } from '@/common';
/**
 * 用户信息 DTO（登录响应中嵌套使用）
 */
export declare class UserSummaryDto {
    /**
     * 用户名
     */
    username: string;
    /**
     * 昵称
     */
    nickname: string;
    /**
     * 头像
     */
    avatar: ImageResourceDto;
}
/**
 * 登录响应 DTO
 */
export declare class LoginResponseDto {
    /**
     * 访问 Token
     */
    accessToken: string;
    /**
     * 刷新 Token
     */
    refreshToken: string;
    /**
     * Token 类型
     */
    tokenType: string;
    /**
     * 过期时间（秒）
     */
    expiresIn: number;
    /**
     * 用户信息
     */
    user?: UserSummaryDto;
}
/**
 * 用户信息响应 DTO
 */
export declare class UserInfoDto {
    /**
     * 用户 ID
     */
    id: string;
    /**
     * 用户名
     */
    username: string;
    /**
     * 昵称
     */
    nickname: string;
    /**
     * 头像
     */
    avatar: ImageResourceDto;
    /**
     * 角色列表
     */
    roles: string[];
}
/**
 * 应用实例项 DTO
 * @description 用户可访问的应用实例信息
 */
export declare class AppInstanceItemDto {
    /**
     * 应用实例 ID
     */
    appId: string;
    /**
     * 应用实例名称
     */
    appName: string;
    /**
     * 应用实例编码
     */
    appCode: string;
    /**
     * 应用类型 ID
     */
    appTypeId: string;
    /**
     * 应用类型编码
     */
    appTypeCode: string;
    /**
     * 应用类型名称
     */
    appTypeName: string;
    /**
     * 用户身份
     */
    role: 'owner' | 'member';
    /**
     * 应用 Logo
     */
    logo?: ImageResourceDto;
}
/**
 * 用户应用列表响应 DTO
 */
export declare class UserAppsResponseDto {
    /**
     * 应用实例列表
     */
    apps: AppInstanceItemDto[];
}
