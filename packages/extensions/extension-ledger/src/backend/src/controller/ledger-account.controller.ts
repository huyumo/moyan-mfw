/**
 * @fileoverview 账本（账户）控制器
 * @description 开户（幂等）、查询；路由前缀 /api/ext/ledger/accounts
 */

import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { SkipPermission, ApiPaginatedResponse } from 'moyan-mfw-base/backend'
import { LedgerAccountService } from '../services/ledger-account.service'
import { OpenAccountDto, QueryAccountDto } from '../dto'

@ApiTags('ledger-account', '账本管理')
@ApiBearerAuth('Authorization')
@Controller('accounts')
export class LedgerAccountController {
  constructor(private readonly service: LedgerAccountService) {}

  @Post()
  @ApiOperation({ summary: '开户（幂等）', description: 'holderId+tag+currency 命中返回已有账户；初始余额同步入账' })
  async openAccount(@Body() dto: OpenAccountDto) {
    const result = await this.service.openAccount(dto)
    return { code: 0, data: result, message: '开户成功' }
  }

  @Get()
  @ApiOperation({ summary: '账户分页列表' })
  @SkipPermission()
  async findAll(@Query() query: QueryAccountDto) {
    const result = await this.service.queryAccounts(query)
    return { code: 0, data: result, message: '查询成功' }
  }

  @Get(':id')
  @ApiOperation({ summary: '账户详情' })
  @SkipPermission()
  async findById(@Param('id') id: string) {
    const result = await this.service.getAccount(id)
    return { code: 0, data: result, message: '查询成功' }
  }
}
