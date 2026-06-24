/**
 * @fileoverview 文档公开接口控制器
 * @description 无需认证即可访问的公开文档接口（仅返回已发布文档）
 */

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from 'moyan-mfw-base/backend';
import { ApiResponseUtil } from '../api-response';
import { DocumentService } from '../service/document.service';
import { DocumentListQueryDto, DocumentResponseDto } from '../dto';
import { DocumentStatus } from 'moyan-mfw-extension-document/shared';

@ApiTags('ext-document-pub', '文档公开接口')
@Controller('pub')
export class DocumentPubController {
  constructor(private readonly service: DocumentService) {}

  @Get('listByKey')
  @Public()
  @ApiOperation({ summary: '公开按 docKey 列已发布文档' })
  @ApiResponse({ status: 200, description: '查询成功', type: [DocumentResponseDto] })
  async getPublicListByKey(@Query() query: DocumentListQueryDto) {
    query.status = DocumentStatus.PUBLISHED;
    const result = await this.service.getList(query);
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Get(':onlyKey')
  @Public()
  @ApiOperation({ summary: '公开按 onlyKey 查询已发布文档' })
  @ApiParam({ name: 'onlyKey', description: '唯一业务键' })
  @ApiResponse({ status: 200, description: '查询成功', type: DocumentResponseDto })
  async getPublicByOnlyKey(@Param('onlyKey') onlyKey: string) {
    const doc = await this.service.getOneByOnlyKey(onlyKey, true);
    if (doc.status !== DocumentStatus.PUBLISHED) {
      return ApiResponseUtil.success(null, '文档不存在');
    }
    const extFields = await this.service.getExtFields(doc.id);
    return ApiResponseUtil.success({ ...doc, extFields }, '查询成功');
  }
}
