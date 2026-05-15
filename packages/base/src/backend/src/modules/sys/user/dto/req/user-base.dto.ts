import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ImageResourceDto } from '@/common';

/**
 * 用户公共字段基类
 * @description CreateUserDto / AdminCreateUserDto / UpdateUserDto 共享字段
 */
export class UserBaseDto {
  @ApiProperty({ description: '昵称', example: '张三', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 64, { message: '昵称长度应在 1-64 字符之间' })
  nickname?: string;

  @ApiProperty({ description: '头像', required: false, type: ImageResourceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageResourceDto)
  avatar?: ImageResourceDto;

  @ApiProperty({ description: '性别 (0:未知 1:男 2:女)', default: 0, required: false })
  @IsOptional()
  gender?: number;
}
