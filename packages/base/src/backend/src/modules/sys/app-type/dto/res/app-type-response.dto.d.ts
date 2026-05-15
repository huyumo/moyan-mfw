/**
 * @fileoverview 应用类型响应 DTO
 * @description 应用类型信息的响应数据结构
 */
/**
 * 应用类型响应 DTO
 */
export declare class AppTypeResponseDto {
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
    builtinRoleCount: number;
}
