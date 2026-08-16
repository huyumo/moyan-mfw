/**
 * @fileoverview 扫码扩展包 NestJS 模块
 * @description 注册扫码记录/扩展数据/策略配置实体和 ScanCodeService，导出供外部模块使用
 *
 * 使用方式：
 *   1. imports: [ScanCodeModule]（业务层 AppModule 引入）
 *   2. 生成：注入 ScanCodeService，调用 generate()（码格式/场景白名单来自配置页面）
 *   3. 解析/核销：调用 parse() / use()
 *   4. 配置页面：前端引入 MfwScanCodeConfigPage，接口挂载在 /api/ext/scan-code/config/*
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { ScanCodeRecord, ScanCodeData, ScanCodeSetting } from './entities';
import { ScanCodeConfigService } from './config/scan-code-config.service';
import { ScanCodeConfigController } from './config/controller/scan-code-config.controller';
import { ScanCodeService } from './services/scan-code.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScanCodeRecord, ScanCodeData, ScanCodeSetting]),
    RouterModule.register([{ path: 'ext/scan-code', module: ScanCodeModule }]),
  ],
  controllers: [ScanCodeConfigController],
  providers: [ScanCodeConfigService, ScanCodeService],
  exports: [ScanCodeConfigService, ScanCodeService],
})
export class ScanCodeModule {}
