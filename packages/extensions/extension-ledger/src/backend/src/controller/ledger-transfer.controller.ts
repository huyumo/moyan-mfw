/**
 * @fileoverview 交易单控制器
 * @description 制单、审核、冲正、重推、取消、查询；路由前缀 /api/ext/ledger/transfers
 */

import {
  Controller, Get, Post, Put, Body, Query, Param,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { SkipPermission, RequirePermission } from 'moyan-mfw-base/backend'
import { LEDGER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ledger/shared'
import { LedgerTransferService } from '../services/ledger-transfer.service'
import {
  CreateTransferDto,
  AuditTransferDto,
  ReverseTransferDto,
  QueryTransferDto,
  BatchRepostDto,
} from '../dto'

// 权限标签索引（与 shared 声明顺序一致）
const PERM_AUDIT = LEDGER_EXTENSION_PERMISSION_VALUES[0] // '审核'
const PERM_REVERSE = LEDGER_EXTENSION_PERMISSION_VALUES[1] // '冲正'

@ApiTags('ledger-transfer', '交易单管理')
@ApiBearerAuth('Authorization')
@Controller('transfers')
export class LedgerTransferController {
  constructor(private readonly service: LedgerTransferService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '制单（同步预占 + 入队）', description: '免审单直接入队；需审单冻结待审' })
  @SkipPermission()
  async create(@Body() dto: CreateTransferDto) {
    const result = await this.service.createTransfer(dto)
    return { code: 0, data: result, message: result.created ? '制单成功' : '交易单已存在（幂等返回）' }
  }

  @Post('audit')
  @ApiOperation({ summary: '审核（通过入队 / 驳回解冻）' })
  @RequirePermission(PERM_AUDIT)
  async audit(@Body() dto: AuditTransferDto) {
    const result = await this.service.audit(dto)
    return { code: 0, data: result, message: result.action === 'approved' ? '审核通过' : '已驳回' }
  }

  @Post('reverse')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '全额冲正（原单须已入账）' })
  @RequirePermission(PERM_REVERSE)
  async reverse(@Body() dto: ReverseTransferDto) {
    const result = await this.service.reverse(dto)
    return { code: 0, data: result, message: result.created ? '冲正成功' : '冲正单已存在（幂等返回）' }
  }

  @Put('repost/:transferNo')
  @ApiOperation({ summary: '人工重推（FAILED/CANCELLED->PENDING）' })
  @RequirePermission(PERM_AUDIT)
  async repost(@Param('transferNo') transferNo: string) {
    const result = await this.service.repost(transferNo)
    return { code: 0, data: result, message: '重推成功' }
  }

  @Put('batch-repost')
  @ApiOperation({ summary: '批量重推（≤1000）' })
  @RequirePermission(PERM_AUDIT)
  async batchRepost(@Body() dto: BatchRepostDto) {
    const result = await this.service.batchRepost(dto.transferNos)
    return { code: 0, data: result, message: '批量重推成功' }
  }

  @Put('cancel/:transferNo')
  @ApiOperation({ summary: '取消（FAILED->CANCELLED + 按桶回滚预占）' })
  @RequirePermission(PERM_AUDIT)
  async cancel(@Param('transferNo') transferNo: string) {
    const result = await this.service.cancel(transferNo)
    return { code: 0, data: result, message: '取消成功' }
  }

  @Get()
  @ApiOperation({ summary: '交易单分页列表' })
  @SkipPermission()
  async findAll(@Query() query: QueryTransferDto) {
    const filter: any = { ...query }
    if (query.postStatus) {
      filter.postStatus = String(query.postStatus).split(',').map(Number)
    }
    if (query.extFields) {
      try {
        filter.extFields = JSON.parse(query.extFields)
      } catch {
        return { code: 400, data: null, message: 'extFields 必须是合法 JSON 字符串，如 {"promoterId":"P888"}' }
      }
    }
    const result = await this.service.queryTransfers(filter)
    return { code: 0, data: result, message: '查询成功' }
  }

  @Get(':transferNo')
  @ApiOperation({ summary: '交易单详情' })
  @SkipPermission()
  async findByNo(@Param('transferNo') transferNo: string) {
    const result = await this.service.getTransfer(transferNo)
    return { code: 0, data: result, message: '查询成功' }
  }
}
