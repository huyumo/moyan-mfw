/**
 * @fileoverview 上传文件模块
 * @description 提供文件上传功能，不涉及数据库存储
 */

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadFileService } from './upload.service';
import { UploadFileController } from './upload.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  ],
  providers: [UploadFileService],
  controllers: [UploadFileController],
  exports: [UploadFileService],
})
export class UploadFileModule {}