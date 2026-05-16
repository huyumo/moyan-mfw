/**
 * 数据库字段类型，该文件的类型为自动生成，请勿手动修改
 */
export type ObjectId = string
export type int = number | string
export type integer = number | string
export type float = number | string
export type tinyint = number | string
export type char = string
export type varchar = string
export type json =
  | { [key: string]: unknown }
  | Array<{ [key: string]: unknown }>
export type datetime = Date | string
export type date = Date | string
export type array = Array<unknown>
export type text = string
export type decimal = number | string

export type CreateAdPlacementDto = {
  name: string // 广告位名称
  code: string // 广告位编码
  width: number // 宽度(px)
  height: number // 高度(px)
  description?: string // 广告位描述
  sortOrder: number // 排序号
}

export type AdPlacementResponseDto = {
  id: string // 广告位 ID
  name: string // 广告位名称
  code: string // 广告位编码 - 唯一标识
  width: number // 宽度(px)
  height: number // 高度(px)
  description: string // 广告位描述
  status: number // 状态: 1=启用 0=禁用
  sortOrder: number // 排序号
  createdAt: string // 创建时间
  updateAt: string // 更新时间
}

export type PageResponseDto = {
  total: number // 总数量
  page: number // 当前页码
  pageSize: number // 每页数量
  totalPages: number // 总页数
  hasNext: boolean // 是否有下一页
  hasPrev: boolean // 是否有上一页
}

export type UpdateAdPlacementDto = {
  name?: string // 广告位名称
  code?: string // 广告位编码
  width?: number // 宽度(px)
  height?: number // 高度(px)
  description?: string // 广告位描述
  status?: number // 状态: 1=启用 0=禁用
  sortOrder?: number // 排序号
}

export type ImageResource = {
  src: string
  width: number
  height: number
}

export type MediaResource = {
  url: string
  name: string
  type: string
  size?: number
  duration?: number
}

export type CreateAdDto = {
  placementId: string
  title: string
  mediaType: 'image' | 'video'
  media: ImageResource | MediaResource
  linkType: string
  linkUrl?: string
  miniAppId?: string
  miniAppPath?: string
  internalRoute?: string
  startTime?: string
  endTime?: string
  sortOrder: number
}

export type AdPlacementBriefDto = {
  id: string // 广告位 ID
  name: string // 广告位名称
  code: string // 广告位编码
}

export type AdResponseDto = {
  id: string
  placementId: string
  placement: AdPlacementBriefDto
  title: string
  mediaType: 'image' | 'video'
  media: ImageResource | MediaResource
  linkUrl?: string
  linkType: string
  miniAppId?: string
  miniAppPath?: string
  internalRoute?: string
  startTime?: string
  endTime?: string
  status: number
  sortOrder: number
  createdAt: string
  updateAt: string
}

export type UpdateAdDto = {
  title?: string
  mediaType?: 'image' | 'video'
  media?: ImageResource | MediaResource
  linkType?: string
  linkUrl?: string
  miniAppId?: string
  miniAppPath?: string
  internalRoute?: string
  startTime?: string
  endTime?: string
  status?: number
  sortOrder?: number
}

export type SortItem = {
  id: string // 广告 ID
  sortOrder: number // 排序号
}

export type BatchUpdateSortDto = {
  items: Array<SortItem> // 排序项列表
}
