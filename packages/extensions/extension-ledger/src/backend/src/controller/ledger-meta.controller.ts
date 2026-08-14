/**
 * @fileoverview 业务类型展示元数据控制器
 * @description GET /api/ext/ledger/biz-types：返回业务层 forRoot({ bizTypeMetas }) 配置，
 * 前端 MfwLedgerPage 挂载时拉取，驱动交易单列表动态列/搜索项/制单动态字段/详情扩展字段显示名。
 * 展示元数据由业务层在服务端配置，前端零配置
 */

import { Controller, Get, Inject } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { SkipPermission } from 'moyan-mfw-base/backend'
import { LEDGER_OPTIONS, type LedgerModuleOptions } from '../spi/interfaces'

@ApiTags('ledger-meta', '借贷记账业务类型元数据')
@ApiBearerAuth('Authorization')
@Controller('biz-types')
export class LedgerMetaController {
  constructor(@Inject(LEDGER_OPTIONS) private readonly options: LedgerModuleOptions) {}

  @Get()
  @ApiOperation({
    summary: '业务类型展示元数据',
    description: 'forRoot({ bizTypeMetas }) 配置下发（label/search/columns），驱动前端动态列/搜索/详情显示名',
  })
  @SkipPermission()
  bizTypes() {
    return { code: 0, data: this.options.bizTypeMetas ?? {}, message: '查询成功' }
  }
}
