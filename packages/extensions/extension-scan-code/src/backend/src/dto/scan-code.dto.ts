/**
 * @fileoverview scan-code DTO
 * @description 供业务方 Controller 复用（扩展包自身不暴露生成/解析/核销 HTTP 接口）
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,
  MaxLength,
  IsIn,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 生成二维码内容请求DTO
 */
export class GenerateScanCodeDto {
  @ApiProperty({
    description: '二维码类型：1=可多次使用, 2=只允许使用一次',
    enum: [1, 2],
  })
  @IsInt()
  @IsIn([1, 2])
  @Type(() => Number)
  type: number;

  @ApiProperty({
    description: '业务场景标识（如 points/gift/lottery/pickup）',
  })
  @IsString()
  @MaxLength(32)
  scene: string;

  @ApiPropertyOptional({
    description: '过期时间戳（毫秒），不传为长期有效',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  expiredAt?: number;

  @ApiProperty({ description: '业务数据' })
  @IsObject()
  data: Record<string, any>;

  @ApiPropertyOptional({
    type: [String],
    description: '需要建索引查询的字段名列表（写入扩展表，如 ["userId"]）',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  indexFields?: string[];
}

/**
 * 解析二维码内容请求DTO
 */
export class ParseScanCodeDto {
  @ApiProperty({ description: '二维码内容' })
  @IsString()
  code: string;
}

/**
 * 使用二维码请求DTO
 */
export class UseScanCodeDto {
  @ApiProperty({ description: '二维码内容' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: '门店ID' })
  @IsOptional()
  @IsString()
  storeId?: string;
}

/**
 * 生成二维码内容响应DTO
 */
export class GenerateScanCodeResDto {
  @ApiProperty({ description: '二维码内容（= 记录ID）' })
  code: string;
}

/**
 * 解析二维码内容响应DTO
 */
export class ParseScanCodeResDto {
  @ApiProperty({ description: '二维码内容（= 记录ID）' })
  code: string;

  @ApiProperty({
    description: '二维码类型：1=可多次使用, 2=只允许使用一次',
  })
  type: number;

  @ApiProperty({ description: '业务场景' })
  scene: string;

  @ApiProperty({ description: '业务数据' })
  data: Record<string, any>;

  @ApiProperty({ description: '状态：1=有效, 2=已使用, 3=已过期' })
  status: number;

  @ApiPropertyOptional({ description: '过期时间' })
  expiredAt?: Date | null;

  @ApiPropertyOptional({ description: '最后使用时间' })
  lastUsedAt?: Date | null;

  @ApiPropertyOptional({ description: '使用次数' })
  usedCount?: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}
