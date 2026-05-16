/**
 * API 调用类，该文件的API为自动生成，请勿手动修改
 */
import { ApiCall } from 'moyan-api'
import type { MoMethod } from 'moyan-api'

import type {
  CreateAdPlacementDto,
  AdPlacementResponseDto,
  PageResponseDto,
  UpdateAdPlacementDto,
  CreateAdDto,
  AdPlacementBriefDto,
  AdResponseDto,
  UpdateAdDto,
  SortItem,
  BatchUpdateSortDto,
  ObjectId,
  int,
  char,
  varchar,
  json,
  date,
  datetime,
  array,
  tinyint,
  text,
  integer,
  float,
  decimal,
} from './schemas'

/**
 * ad-placement|广告位相关接口->创建广告位
 */
export class ApiAdPlacementCreate extends ApiCall<
  {
    body: CreateAdPlacementDto
  },
  unknown
> {
  readonly path = '/api/ext/ad/ad-placements'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * ad-placement|广告位相关接口->查询广告位列表
 */
export class ApiAdPlacementFindAll extends ApiCall<
  {
    query: {
      page: number //页码
      pageSize: number //每页数量
      sortField?: string //排序字段
      sortOrder?: string //排序方向
      name?: string //广告位名称（模糊查询）
      code?: string //广告位编码（模糊查询）
      status?: number //状态
    }
  },
  PageResponseDto & {
    list: Array<AdPlacementResponseDto>
  }
> {
  readonly path = '/api/ext/ad/ad-placements'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * ad-placement|广告位相关接口->按编码获取广告位及广告（公开接口）
 */
export class ApiAdPlacementGetByCode extends ApiCall<
  {
    query: {
      code: string //广告位编码
    }
  },
  unknown
> {
  readonly path = '/api/ext/ad/ad-placements/by-code'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * ad-placement|广告位相关接口->查询广告位详情
 */
export class ApiAdPlacementFindById extends ApiCall<
  {
    params: {
      id: string //广告位 ID
    }
  },
  unknown
> {
  readonly path = '/api/ext/ad/ad-placements/{id}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * ad-placement|广告位相关接口->更新广告位
 */
export class ApiAdPlacementUpdate extends ApiCall<
  {
    body: UpdateAdPlacementDto
    params: {
      id: string //广告位 ID
    }
  },
  unknown
> {
  readonly path = '/api/ext/ad/ad-placements/{id}'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * ad-placement|广告位相关接口->删除广告位
 */
export class ApiAdPlacementDelete extends ApiCall<
  {
    params: {
      id: string //广告位 ID
    }
  },
  unknown
> {
  readonly path = '/api/ext/ad/ad-placements/{id}'
  readonly method: MoMethod = 'DELETE'
  readonly auth = true
}

/**
 * ad-content|广告内容相关接口->创建广告内容
 */
export class ApiAdCreate extends ApiCall<
  {
    body: CreateAdDto
  },
  unknown
> {
  readonly path = '/api/ext/ad/ad-contents'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * ad-content|广告内容相关接口->查询广告内容列表
 */
export class ApiAdFindAll extends ApiCall<
  {
    query: {
      page: number //页码
      pageSize: number //每页数量
      sortField?: string //排序字段
      sortOrder?: string //排序方向
      placementId?: string //广告位 ID
      title?: string //广告标题（模糊查询）
      linkType?: string //跳转类型
      status?: number //状态
    }
  },
  PageResponseDto & {
    list: Array<AdResponseDto>
  }
> {
  readonly path = '/api/ext/ad/ad-contents'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * ad-content|广告内容相关接口->查询广告内容详情
 */
export class ApiAdFindById extends ApiCall<
  {
    params: {
      id: string //广告 ID
    }
  },
  unknown
> {
  readonly path = '/api/ext/ad/ad-contents/{id}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * ad-content|广告内容相关接口->更新广告内容
 */
export class ApiAdUpdate extends ApiCall<
  {
    body: UpdateAdDto
    params: {
      id: string //广告 ID
    }
  },
  unknown
> {
  readonly path = '/api/ext/ad/ad-contents/{id}'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * ad-content|广告内容相关接口->删除广告内容
 */
export class ApiAdDelete extends ApiCall<
  {
    params: {
      id: string //广告 ID
    }
  },
  unknown
> {
  readonly path = '/api/ext/ad/ad-contents/{id}'
  readonly method: MoMethod = 'DELETE'
  readonly auth = true
}

/**
 * ad-content|广告内容相关接口->批量更新广告排序
 */
export class ApiAdBatchUpdateSort extends ApiCall<
  {
    body: BatchUpdateSortDto
  },
  unknown
> {
  readonly path = '/api/ext/ad/ad-contents/batch-sort'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}
