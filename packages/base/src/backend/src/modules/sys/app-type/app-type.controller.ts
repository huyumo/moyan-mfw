/**
 * @fileoverview 应用类型控制器
 * @description 处理应用类型相关 HTTP 请求
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
  ApiExtraModels,
} from '@nestjs/swagger';
import { AppTypeService } from './app-type.service';
import { CreateAppTypeDto, UpdateAppTypeDto, QueryAppTypeDto, AppTypeResponseDto } from './dto';
import { UpdatePermissionPoolDto } from './dto/req/update-permission-pool.dto';
import {
  PermissionPoolResponseDto,
  UpdatePermissionPoolResponseDto,
} from './dto/res/permission-pool-response.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuditLog, AuditModule } from '../../../common/decorators/audit-log.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { ApiResponseUtil } from '../../../common/types/api.types';
import { ApiPaginatedResponse } from '../../../common';
import { PermissionTreeNodeDto } from '../permission';
import { StatusDto } from '@/common/types/status.dto';
import { SaveCustomMenuDto } from './dto/req/save-custom-menu.dto';

/**
 * 应用类型控制器
 * @description 处理应用类型相关的 CRUD 请求
 */
@ApiTags('app-type', '应用类型相关接口')
@ApiBearerAuth('Authorization')
@ApiExtraModels(PermissionTreeNodeDto)
@UseGuards(AuthGuard)
@Controller('app-types')
export class AppTypeController {
  constructor(private appTypeService: AppTypeService) {}

  /**
   * 创建应用类型
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建应用类型', description: '创建新的应用类型' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: AppTypeResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '类型编码已存在' })
  @AuditLog({ module: AuditModule.APP_TYPE, event: 'CREATE_APP_TYPE', description: '创建应用类型' })
  @RequirePermission({ permCode: 'pc_root:sys:app-type', permissionValue: ['添加'] })
  async create(@Body() createAppTypeDto: CreateAppTypeDto) {
    const result = await this.appTypeService.create(createAppTypeDto);
    return ApiResponseUtil.success(result, '创建成功');
  }

  /**
   * 查询应用类型列表
   */
  @Get()
  @ApiOperation({ summary: '查询应用类型列表', description: '分页查询应用类型列表' })
  @ApiPaginatedResponse(AppTypeResponseDto)
  @RequirePermission({ permCode: 'pc_root:sys:app-type' })
  async findAll(@Query() query: QueryAppTypeDto) {
    const result = await this.appTypeService.findAll(query);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 查询所有应用类型
   */
  @Get('all')
  @ApiOperation({ summary: '查询所有应用类型', description: '获取所有应用类型列表' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: [AppTypeResponseDto],
  })
  @RequirePermission({ permCode: 'pc_root:sys:app-type' })
  async findAllList() {
    const result = await this.appTypeService.findAllList();
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 根据 ID 查询应用类型
   */
  @Get(':id')
  @ApiOperation({ summary: '根据 ID 查询应用类型', description: '查询指定应用类型的详细信息' })
  @ApiParam({ name: 'id', description: '应用类型 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: AppTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: '应用类型不存在' })
  @RequirePermission({ permCode: 'pc_root:sys:app-type' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.appTypeService.findById(id);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 获取权限池配置
   */
  @Get(':appTypeId/permission-pool')
  @ApiOperation({ summary: '获取权限池配置', description: '获取应用类型的权限池配置，包含权限树和勾选状态' })
  @ApiParam({ name: 'appTypeId', description: '应用类型 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: PermissionPoolResponseDto,
  })
  @ApiResponse({ status: 404, description: '应用类型不存在' })
  @RequirePermission({ permCode: 'pc_root:sys:app-type' })
  async getPermissionPool(@Param('appTypeId', ParseUUIDPipe) appTypeId: string) {
    const result = await this.appTypeService.getPermissionPool(appTypeId);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 更新权限池配置
   */
  @Put(':appTypeId/permission-pool')
  @ApiOperation({ summary: '更新权限池配置', description: '更新应用类型的权限池配置，批量更新权限节点' })
  @ApiParam({ name: 'appTypeId', description: '应用类型 ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UpdatePermissionPoolResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '应用类型不存在' })
  @AuditLog({ module: AuditModule.APP_TYPE, event: 'UPDATE_PERMISSION_POOL', description: '更新权限池配置' })
  @RequirePermission({ permCode: 'pc_root:sys:app-type', permissionValue: ['编辑'] })
  async updatePermissionPool(
    @Param('appTypeId', ParseUUIDPipe) appTypeId: string,
    @Body() updateDto: UpdatePermissionPoolDto,
  ) {
    const result = await this.appTypeService.updatePermissionPool(appTypeId, updateDto);
    return ApiResponseUtil.success(result, '更新成功');
  }

  /**
   * 更新应用类型
   */
  @Put(':id')
  @ApiOperation({ summary: '更新应用类型', description: '更新指定应用类型的信息' })
  @ApiParam({ name: 'id', description: '应用类型 ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: AppTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: '应用类型不存在' })
  @ApiResponse({ status: 409, description: '类型编码已存在' })
  @AuditLog({ module: AuditModule.APP_TYPE, event: 'UPDATE_APP_TYPE', description: '更新应用类型' })
  @RequirePermission({ permCode: 'pc_root:sys:app-type', permissionValue: ['编辑'] })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppTypeDto: UpdateAppTypeDto,
  ) {
    const result = await this.appTypeService.update(id, updateAppTypeDto);
    return ApiResponseUtil.success(result, '更新成功');
  }

  /**
   * 删除应用类型
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除应用类型', description: '删除指定的应用类型（软删除）' })
  @ApiParam({ name: 'id', description: '应用类型 ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '应用类型不存在' })
  @AuditLog({ module: AuditModule.APP_TYPE, event: 'DELETE_APP_TYPE', description: '删除应用类型' })
  @RequirePermission({ permCode: 'pc_root:sys:app-type', permissionValue: ['删除'] })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.appTypeService.delete(id);
    return ApiResponseUtil.success(null, '删除成功');
  }

  /**
   * 更新应用类型状态
   */
  @Put(':id/status')
  @ApiOperation({ summary: '更新应用类型状态', description: '启用或禁用指定应用类型' })
  @ApiParam({ name: 'id', description: '应用类型 ID' })
  @ApiQuery({ name: 'status', description: '状态 (1:启用 0:禁用)', enum: [0, 1] })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: AppTypeResponseDto,
  })
  @AuditLog({ module: AuditModule.APP_TYPE, event: 'UPDATE_APP_TYPE_STATUS', description: '更新应用类型状态' })
  @RequirePermission({ permCode: 'pc_root:sys:app-type', permissionValue: ['编辑'] })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: StatusDto,
  ) {
    const result = await this.appTypeService.updateStatus(id, body.status);
    return ApiResponseUtil.success(result, '更新成功');
  }

  /**
   * 获取自定义菜单
   */
  @Get(':id/custom-menu')
  @ApiOperation({ summary: '获取自定义菜单', description: '获取应用类型的自定义菜单配置' })
  @ApiParam({ name: 'id', description: '应用类型 ID' })
  @RequirePermission({ permCode: 'pc_root:sys:app-type' })
  async getCustomMenu(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.appTypeService.getCustomMenu(id);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 保存自定义菜单
   */
  @Put(':id/custom-menu')
  @ApiOperation({ summary: '保存自定义菜单', description: '保存应用类型的自定义菜单配置' })
  @ApiParam({ name: 'id', description: '应用类型 ID' })
  @AuditLog({ module: AuditModule.APP_TYPE, event: 'UPDATE_CUSTOM_MENU', description: '更新自定义菜单' })
  @RequirePermission({ permCode: 'pc_root:sys:app-type', permissionValue: ['编辑'] })
  async saveCustomMenu(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveCustomMenuDto,
  ) {
    const result = await this.appTypeService.saveCustomMenu(id, dto.data);
    return ApiResponseUtil.success(result, '保存成功');
  }

  /**
   * 清空自定义菜单
   */
  @Delete(':id/custom-menu')
  @ApiOperation({ summary: '清空自定义菜单', description: '清空应用类型的自定义菜单配置' })
  @ApiParam({ name: 'id', description: '应用类型 ID' })
  @AuditLog({ module: AuditModule.APP_TYPE, event: 'CLEAR_CUSTOM_MENU', description: '清空自定义菜单' })
  @RequirePermission({ permCode: 'pc_root:sys:app-type', permissionValue: ['编辑'] })
  async clearCustomMenu(@Param('id', ParseUUIDPipe) id: string) {
    await this.appTypeService.clearCustomMenu(id);
    return ApiResponseUtil.success(null, '清空成功');
  }
}
