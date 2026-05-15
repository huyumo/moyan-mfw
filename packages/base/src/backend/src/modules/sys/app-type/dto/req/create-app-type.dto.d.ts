/**
 * @fileoverview 创建应用类型请求 DTO
 * @description 创建应用类型的请求参数
 */
/**
 * 创建应用类型请求 DTO
 */
export declare class CreateAppTypeDto {
    /**
     * 类型名称
     */
    typeName: string;
    /**
     * 类型编码
     */
    typeCode: string;
    /**
     * 类型描述
     */
    typeDesc?: string;
    /**
     * 图标
     */
    icon?: string;
    /**
     * 是否支持多应用
     */
    multiAppEnabled?: number;
    /**
     * 类型状态
     */
    typeStatus?: number;
    /**
     * 排序号
     */
    sortOrder?: number;
}
