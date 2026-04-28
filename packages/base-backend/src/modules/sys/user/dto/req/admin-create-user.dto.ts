import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, Length, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ImageResourceDto } from '@/common';

export class AdminCreateUserDto {
  @ApiProperty({ description: '用户名', example: 'zhangsan' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @Length(2, 20, { message: '用户名长度应在 2-20 字符之间' })
  @Matches(/^[a-zA-Z][a-zA-Z0-9]{0,19}$/, {
    message: '用户名须以字母开头，仅允许字母和数字',
  })
  username: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsNotEmpty({ message: '手机号不能为空' })
  @IsString()
  @Length(0, 20, { message: '手机号长度应在 20 字符以内' })
  phone: string;

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

  @ApiProperty({ description: '角色 ID 列表', required: false, type: [String] })
  @IsOptional()
  @IsString({ each: true })
  roleIds?: string[];
}
