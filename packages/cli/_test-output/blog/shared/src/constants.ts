/**
 * @fileoverview 常量定义
 */
export const LINK_TYPE = {
  IMAGE: 'image',
  URL: 'url',
} as const;
export type LinkType = (typeof LINK_TYPE)[keyof typeof LINK_TYPE];
export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  image: '图片',
  url: '链接',
};
