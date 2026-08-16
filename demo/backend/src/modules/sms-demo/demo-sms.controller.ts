/**
 * @fileoverview 短信验证码演示控制器
 * @description 模拟登录页验证码场景：发送 → 校验，均公开（登录前无 token）
 *
 * DEV_MODE=true 时 sendCode 返回 code 便于本地联调（见 demo/backend/.env）
 */

import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { Public, BusinessException } from 'moyan-mfw-base/backend'
import {
  SmsCodeService,
  SendSmsCodeDto,
  SMS_DEFAULT_CODE_SCENE,
} from 'moyan-mfw-extension-sms/backend'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/** 校验验证码请求 DTO */
class VerifySmsCodeDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string

  @ApiProperty({ description: '用户输入的验证码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  code: string

  @ApiPropertyOptional({ description: '短信场景名', default: SMS_DEFAULT_CODE_SCENE })
  @IsOptional()
  @IsString()
  scene?: string
}

@ApiTags('demo-sms', '短信扩展演示接口')
@Controller('demo/sms')
export class DemoSmsController {
  constructor(private readonly smsCodeService: SmsCodeService) {}

  @Post('send-code')
  @Public()
  @ApiOperation({ summary: '发送验证码（模拟登录场景）', description: '60s/次限流；DEV_MODE=true 时返回验证码' })
  async sendCode(@Body() dto: SendSmsCodeDto) {
    const result = await this.smsCodeService.sendCode(dto.phone, dto.scene)
    return { success: result.success, code: result.code }
  }

  @Post('verify-code')
  @Public()
  @ApiOperation({ summary: '校验验证码', description: '校验通过即作废；5 次失败锁定 5 分钟' })
  async verifyCode(@Body() dto: VerifySmsCodeDto) {
    const ok = await this.smsCodeService.verifyCode(dto.phone, dto.code, dto.scene)
    if (!ok) {
      throw new BusinessException('验证码错误', 400)
    }
    return { verified: true }
  }
}
