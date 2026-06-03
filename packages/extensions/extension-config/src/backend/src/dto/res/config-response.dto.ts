/**
 * @fileoverview 配置管理响应 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConfigType } from '@internal/config-shared';

export class ConfigResponseDto {
  @ApiProperty({ description: '配置 ID' })
  id: number;

  @ApiPropertyOptional({ description: '应用 ID', nullable: true })
  appId: number | null;

  @ApiProperty({ description: '配置分组标识' })
  groupKey: string;

  @ApiProperty({ description: '配置项标识' })
  configKey: string;

  @ApiProperty({ description: '配置值' })
  configValue: { data: any };

  @ApiProperty({ description: '配置类型', enum: ConfigType })
  configType: ConfigType;

  @ApiPropertyOptional({ description: '配置描述', nullable: true })
  description: string | null;
}
