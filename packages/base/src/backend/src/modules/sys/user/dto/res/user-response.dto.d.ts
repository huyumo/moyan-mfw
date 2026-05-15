/**
 * @fileoverview 用户响应 DTO
 * @description 用户信息的响应数据结构
 */
import { ImageResourceDto } from '@/common';
/**
 * 用户响应 DTO
 */
export declare class UserResponseDto {
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
     * 手机号
     */
    phone: string;
    /**
     * 邮箱
     */
    email: string;
    /**
     * 头像
     */
    avatar: ImageResourceDto;
    /**
     * 性别 (0:未知 1:男 2:女)
     */
    gender: number;
    /**
     * 状态 (1:启用 0:禁用)
     */
    userStatus: number;
    /**
     * 是否开发者 (1:是 0:否)
     */
    isDeveloper: number;
    /**
     * 创建时间
     */
    createdAt: Date;
    /**
     * 更新时间
     */
    updateAt: Date;
}
