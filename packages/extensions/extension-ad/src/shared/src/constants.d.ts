/**
 * @fileoverview 共享常量定义
 * @description 前后端共用的链接类型常量
 */
export declare const LINK_TYPE: {
    readonly MINIAPP: "miniapp";
    readonly INTERNAL: "internal";
    readonly EXTERNAL: "external";
};
export type LinkType = (typeof LINK_TYPE)[keyof typeof LINK_TYPE];
export declare const LINK_TYPE_LABELS: Record<LinkType, string>;
