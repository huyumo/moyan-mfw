/**
 * @fileoverview 权限池更新请求 DTO
 * @description 更新应用类型权限池配置的请求参数
 */
/**
 * 权限树节点请求体
 * @description 用于提交权限节点的勾选状态和权限值
 */
export declare class PermissionTreePayloadDto {
    /**
     * 权限 ID
     */
    id: string;
    /**
     * 是否选中
     * @description true=加入权限池，false=移除
     */
    checked: boolean;
    /**
     * 权限值
     * @description 位运算权限值，十进制字符串格式
     */
    permissionValue?: string;
    /**
     * 子节点
     */
    children?: PermissionTreePayloadDto[];
}
/**
 * 权限树请求体
 * @description 包含 PC 权限树和普通权限树
 */
export declare class PermissionTreesDto {
    /**
     * PC 权限树
     */
    pcTree: PermissionTreePayloadDto[];
    /**
     * 普通权限树
     */
    normalTree: PermissionTreePayloadDto[];
}
/**
 * 更新权限池请求 DTO
 * @description 更新应用类型权限池配置
 */
export declare class UpdatePermissionPoolDto {
    /**
     * 权限树配置
     */
    permissionTrees: PermissionTreesDto;
}
