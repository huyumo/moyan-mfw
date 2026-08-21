/**
 * @fileoverview 分录（流水）控制器
 * @description 流水查询、导出（强制时间范围防全分区扫描）；路由前缀 /api/ext/ledger/entries
 */

import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { SkipPermission, RequirePermission } from 'moyan-mfw-base/backend'
import { LEDGER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ledger/shared'
import { LedgerTransferService } from '../services/ledger-transfer.service'
import { QueryEntryDto } from '../dto'

const PERM_EXPORT = '导出' // 框架内置权限标签

@ApiTags('ledger-entry', '分录流水')
@ApiBearerAuth('Authorization')
@Controller('entries')
export class LedgerEntryController {
  constructor(private readonly service: LedgerTransferService) {}

  @Get()
  @ApiOperation({ summary: '流水分页查询', description: '必带 accountId 单分区裁剪；跨任意月翻页无感' })
  @SkipPermission()
  async findAll(@Query() query: QueryEntryDto) {
    const filter: any = {
      accountId: query.accountId,
      transferNo: query.transferNo,
      direction: query.direction,
      bizType: query.bizType,
      page: query.page,
      pageSize: query.pageSize,
    }
    if (query.startDate) filter.startDate = new Date(query.startDate)
    if (query.endDate) filter.endDate = new Date(query.endDate)
    const result = await this.service.queryEntries(filter)
    return { code: 0, data: result, message: '查询成功' }
  }

  @Get('export')
  @ApiOperation({ summary: '流水导出（强制时间范围，单次最多31天）' })
  @RequirePermission(PERM_EXPORT)
  async export(@Query() query: QueryEntryDto) {
    if (!query.startDate || !query.endDate) {
      return { code: 400, data: null, message: '导出必须指定时间范围' }
    }
    const start = new Date(query.startDate)
    const end = new Date(query.endDate)
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    if (days > 31) {
      return { code: 400, data: null, message: '单次导出最多 31 天' }
    }
    // 一期：同步分页查询返回（大数据量后续改为异步生成文件）
    const result = await this.service.queryEntries({
      accountId: query.accountId,
      startDate: start,
      endDate: end,
      page: 1,
      pageSize: 10000,
    })
    return { code: 0, data: result, message: '导出成功' }
  }
}
