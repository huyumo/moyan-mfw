/**
 * @fileoverview 文档管理 DTO 定义
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional, IsString, IsNumber, IsEnum, IsObject,
  IsArray, ValidateNested, IsNotEmpty, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from 'moyan-mfw-base/backend';
import { DocumentType, DocumentStatus, ExtValueType } from 'moyan-mfw-extension-document/shared';

/** 扩展字段项 */
export class ExtFieldItemDto {
  @ApiProperty({ description: '扩展属性键' })
  @IsNotEmpty({ message: '扩展属性键不能为空' })
  @IsString()
  extKey: string;

  @ApiProperty({ description: '扩展属性值' })
  @IsObject()
  extValue: { data: any };

  @ApiPropertyOptional({ description: '值类型', enum: ExtValueType })
  @IsOptional()
  @IsEnum(ExtValueType)
  valueType?: ExtValueType;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

/** 创建文档 */
export class CreateDocumentDto {
  @ApiPropertyOptional({ description: '应用 ID' })
  @IsOptional()
  @IsNumber()
  appId?: number;

  @ApiProperty({ description: '文档类型标识' })
  @IsNotEmpty({ message: '文档类型标识不能为空' })
  @IsString()
  docKey: string;

  @ApiPropertyOptional({ description: '唯一业务键（不传自动生成）' })
  @IsOptional()
  @IsString()
  onlyKey?: string;

  @ApiPropertyOptional({ description: '文档分组' })
  @IsOptional()
  @IsString()
  docGroup?: string;

  @ApiProperty({ description: '标题' })
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '正文内容' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '摘要' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: '类型', enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({ description: '图片 URL 列表', type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ description: '视频 URL' })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiPropertyOptional({ description: '标签' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: '状态', enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: '虚拟浏览量' })
  @IsOptional()
  @IsNumber()
  virtualPageviews?: number;

  @ApiPropertyOptional({ description: '公告开始时间' })
  @IsOptional()
  @IsString()
  announcementStartTime?: string;

  @ApiPropertyOptional({ description: '公告结束时间' })
  @IsOptional()
  @IsString()
  announcementEndTime?: string;

  @ApiPropertyOptional({ description: '排序号' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '扩展字段列表', type: [ExtFieldItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtFieldItemDto)
  extFields?: ExtFieldItemDto[];
}

/** 更新文档 */
export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: '文档分组' })
  @IsOptional()
  @IsString()
  docGroup?: string;

  @ApiPropertyOptional({ description: '标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '正文内容' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '摘要' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: '类型', enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({ description: '图片 URL 列表', type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ description: '视频 URL' })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiPropertyOptional({ description: '标签' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: '状态', enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: '虚拟浏览量' })
  @IsOptional()
  @IsNumber()
  virtualPageviews?: number;

  @ApiPropertyOptional({ description: '公告开始时间' })
  @IsOptional()
  @IsString()
  announcementStartTime?: string;

  @ApiPropertyOptional({ description: '公告结束时间' })
  @IsOptional()
  @IsString()
  announcementEndTime?: string;

  @ApiPropertyOptional({ description: '排序号' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '扩展字段列表', type: [ExtFieldItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtFieldItemDto)
  extFields?: ExtFieldItemDto[];
}

/** 文档分页查询 */
export class DocumentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '文档类型标识' })
  @IsOptional()
  @IsString()
  docKey?: string;

  @ApiPropertyOptional({ description: '关键词（标题/摘要）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '文档分组' })
  @IsOptional()
  @IsString()
  docGroup?: string;

  @ApiPropertyOptional({ description: '状态', enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '应用 ID' })
  @IsOptional()
  @IsNumber()
  appId?: number;
}

/** 批量更新扩展字段 */
export class BatchUpdateExtDto {
  @ApiProperty({ description: '扩展字段列表', type: [ExtFieldItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtFieldItemDto)
  items: ExtFieldItemDto[];
}

/** 计数器自增 */
export class CounterUpdateDto {
  @ApiProperty({ description: '文档 ID' })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: '计数字段',
    enum: ['pageviews', 'virtualPageviews', 'counter1', 'counter2', 'counter3'],
  })
  @IsIn(['pageviews', 'virtualPageviews', 'counter1', 'counter2', 'counter3'])
  field: 'pageviews' | 'virtualPageviews' | 'counter1' | 'counter2' | 'counter3';
}
