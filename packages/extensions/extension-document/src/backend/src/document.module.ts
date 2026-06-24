/**
 * @fileoverview 文档管理模块
 * @description 注册路由前缀、实体和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { Document } from './entities/document.entity';
import { DocumentExt } from './entities/document-ext.entity';
import { DocumentController } from './controller/document.controller';
import { DocumentPubController } from './controller/document-pub.controller';
import { DocumentService } from './service/document.service';
import { DocumentExtService } from './service/document-ext.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentExt]),
    RouterModule.register([{ path: 'ext/document', module: DocumentModule }]),
  ],
  controllers: [DocumentController, DocumentPubController],
  providers: [DocumentService, DocumentExtService],
  exports: [DocumentService, DocumentExtService],
})
export class DocumentModule {}
