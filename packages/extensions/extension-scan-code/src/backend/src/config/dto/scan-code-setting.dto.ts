/**
 * @fileoverview 扫码配置管理 DTO
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ArrayMaxSize,
} from 'class-validator';
import { SCAN_CODE_CHARSETS, type ScanCodeCharsetId, type ScanCodeSettingItem } from 'moyan-mfw-extension-scan-code/shared';

/**
 * 保存码生成策略配置请求 DTO
 */
export class SaveScanCodeSettingDto {
  @ApiProperty({ description: '分组数（2~5）', minimum: 2, maximum: 5, default: 3 })
  @IsInt()
  @Min(2, { message: '分组数最小为 2' })
  @Max(5, { message: '分组数最大为 5' })
  groupCount: number;

  @ApiProperty({ description: '每组字符数（3~5）', minimum: 3, maximum: 5, default: 4 })
  @IsInt()
  @Min(3, { message: '每组字符数最小为 3' })
  @Max(5, { message: '每组字符数最大为 5' })
  groupLength: number;

  @ApiProperty({ description: "分组分隔符（最长 2 字符，空串表示不分隔）", default: '-' })
  @IsString()
  @MaxLength(2, { message: '分隔符最长 2 字符' })
  separator: string;

  @ApiProperty({
    enum: Object.keys(SCAN_CODE_CHARSETS),
    description: '字符集预设',
    default: 'A-Z1-9',
  })
  @IsIn(Object.keys(SCAN_CODE_CHARSETS), { message: '不支持的字符集预设' })
  charset: string;

  @ApiPropertyOptional({
    type: [String],
    description: '场景白名单（不传或空数组 = 不限制；传值后 generate 仅允许白名单内场景）',
    example: ['points', 'gift', 'pickup'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50, { message: '场景白名单最多 50 项' })
  @IsString({ each: true })
  scenes?: string[];
}

/**
 * 码生成策略配置响应 DTO
 */
export class ScanCodeSettingResDto implements ScanCodeSettingItem {
  @ApiProperty({ description: '分组数' })
  groupCount: number;

  @ApiProperty({ description: '每组字符数' })
  groupLength: number;

  @ApiProperty({ description: '分组分隔符' })
  separator: string;

  @ApiProperty({ description: '字符集预设' })
  charset: ScanCodeCharsetId;

  @ApiProperty({ description: '场景白名单（null=不限制）', required: false, nullable: true })
  scenes: string[] | null;
}
