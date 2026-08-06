/**
 * @fileoverview 文档管理响应 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, DocumentStatus, ExtValueType, DocumentImage } from 'moyan-mfw-extension-document/shared';

/** 扩展字段响应 */
export class DocumentExtResponseDto {
  @ApiProperty({ description: '扩展 ID' })
  id: number;

  @ApiProperty({ description: '文档 ID' })
  documentId: number;

  @ApiProperty({ description: '扩展属性键' })
  extKey: string;

  @ApiProperty({ description: '扩展属性值' })
  extValue: { data: any };

  @ApiProperty({ description: '值类型', enum: ExtValueType })
  valueType: string;

  @ApiPropertyOptional({ description: '描述', nullable: true })
  description: string | null;
}

/** 文档响应 */
export class DocumentResponseDto {
  @ApiProperty({ description: '文档 ID' })
  id: number;

  @ApiPropertyOptional({ description: '应用 ID', nullable: true })
  appId: number | null;

  @ApiProperty({ description: '文档类型标识' })
  docKey: string;

  @ApiProperty({ description: '唯一业务键' })
  onlyKey: string;

  @ApiPropertyOptional({ description: '文档分组', nullable: true })
  docGroup: string | null;

  @ApiProperty({ description: '标题' })
  title: string;

  @ApiPropertyOptional({ description: '正文内容', nullable: true })
  content: string | null;

  @ApiPropertyOptional({ description: '摘要', nullable: true })
  summary: string | null;

  @ApiProperty({ description: '类型', enum: DocumentType })
  type: string;

  @ApiPropertyOptional({ description: '图片资源列表（{src,width,height}）' })
  images: DocumentImage[];

  @ApiPropertyOptional({ description: '视频 URL', nullable: true })
  video: string | null;

  @ApiPropertyOptional({ description: '标签', nullable: true })
  tags: string | null;

  @ApiProperty({ description: '状态', enum: DocumentStatus })
  status: number;

  @ApiProperty({ description: '虚拟浏览量' })
  virtualPageviews: number;

  @ApiProperty({ description: '真实浏览量' })
  pageviews: number;

  @ApiProperty({ description: '总浏览量' })
  viewPageviews: number;

  @ApiPropertyOptional({ description: '公告开始时间', nullable: true })
  announcementStartTime: string | null;

  @ApiPropertyOptional({ description: '公告结束时间', nullable: true })
  announcementEndTime: string | null;

  @ApiPropertyOptional({ description: '排序号', nullable: true })
  sortOrder: number | null;

  @ApiPropertyOptional({ description: '扩展字段列表', type: [DocumentExtResponseDto] })
  extFields?: DocumentExtResponseDto[];

  @ApiPropertyOptional({ description: '创建时间' })
  createdAt: Date;

  @ApiPropertyOptional({ description: '更新时间', nullable: true })
  updateAt: Date | null;
}
