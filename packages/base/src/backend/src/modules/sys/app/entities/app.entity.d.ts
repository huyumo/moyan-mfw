/**
 * @fileoverview 应用实例实体
 * @description 应用实例定义，存储应用的基本信息
 */
import { Base } from '../../../../common/entities/base.entity';
import { ImageResourceDto } from '@/common';
/**
 * 应用实例实体
 * @description 应用实例表，存储系统中的应用实例信息
 */
export declare class App extends Base {
    /**
     * 应用实例 ID
     */
    id: string;
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
     * 应用类型 ID
     */
    appTypeId: string;
    /**
     * 负责人 ID
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
}
