/**
 * @fileoverview 短信配置管理 DTO
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsArray,
  MaxLength,
  Matches,
  ArrayMaxSize,
} from 'class-validator';
import { SMS_PROVIDERS, type SmsProviderSettingItem, type SmsTemplateItem } from 'moyan-mfw-extension-sms/shared';

/**
 * 保存运营商凭证配置请求 DTO
 */
export class SaveSmsProviderSettingDto {
  @ApiProperty({ enum: SMS_PROVIDERS, description: '短信运营商' })
  @IsIn(SMS_PROVIDERS as unknown as string[], { message: '不支持的短信运营商' })
  provider: string;

  @ApiProperty({ description: 'AccessKey ID', example: 'LTAI...' })
  @IsString()
  @IsNotEmpty({ message: 'AccessKey ID 不能为空' })
  @MaxLength(128)
  accessKeyId: string;

  @ApiPropertyOptional({
    description: 'AccessKey Secret（留空表示保持不变；首次配置时必填）',
    example: 'xxxxxxxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  accessKeySecret?: string;

  @ApiPropertyOptional({ description: '默认短信签名（可被模板级签名覆盖）', example: '某某酒业' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  defaultSignName?: string;
}

/**
 * 保存短信模板请求 DTO（upsert：按 id 或 scene 判断新增/更新）
 */
export class SaveSmsTemplateDto {
  @ApiPropertyOptional({ description: '模板 ID（更新时传；不传按 scene 判断）' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: '业务场景名（小写字母开头，仅含小写字母/数字/下划线）', example: 'login_code' })
  @IsString()
  @IsNotEmpty({ message: '场景名不能为空' })
  @Matches(/^[a-z][a-z0-9_]*$/, { message: '场景名需以小写字母开头，仅含小写字母/数字/下划线' })
  @MaxLength(64)
  scene: string;

  @ApiProperty({ description: '短信签名', example: '某某酒业' })
  @IsString()
  @IsNotEmpty({ message: '短信签名不能为空' })
  @MaxLength(64)
  signName: string;

  @ApiProperty({ description: '模板 Code', example: 'SMS_509465234' })
  @IsString()
  @IsNotEmpty({ message: '模板 Code 不能为空' })
  @MaxLength(64)
  templateCode: string;

  @ApiProperty({ type: [String], description: '模板参数 key 列表（如 ["code"]）' })
  @IsArray()
  @ArrayMaxSize(10, { message: '模板参数 key 最多 10 个' })
  @IsString({ each: true })
  paramKeys: string[];

  @ApiPropertyOptional({ description: '模板描述' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

/**
 * 运营商配置响应 DTO（secret 已脱敏）
 */
export class SmsProviderSettingResDto implements SmsProviderSettingItem {
  @ApiProperty({ description: "配置来源：db=页面配置生效 / env=降级读环境变量", enum: ['db', 'env'] })
  source: 'db' | 'env';

  @ApiProperty({ description: '运营商' })
  provider: string;

  @ApiProperty({ description: 'AccessKey ID' })
  accessKeyId: string;

  @ApiProperty({ description: '脱敏后的 Secret（仅尾 4 位）' })
  accessKeySecretMasked: string;

  @ApiProperty({ description: '默认签名', required: false, nullable: true })
  defaultSignName: string | null;
}

/**
 * 短信模板响应 DTO
 */
export class SmsTemplateResDto implements SmsTemplateItem {
  @ApiProperty({ description: '模板 ID' })
  id: string;

  @ApiProperty({ description: '业务场景名' })
  scene: string;

  @ApiProperty({ description: '短信签名' })
  signName: string;

  @ApiProperty({ description: '模板 Code' })
  templateCode: string;

  @ApiProperty({ type: [String], description: '模板参数 key 列表' })
  paramKeys: string[];

  @ApiProperty({ description: '模板描述', required: false, nullable: true })
  description: string | null;
}
