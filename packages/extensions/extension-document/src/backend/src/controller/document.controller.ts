/**
 * @fileoverview 文档管理控制器
 * @description 处理文档管理的 HTTP 请求（认证接口）
 */

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RequirePermission } from 'moyan-mfw-base/backend';
import { ApiResponseUtil } from '../api-response';
import { DocumentService } from '../service/document.service';
import { DocumentExtService } from '../service/document-ext.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentListQueryDto,
  CounterUpdateDto,
  BatchUpdateExtDto,
  DocumentResponseDto,
  DocumentExtResponseDto,
} from '../dto';

@ApiTags('ext-document', '文档管理相关接口')
@Controller('')
export class DocumentController {
  constructor(
    private readonly service: DocumentService,
    private readonly extService: DocumentExtService,
  ) {}

  @Get('list')
  @RequirePermission({ permCode: '*:ext:document:*' })
  @ApiOperation({ summary: '分页查询文档列表' })
  @ApiResponse({ status: 200, description: '查询成功', type: [DocumentResponseDto] })
  async getList(@Query() query: DocumentListQueryDto) {
    const result = await this.service.getList(query);
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Get('listByKey')
  @RequirePermission({ permCode: '*:ext:document:*' })
  @ApiOperation({ summary: '按 docKey 分页查询文档' })
  @ApiResponse({ status: 200, description: '查询成功', type: [DocumentResponseDto] })
  async getListByKey(@Query() query: DocumentListQueryDto) {
    const result = await this.service.getList(query);
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Get('docGroupDict')
  @RequirePermission({ permCode: '*:ext:document:*' })
  @ApiOperation({ summary: '获取文档分组字典' })
  @ApiQuery({ name: 'docKey', description: '文档类型标识', required: false })
  @ApiQuery({ name: 'appId', description: '应用 ID', required: false })
  async getDocGroupDict(
    @Query('docKey') docKey?: string,
    @Query('appId') appId?: string,
  ) {
    const appIdNum = appId !== undefined && appId !== 'null' ? Number(appId) : undefined;
    const result = await this.service.getDocGroupDict(docKey, appIdNum);
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Get('byOnlyKey/:onlyKey')
  @RequirePermission({ permCode: '*:ext:document:*' })
  @ApiOperation({ summary: '按 onlyKey 查询文档' })
  @ApiParam({ name: 'onlyKey', description: '唯一业务键' })
  @ApiResponse({ status: 200, description: '查询成功', type: DocumentResponseDto })
  async getByOnlyKey(@Param('onlyKey') onlyKey: string) {
    const result = await this.service.getOneByOnlyKey(onlyKey, true);
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Get(':id/ext')
  @RequirePermission({ permCode: '*:ext:document:*' })
  @ApiOperation({ summary: '获取文档扩展字段' })
  @ApiParam({ name: 'id', description: '文档 ID' })
  @ApiResponse({ status: 200, description: '查询成功', type: [DocumentExtResponseDto] })
  async getExtFields(@Param('id') id: string) {
    const result = await this.extService.listByDocument(Number(id));
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Get(':id')
  @RequirePermission({ permCode: '*:ext:document:*' })
  @ApiOperation({ summary: '按 ID 查询文档' })
  @ApiParam({ name: 'id', description: '文档 ID' })
  @ApiResponse({ status: 200, description: '查询成功', type: DocumentResponseDto })
  async getOne(@Param('id') id: string) {
    const result = await this.service.getOneById(Number(id), true);
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Post('')
  @RequirePermission({ permCode: '*:ext:document:*', permissionValue: ['添加'] })
  @ApiOperation({ summary: '创建文档' })
  @ApiResponse({ status: 201, description: '创建成功', type: DocumentResponseDto })
  async create(@Body() dto: CreateDocumentDto) {
    const result = await this.service.create(dto);
    return ApiResponseUtil.success(result, '创建成功');
  }

  @Put('totals')
  @RequirePermission({ permCode: '*:ext:document:*', permissionValue: ['编辑'] })
  @ApiOperation({ summary: '计数器自增' })
  async updateTotals(@Body() dto: CounterUpdateDto) {
    await this.service.updateTotals(dto);
    return ApiResponseUtil.success(null, '更新成功');
  }

  @Put(':id/ext')
  @RequirePermission({ permCode: '*:ext:document:*', permissionValue: ['编辑'] })
  @ApiOperation({ summary: '批量更新文档扩展字段' })
  @ApiParam({ name: 'id', description: '文档 ID' })
  async batchUpdateExt(@Param('id') id: string, @Body() dto: BatchUpdateExtDto) {
    await this.service.batchUpdateExt(Number(id), dto.items);
    return ApiResponseUtil.success(null, '更新成功');
  }

  @Put(':id')
  @RequirePermission({ permCode: '*:ext:document:*', permissionValue: ['编辑'] })
  @ApiOperation({ summary: '更新文档' })
  @ApiParam({ name: 'id', description: '文档 ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: DocumentResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    const result = await this.service.update(Number(id), dto);
    return ApiResponseUtil.success(result, '更新成功');
  }

  @Delete(':id')
  @RequirePermission({ permCode: '*:ext:document:*', permissionValue: ['删除'] })
  @ApiOperation({ summary: '删除文档' })
  @ApiParam({ name: 'id', description: '文档 ID' })
  async delete(@Param('id') id: string) {
    await this.service.delete(Number(id));
    return ApiResponseUtil.success(null, '删除成功');
  }
}
