/**
 * @fileoverview 图片资源工具函数
 * @description 提供图片资源地址提取等通用方法
 */

/**
 * 图片资源结构（兼容 ImageResourceDto 和 ImageResource）
 */
interface ImageLike {
  src: string;
  width?: number;
  height?: number;
}

/**
 * 从图片资源中提取 URL 地址
 * @param image - 图片资源，支持字符串 URL、图片对象或 undefined
 * @returns 图片 URL 地址，无有效值时返回 undefined
 */
export function getImageSrc(image: string | ImageLike | undefined): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  return image.src;
}
