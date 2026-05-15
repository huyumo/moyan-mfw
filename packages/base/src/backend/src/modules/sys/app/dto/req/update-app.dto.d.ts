/**
 * @fileoverview 更新应用请求 DTO
 * @description 更新应用实例的请求参数
 */
import { ImageResourceDto } from '@/common';
/**
 * 更新应用请求 DTO
 */
export declare class UpdateAppDto {
    /**
     * 应用编码
     */
    appCode?: string;
    /**
     * 应用名称
     */
    appName?: string;
    /**
     * 应用描述
     */
    appDesc?: string;
    /**
     * 应用 Logo
     */
    logo?: ImageResourceDto;
    /**
     * 应用状态
     */
    appStatus?: number;
    /**
     * 排序号
     */
    sortOrder?: number;
}
