/**
 * @fileoverview 通用资源类型定义
 * @description 定义图片、媒体、文件三种资源格式，供业务模块使用
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

/**
 * 图片资源 DTO
 * @description 用于存储图片类型资源，包含尺寸信息
 */
export class ImageResourceDto {
  @ApiProperty({ description: '图片 URL', example: 'http://localhost:3000/uploads/avatar/uuid.jpg' })
  @IsString()
  src: string;

  @ApiProperty({ description: '图片宽度（像素）', example: 800 })
  @IsNumber()
  width: number;

  @ApiProperty({ description: '图片高度（像素）', example: 600 })
  @IsNumber()
  height: number;
}

/**
 * 媒体资源 DTO
 * @description 用于存储视频、音频等媒体资源
 */
export class MediaResourceDto {
  @ApiProperty({ description: '媒体 URL', example: 'http://localhost:3000/uploads/video/uuid.mp4' })
  url: string;

  @ApiProperty({ description: '原始文件名', example: '宣传片.mp4' })
  name: string;

  @ApiProperty({ description: 'MIME 类型', example: 'video/mp4' })
  type: string;

  @ApiProperty({ description: '文件大小（字节）', example: 10240000, required: false })
  size?: number;

  @ApiProperty({ description: '时长（秒）', example: 120, required: false })
  duration?: number;
}

/**
 * 文件资源 DTO
 * @description 用于存储普通文件资源
 */
export class FileResourceDto {
  @ApiProperty({ description: '文件 URL', example: 'http://localhost:3000/uploads/doc/uuid.pdf' })
  url: string;

  @ApiProperty({ description: '原始文件名', example: '合同.pdf' })
  name: string;

  @ApiProperty({ description: 'MIME 类型', example: 'application/pdf' })
  type: string;

  @ApiProperty({ description: '文件大小（字节）', example: 102400, required: false })
  size?: number;
}

/**
 * 资源类型枚举
 */
export enum ResourceType {
  IMAGE = 'image',
  MEDIA = 'media',
  FILE = 'file',
}