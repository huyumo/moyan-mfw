/**
 * @fileoverview 扫码扩展包调用用例演示模块
 * @description 业务层装配 extension-scan-code：
 *   - imports ScanCodeModule（配置管理接口自动挂载 /api/ext/scan-code/config/*）
 *   - DemoScanCodeController 演示生成 → 解析 → 核销完整链路（含单次码防重复核销）
 */

import { Module } from '@nestjs/common'
import { ScanCodeModule } from 'moyan-mfw-extension-scan-code/backend'
import { DemoScanCodeController } from './demo-scan-code.controller'

@Module({
  imports: [ScanCodeModule],
  controllers: [DemoScanCodeController],
})
export class DemoScanCodeModule {}
