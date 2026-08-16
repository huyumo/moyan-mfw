/**
 * @fileoverview 发送短信验证码请求 DTO
 * @description 供业务方 Controller 复用（扩展包自身不暴露验证码 HTTP 接口）
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { SMS_DEFAULT_CODE_SCENE } from 'moyan-mfw-extension-sms/shared';

export class SendSmsCodeDto {
  @ApiProperty({
    description: '手机号（纯手机号，不含区号）',
    example: '13800138000',
  })
  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone: string;

  @ApiPropertyOptional({
    description: `短信场景名（默认 ${SMS_DEFAULT_CODE_SCENE}，需在配置页面或代码中注册模板）`,
    example: SMS_DEFAULT_CODE_SCENE,
    default: SMS_DEFAULT_CODE_SCENE,
  })
  @IsOptional()
  @IsString()
  scene?: string;
}
