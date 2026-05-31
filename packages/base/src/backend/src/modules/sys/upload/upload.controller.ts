/**
 * @fileoverview 上传文件控制器
 * @description 处理文件上传 HTTP 请求
 */

import {
  Controller,
  Get,
  Post,
  Query,
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
import { OssService } from './oss.service';
import { OssAuthorizationDto } from './dto/res/oss-authorization.dto';
import { AuditLog } from '../../../common/decorators/audit-log.decorator';
import { SkipPermission } from '../../../common/decorators/skip-permission.decorator';
import { ApiResponseUtil } from '../../../common/types/api.types';

@ApiTags('upload', '文件上传相关接口')
@ApiBearerAuth('Authorization')
@SkipPermission()
@Controller('upload-files')
export class UploadFileController {
  constructor(
    private uploadFileService: UploadFileService,
    private ossService: OssService,
  ) {}

  @Get('oss-authorization')
  @ApiOperation({ summary: '获取 OSS 上传授权', description: '获取阿里云 OSS STS 临时凭证，用于前端直传' })
  @ApiResponse({ status: 200, description: '获取成功', type: OssAuthorizationDto })
  async getOssAuthorization() {
    const result = await this.ossService.getAuthorization();
    return ApiResponseUtil.success(result, '获取 OSS 授权成功');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '上传单个文件', description: '上传单个文件，返回可访问的 URL' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '上传成功' })
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