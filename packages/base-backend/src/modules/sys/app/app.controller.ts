/**
 * @fileoverview 应用控制器
 * @description 处理应用实例相关 HTTP 请求
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { CreateAppDto, UpdateAppDto, QueryAppDto, AppDetailResponseDto } from './dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuditLog, AuditModule } from '../../../common/decorators/audit-log.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { ApiResponseUtil } from '../../../common/types/api.types';
import { ApiPaginatedResponse } from '../../../common';

/**
 * 应用控制器
 * @description 处理应用实例相关的 CRUD 请求
 */
@ApiTags('app', '应用实例相关接口')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
@Controller('apps')
export class AppController {
  constructor(private appService: AppService) {}

  /**
   * 创建应用实例
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建应用实例', description: '创建新的应用实例' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: AppDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '应用编码已存在' })
  @AuditLog({ module: AuditModule.APP, event: 'CREATE_APP', description: '创建应用实例' })
  @RequirePermission({ permCode: 'system:app', permissionValue: 1n }) // ADD
  async create(@Body() createAppDto: CreateAppDto) {
    const result = await this.appService.create(createAppDto);
    return ApiResponseUtil.success(result, '创建成功');
  }

  /**
   * 查询应用实例列表
   */
  @Get()
  @ApiOperation({ summary: '查询应用实例列表', description: '分页查询应用实例列表' })
  @ApiPaginatedResponse(AppDetailResponseDto)
  @RequirePermission({ permCode: 'system:app', permissionValue: 32n }) // VIEW
  async findAll(@Query() query: QueryAppDto) {
    const result = await this.appService.findAll(query);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 根据 ID 查询应用实例
   */
  @Get(':id')
  @ApiOperation({ summary: '根据 ID 查询应用实例', description: '查询指定应用实例的详细信息' })
  @ApiParam({ name: 'id', description: '应用实例 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: AppDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: '应用实例不存在' })
  @RequirePermission({ permCode: 'system:app', permissionValue: 32n }) // VIEW
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.appService.findById(id);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 更新应用实例
   */
  @Put(':id')
  @ApiOperation({ summary: '更新应用实例', description: '更新指定应用实例的信息' })
  @ApiParam({ name: 'id', description: '应用实例 ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: AppDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: '应用实例不存在' })
  @ApiResponse({ status: 409, description: '应用编码已存在' })
  @AuditLog({ module: AuditModule.APP, event: 'UPDATE_APP', description: '更新应用实例' })
  @RequirePermission({ permCode: 'system:app', permissionValue: 2n }) // EDIT
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppDto: UpdateAppDto,
  ) {
    const result = await this.appService.update(id, updateAppDto);
    return ApiResponseUtil.success(result, '更新成功');
  }

  /**
   * 删除应用实例
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除应用实例', description: '删除指定的应用实例（软删除）' })
  @ApiParam({ name: 'id', description: '应用实例 ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '应用实例不存在' })
  @AuditLog({ module: AuditModule.APP, event: 'DELETE_APP', description: '删除应用实例' })
  @RequirePermission({ permCode: 'system:app', permissionValue: 4n }) // DELETE
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.appService.delete(id);
    return ApiResponseUtil.success(null, '删除成功');
  }

  /**
   * 变更负责人
   */
  @Put(':id/owner')
  @ApiOperation({ summary: '变更负责人', description: '变更应用实例的负责人' })
  @ApiParam({ name: 'id', description: '应用实例 ID' })
  @ApiQuery({ name: 'ownerId', description: '新负责人 ID' })
  @ApiResponse({
    status: 200,
    description: '变更成功',
    type: AppDetailResponseDto,
  })
  @AuditLog({ module: AuditModule.APP, event: 'CHANGE_OWNER', description: '变更负责人' })
  @RequirePermission({ permCode: 'system:app', permissionValue: 2n }) // EDIT
  async changeOwner(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('ownerId') ownerId: string,
  ) {
    const result = await this.appService.changeOwner(id, ownerId);
    return ApiResponseUtil.success(result, '变更成功');
  }

  /**
   * 更新应用实例状态
   */
  @Put(':id/status')
  @ApiOperation({ summary: '更新应用实例状态', description: '启用或禁用指定应用实例' })
  @ApiParam({ name: 'id', description: '应用实例 ID' })
  @ApiQuery({ name: 'status', description: '状态 (1:启用 0:禁用)', enum: [0, 1] })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: AppDetailResponseDto,
  })
  @AuditLog({ module: AuditModule.APP, event: 'UPDATE_APP_STATUS', description: '更新应用实例状态' })
  @RequirePermission({ permCode: 'system:app', permissionValue: 2n }) // EDIT
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: number,
  ) {
    const result = await this.appService.updateStatus(id, status);
    return ApiResponseUtil.success(result, '更新成功');
  }
}
