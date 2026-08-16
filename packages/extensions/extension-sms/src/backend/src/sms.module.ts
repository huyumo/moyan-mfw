/**
 * @fileoverview 短信扩展包 NestJS 模块
 *
 * 自包含模块：运营商凭证/模板配置管理（DB 持久化）+ 通用发送 + 模板解析 + 验证码四个能力。
 *
 * 使用方式：
 *   1. imports: [SmsModule]（业务层 AppModule 引入）
 *   2. 模板：配置页面管理（推荐），或在 onModuleInit 中 SmsTemplateService.register() 程序化注册
 *   3. 发验证码：注入 SmsCodeService，调用 sendCode() / verifyCode()
 *   4. 发通知短信：注入 SmsSdkService，调用 send()
 *   5. 配置页面：前端引入 MfwSmsConfigPage，接口挂载在 /api/ext/sms/config/*
 *
 * 依赖框架全局缓存（CACHE_SERVICE / REDIS_ONLY_SERVICE），
 * 由 createBaseBackendApp 自动装配（CACHE_DRIVER=redis/memory）。
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { SmsProviderSetting, SmsTemplate } from './config/entities';
import { SmsConfigService } from './config/sms-config.service';
import { SmsConfigController } from './config/controller/sms-config.controller';
import { SmsSdkService } from './services/sms-sdk.service';
import { SmsTemplateService } from './services/sms-template.service';
import { SmsCodeService } from './services/sms-code.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmsProviderSetting, SmsTemplate]),
    RouterModule.register([{ path: 'ext/sms', module: SmsModule }]),
  ],
  controllers: [SmsConfigController],
  providers: [SmsConfigService, SmsSdkService, SmsTemplateService, SmsCodeService],
  exports: [SmsConfigService, SmsSdkService, SmsTemplateService, SmsCodeService],
})
export class SmsModule {}
