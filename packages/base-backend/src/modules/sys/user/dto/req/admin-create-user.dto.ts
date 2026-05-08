import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { UserBaseDto } from './user-base.dto';

export class AdminCreateUserDto extends UserBaseDto {
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
}
