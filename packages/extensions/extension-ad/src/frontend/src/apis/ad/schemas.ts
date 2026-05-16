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

export type CreateAdDto = {
  placementId: string // 广告位 ID
  title: string // 广告标题
  imageUrl: string // 广告图片 URL
  linkType: string // 跳转类型
  linkUrl?: string // 跳转链接
  miniAppId?: string // 小程序 AppId（linkType=miniapp 时）
  miniAppPath?: string // 小程序路径（linkType=miniapp 时）
  internalRoute?: string // App 内部路由路径（linkType=internal 时）
  startTime?: string // 投放开始时间
  endTime?: string // 投放结束时间
  sortOrder: number // 排序号
}

export type AdPlacementBriefDto = {
  id: string // 广告位 ID
  name: string // 广告位名称
  code: string // 广告位编码
}

export type AdResponseDto = {
  id: string // 广告 ID
  placementId: string // 所属广告位 ID
  placement: AdPlacementBriefDto // 所属广告位简要信息
  title: string // 广告标题
  imageUrl: string // 广告图片 URL
  linkUrl: string // 跳转链接
  linkType: string // 跳转类型: miniapp | internal | external
  miniAppId: string // 小程序 AppId（linkType=miniapp 时）
  miniAppPath: string // 小程序路径（linkType=miniapp 时）
  internalRoute: string // App 内部路由路径（linkType=internal 时）
  startTime: string // 投放开始时间
  endTime: string // 投放结束时间
  status: number // 状态: 1=启用 0=禁用
  sortOrder: number // 排序号
  createdAt: string // 创建时间
  updateAt: string // 更新时间
}

export type UpdateAdDto = {
  title?: string // 广告标题
  imageUrl?: string // 广告图片 URL
  linkType?: string // 跳转类型
  linkUrl?: string // 跳转链接
  miniAppId?: string // 小程序 AppId
  miniAppPath?: string // 小程序路径
  internalRoute?: string // App 内部路由路径
  startTime?: string // 投放开始时间
  endTime?: string // 投放结束时间
  status?: number // 状态: 1=启用 0=禁用
  sortOrder?: number // 排序号
}

export type SortItem = {
  id: string // 广告 ID
  sortOrder: number // 排序号
}

export type BatchUpdateSortDto = {
  items: Array<SortItem> // 排序项列表
}
