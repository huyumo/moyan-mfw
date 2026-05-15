/**
 * @fileoverview 通用资源类型定义
 * @description 定义图片、媒体、文件三种资源格式，供业务模块使用
 */
/**
 * 图片资源 DTO
 * @description 用于存储图片类型资源，包含尺寸信息
 */
export declare class ImageResourceDto {
    src: string;
    width: number;
    height: number;
}
/**
 * 媒体资源 DTO
 * @description 用于存储视频、音频等媒体资源
 */
export declare class MediaResourceDto {
    url: string;
    name: string;
    type: string;
    size?: number;
    duration?: number;
}
/**
 * 文件资源 DTO
 * @description 用于存储普通文件资源
 */
export declare class FileResourceDto {
    url: string;
    name: string;
    type: string;
    size?: number;
}
/**
 * 资源类型枚举
 */
export declare enum ResourceType {
    IMAGE = "image",
    MEDIA = "media",
    FILE = "file"
}
