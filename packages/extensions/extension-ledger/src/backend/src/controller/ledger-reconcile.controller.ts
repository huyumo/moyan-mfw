/**
 * @fileoverview 对账控制器
 * @description 手动触发对账、报告查询、增量修复；路由前缀 /api/ext/ledger/reconcile
 * 定时对账由业务方对接 extension-scheduler（README 示例）
 */

import { Controller, Get, Post, Put, Body, Query, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { RequirePermission } from 'moyan-mfw-base/backend'
import { LEDGER_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ledger/shared'
import { LedgerReconcileService } from '../services/ledger-reconcile.service'
import { ReconcileTriggerDto } from '../dto'

const PERM_RECONCILE = LEDGER_EXTENSION_PERMISSION_VALUES[2] // '对账'

@ApiTags('ledger-reconcile', '对账管理')
@ApiBearerAuth('Authorization')
@Controller('reconcile')
export class LedgerReconcileController {
  constructor(private readonly service: LedgerReconcileService) {}

  @Post()
  @ApiOperation({ summary: '手动触发全量对账', description: '校验恒等式 balance+frozen+pendingOut ≡ Σ(signed_amount)' })
  @RequirePermission(PERM_RECONCILE)
  async runAll(@Body() dto: ReconcileTriggerDto) {
    const result = await this.service.runAll()
    return { code: 0, data: result, message: '对账完成' }
  }

  @Get('reports')
  @ApiOperation({ summary: '对账报告分页查询' })
  @RequirePermission(PERM_RECONCILE)
  async queryReports(@Query() query: { status?: number; page?: number; pageSize?: number }) {
    const result = await this.service.queryReports(query)
    return { code: 0, data: result, message: '查询成功' }
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: '单账户对账' })
  @RequirePermission(PERM_RECONCILE)
  async runAccount(@Param('accountId') accountId: string) {
    const result = await this.service.runAccount(accountId)
    return { code: 0, data: result, message: '对账完成' }
  }

  @Put('fix/:accountId')
  @ApiOperation({ summary: '增量修复（原子写调整分录 + 复验）', description: '大额差异只告警转人工' })
  @RequirePermission(PERM_RECONCILE)
  async applyFix(@Param('accountId') accountId: string) {
    const result = await this.service.applyFix(accountId)
    return { code: 0, data: result, message: result.fixed ? '修复成功' : '修复失败或需人工介入' }
  }
}
