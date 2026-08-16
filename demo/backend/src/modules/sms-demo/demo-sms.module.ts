/**
 * @fileoverview 短信扩展包调用用例演示模块
 * @description 业务层装配 extension-sms：
 *   - imports SmsModule（配置管理接口自动挂载 /api/ext/sms/config/*）
 *   - onModuleInit 程序化注册一个演示模板（优先级高于配置页面）
 *   - DemoSmsController 演示验证码发送/校验调用链（模拟登录场景，公开接口）
 */

import { Injectable, Module, OnModuleInit } from '@nestjs/common'
import { SmsModule, SmsTemplateService } from 'moyan-mfw-extension-sms/backend'
import { DemoSmsController } from './demo-sms.controller'

/** 程序化注册演示模板（也可在配置页面维护，页面管理推荐） */
@Injectable()
export class DemoSmsTemplateRegistrar implements OnModuleInit {
  constructor(private readonly smsTemplateService: SmsTemplateService) {}

  onModuleInit() {
    this.smsTemplateService.register('demo_notify', {
      signName: '墨焱演示',
      templateCode: 'SMS_000000000',
      paramKeys: ['content'],
    })
  }
}

@Module({
  imports: [SmsModule],
  controllers: [DemoSmsController],
  providers: [DemoSmsTemplateRegistrar],
})
export class DemoSmsModule {}
