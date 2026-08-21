/**
 * @fileoverview 冲正记录控制器
 * @description 冲正记录查询（审计入口）；冲正独立落表不入交易单表，故与交易单列表/详情独立
 * 路由前缀 /api/ext/ledger/reversals
 */

import { Controller, Get, Query, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { SkipPermission } from 'moyan-mfw-base/backend'
import { LedgerTransferService } from '../services/ledger-transfer.service'
import { QueryReversalDto } from '../dto'

@ApiTags('ledger-reversal', '冲正记录')
@ApiBearerAuth('Authorization')
@Controller('reversals')
export class LedgerReversalController {
  constructor(private readonly service: LedgerTransferService) {}

  @Get()
  @ApiOperation({ summary: '冲正记录分页（审计入口；按冲正单号/原单号/业务类型过滤）' })
  @SkipPermission()
  async findAll(@Query() query: QueryReversalDto) {
    const filter: any = {
      reversalNo: query.reversalNo,
      originalTransferNo: query.originalTransferNo,
      bizType: query.bizType,
      page: query.page,
      pageSize: query.pageSize,
    }
    const result = await this.service.queryReversals(filter)
    return { code: 0, data: result, message: '查询成功' }
  }

  @Get(':reversalNo')
  @ApiOperation({ summary: '冲正记录详情' })
  @SkipPermission()
  async findByNo(@Param('reversalNo') reversalNo: string) {
    const result = await this.service.getReversal(reversalNo)
    return { code: 0, data: result, message: '查询成功' }
  }
}
