/**
 * @fileoverview 文档管理共享常量
 */

/**
 * 文档图片资源
 * @description 文档 images 字段的元素类型，与前端 ImageResource 对齐
 */
export interface DocumentImage {
  /** 图片 URL */
  src: string;
  /** 图片宽度（像素），可选 */
  width?: number;
  /** 图片高度（像素），可选 */
  height?: number;
}

/**
 * 文档类型枚举
 * @description 文档内容的形式
 */
export enum DocumentType {
  /** 图文 */
  IMAGE_TEXT = '图文',
  /** 视频 */
  VIDEO = '视频',
}

/**
 * 文档状态枚举
 * @description 0=草稿 1=已发布 2=已下线
 */
export enum DocumentStatus {
  /** 草稿 */
  DRAFT = 0,
  /** 已发布 */
  PUBLISHED = 1,
  /** 已下线 */
  OFFLINE = 2,
}

/**
 * 扩展字段值类型枚举
 * @description 描述 EAV 扩展表 extValue 的数据类型，便于反序列化与前端渲染
 */
export enum ExtValueType {
  /** 字符串 */
  STRING = 'string',
  /** 数字 */
  NUMBER = 'number',
  /** 布尔 */
  BOOLEAN = 'boolean',
  /** JSON 结构 */
  JSON = 'json',
}
