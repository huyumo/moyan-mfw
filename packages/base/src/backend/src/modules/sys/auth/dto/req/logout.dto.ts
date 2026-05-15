import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({ description: '授权 Token' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
