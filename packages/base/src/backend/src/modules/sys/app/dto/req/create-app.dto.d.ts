/**
 * @fileoverview 创建应用请求 DTO
 * @description 创建应用实例的请求参数
 */
import { ImageResourceDto } from '@/common';
/**
 * 创建应用请求 DTO
 */
export declare class CreateAppDto {
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
    appDesc?: string;
    /**
     * 应用 Logo
     */
    logo?: ImageResourceDto;
    /**
     * 排序号
     */
    sortOrder?: number;
}
