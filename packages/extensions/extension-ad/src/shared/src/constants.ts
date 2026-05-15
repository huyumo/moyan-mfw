/**
 * @fileoverview 共享常量定义
 * @description 前后端共用的链接类型常量
 */

export const LINK_TYPE = {
  MINIAPP: 'miniapp',
  INTERNAL: 'internal',
  EXTERNAL: 'external',
} as const

export type LinkType = (typeof LINK_TYPE)[keyof typeof LINK_TYPE]

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  miniapp: '小程序跳转',
  internal: 'App内部跳转',
  external: '外部链接跳转',
}
