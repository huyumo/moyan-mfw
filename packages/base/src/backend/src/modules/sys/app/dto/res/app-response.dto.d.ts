/**
 * @fileoverview 应用响应 DTO
 * @description 应用实例信息的响应数据结构
 */
import { ImageResourceDto } from '@/common';
/**
 * 应用响应 DTO
 */
export declare class AppResponseDto {
    /**
     * 应用 ID
     */
    id: string;
    /**
     * 应用类型 ID
     */
    appTypeId: string;
    /**
     * 应用名称
     */
    appName: string;
    /**
     * 应用编码
     */
    appCode: string;
    /**
     * 应用描述
     */
    appDesc: string;
    /**
     * 拥有者 ID
     */
    ownerId: string;
    /**
     * 应用 Logo
     */
    logo: ImageResourceDto;
    /**
     * 应用状态
     */
    appStatus: number;
    /**
     * 排序号
     */
    sortOrder: number;
    /**
     * 创建时间
     */
    createdAt: Date;
    /**
     * 更新时间
     */
    updateAt: Date;
}
/**
 * 应用详情响应 DTO（包含关联信息）
 */
export declare class AppDetailResponseDto extends AppResponseDto {
    /**
     * 应用类型信息
     */
    appType?: {
        id: string;
        typeName: string;
        typeCode: string;
    };
    /**
     * 拥有者信息
     */
    owner?: {
        id: string;
        username: string;
        nickname: string;
        avatar: string;
    };
}
