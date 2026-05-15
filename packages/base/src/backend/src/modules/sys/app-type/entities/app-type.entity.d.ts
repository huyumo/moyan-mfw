/**
 * @fileoverview 应用类型实体
 * @description 应用分类/应用类型定义
 */
/**
 * 应用类型实体
 * @description 应用分类表，定义系统中的应用类型
 */
export declare class AppType {
    /**
     * 应用类型 ID
     */
    id: string;
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
    typeDesc: string;
    /**
     * 图标
     */
    icon: string;
    /**
     * 是否支持多应用
     */
    multiAppEnabled: number;
    /**
     * 类型状态
     */
    typeStatus: number;
    /**
     * 排序
     */
    sortOrder: number;
}
