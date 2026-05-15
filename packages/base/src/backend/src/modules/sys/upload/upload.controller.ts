/**
 * @fileoverview 上传文件控制器
 * @description 处理文件上传 HTTP 请求
 */

import {
  Controller,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadFileService, UploadResult } from './upload.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { SkipPermission } from '../../../common/decorators/skip-permission.decorator';
import { ApiResponseUtil } from '../../../common/types/api.types';

@ApiTags('upload', '文件上传相关接口')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
@SkipPermission()
@Controller('upload-files')
export class UploadFileController {
  constructor(private uploadFileService: UploadFileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '上传单个文件', description: '上传单个文件，返回可访问的 URL' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '上传成功' })
  @AuditLog({ module: 'UPLOAD', event: 'UPLOAD_FILE', description: '上传文件' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('businessType') businessType?: string,
  ) {
    const result = await this.uploadFileService.upload(file, businessType);
    return ApiResponseUtil.success(result, '上传成功');
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量上传文件', description: '批量上传多个文件（最多10个）' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '上传成功' })
  @AuditLog({ module: 'UPLOAD', event: 'BATCH_UPLOAD_FILE', description: '批量上传文件' })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('businessType') businessType?: string,
  ) {
    const results = await this.uploadFileService.uploadBatch(files, businessType);
    return ApiResponseUtil.success(results, '批量上传成功');
  }
}