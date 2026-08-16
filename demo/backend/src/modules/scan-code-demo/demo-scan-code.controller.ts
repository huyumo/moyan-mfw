/**
 * @fileoverview 扫码演示控制器
 * @description 演示二维码生成 → 解析 → 核销完整链路：
 *   - generate：码格式/场景白名单来自扫码配置页面
 *   - parse：懒标记过期
 *   - use：单次码条件更新防并发重复核销（重复核销返回 400）
 */

import { Controller, Post, Get, Body, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger'
import {
  ScanCodeService,
  GenerateScanCodeDto,
  UseScanCodeDto,
} from 'moyan-mfw-extension-scan-code/backend'

/** 演示固定操作人（真实业务从登录态取） */
const DEMO_OPERATOR_ID = 'demo-operator'

@ApiTags('demo-scan-code', '扫码扩展演示接口')
@Controller('demo/scan-code')
export class DemoScanCodeController {
  constructor(private readonly scanCodeService: ScanCodeService) {}

  @Post('generate')
  @ApiOperation({
    summary: '生成二维码',
    description: '码格式（分组/分隔符/字符集）与场景白名单来自扫码配置页面',
  })
  async generate(@Body() dto: GenerateScanCodeDto) {
    return this.scanCodeService.generate(dto)
  }

  @Get('parse/:code')
  @ApiOperation({ summary: '解析二维码', description: '扫码后查记录；过期自动标记' })
  @ApiParam({ name: 'code', description: '二维码内容' })
  async parse(@Param('code') code: string) {
    return this.scanCodeService.parse(code)
  }

  @Post('use')
  @ApiOperation({
    summary: '核销二维码',
    description: '单次码（type=2）重复核销返回 400；多次码累加 usedCount',
  })
  async use(@Body() dto: UseScanCodeDto) {
    return this.scanCodeService.use(dto.code, DEMO_OPERATOR_ID, dto.storeId)
  }
}
