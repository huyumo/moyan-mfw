/**
 * @fileoverview 重置密码请求 DTO
 * @description 重置用户密码的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/**
 * 重置密码请求 DTO
 */
export class ResetPasswordDto {
  @ApiProperty({ description: '新密码', example: 'Test@123' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @Length(6, 32, { message: '密码长度应在 6-32 字符之间' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, {
    message: '密码必须包含至少一个字母和一个数字',
  })
  password: string;
}
