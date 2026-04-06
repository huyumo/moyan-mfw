/**
 * @fileoverview 权限控制器
 * @description 处理权限相关 HTTP 请求
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
import { PermissionService } from './permission.service';
import { CreatePermissionDto, UpdatePermissionDto, QueryPermissionDto, PermissionResponseDto } from './dto';
import { SyncPermissionDto, PermissionTreeNodeDto } from './dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuditLog, AuditModule } from '../../../common/decorators/audit-log.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { ApiResponseUtil } from '../../../common/types/api.types';

/**
 * 权限控制器
 * @description 处理权限相关的 CRUD 请求
 */
@ApiTags('permission', '权限相关接口')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
@Controller('permissions')
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  /**
   * 创建权限
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建权限', description: '创建新的系统权限' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '权限编码已存在' })
  @AuditLog({ module: AuditModule.PERMISSION, event: 'CREATE_PERMISSION', description: '创建权限' })
  @RequirePermission({ permCode: 'system:permission', permissionValue: 1n }) // ADD
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const result = await this.permissionService.create(createPermissionDto);
    return ApiResponseUtil.success(result, '创建成功');
  }

  /**
   * 查询权限列表
   */
  @Get()
  @ApiOperation({ summary: '查询权限列表', description: '分页查询权限列表' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'appTypeId', required: false, type: String })
  @ApiQuery({ name: 'permName', required: false, type: String })
  @ApiQuery({ name: 'permCode', required: false, type: String })
  @ApiQuery({ name: 'permissionType', required: false, enum: [1, 2, 3] })
  @ApiQuery({ name: 'nodeType', required: false, enum: [1, 2, 3] })
  @ApiQuery({ name: 'parentId', required: false, type: String })
  @RequirePermission({ permCode: 'system:permission', permissionValue: 32n }) // VIEW
  async findAll(@Query() query: QueryPermissionDto) {
    const result = await this.permissionService.findAll(query);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 查询所有权限（树形结构）
   */
  @Get('tree/all')
  @ApiOperation({ summary: '查询所有权限树', description: '获取完整的权限树形结构' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: [PermissionTreeNodeDto],
  })
  @ApiQuery({ name: 'permissionType', required: false, description: '权限类型：PC/NORMAL', enum: ['PC', 'NORMAL'] })
  @RequirePermission({ permCode: 'system:permission', permissionValue: 32n }) // VIEW
  async findAllTree(@Query('permissionType') permissionType?: string) {
    const result = await this.permissionService.findAllTreeWithChildren(permissionType);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 获取权限树
   */
  @Get('tree')
  @ApiOperation({ summary: '获取权限树', description: '获取指定父节点的权限树' })
  @ApiQuery({ name: 'parentId', required: false, description: '父权限 ID，不传则查询根节点' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: [PermissionTreeNodeDto],
  })
  @RequirePermission({ permCode: 'system:permission', permissionValue: 32n }) // VIEW
  async getPermissionTree(@Query('parentId') parentId?: string) {
    const result = await this.permissionService.getPermissionTreeWithChildren(parentId);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 根据 ID 查询权限
   */
  @Get(':id')
  @ApiOperation({ summary: '根据 ID 查询权限', description: '查询指定权限的详细信息' })
  @ApiParam({ name: 'id', description: '权限 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 404, description: '权限不存在' })
  @RequirePermission({ permCode: 'system:permission', permissionValue: 32n }) // VIEW
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.permissionService.findById(id);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 更新权限
   */
  @Put(':id')
  @ApiOperation({ summary: '更新权限', description: '更新指定权限的信息' })
  @ApiParam({ name: 'id', description: '权限 ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 404, description: '权限不存在' })
  @ApiResponse({ status: 409, description: '权限编码已存在' })
  @AuditLog({ module: AuditModule.PERMISSION, event: 'UPDATE_PERMISSION', description: '更新权限' })
  @RequirePermission({ permCode: 'system:permission', permissionValue: 2n }) // EDIT
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const result = await this.permissionService.update(id, updatePermissionDto);
    return ApiResponseUtil.success(result, '更新成功');
  }

  /**
   * 删除权限
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除权限', description: '删除指定的权限（软删除）' })
  @ApiParam({ name: 'id', description: '权限 ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '权限不存在' })
  @ApiResponse({ status: 409, description: '存在子权限，无法删除' })
  @AuditLog({ module: AuditModule.PERMISSION, event: 'DELETE_PERMISSION', description: '删除权限' })
  @RequirePermission({ permCode: 'system:permission', permissionValue: 4n }) // DELETE
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.permissionService.delete(id);
    return ApiResponseUtil.success(null, '删除成功');
  }

  /**
   * 批量创建权限
   */
  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量创建权限', description: '批量创建系统权限' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: [PermissionResponseDto],
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '权限编码已存在' })
  @AuditLog({ module: AuditModule.PERMISSION, event: 'BATCH_CREATE_PERMISSIONS', description: '批量创建权限' })
  @RequirePermission({ permCode: 'system:permission', permissionValue: 1n }) // ADD
  async batchCreate(@Body() permissions: CreatePermissionDto[]) {
    const result = await this.permissionService.batchCreate(permissions);
    return ApiResponseUtil.success(result, '批量创建成功');
  }

  /**
   * 同步路由到权限表
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '同步路由到权限表', description: '将前端路由同步到权限定义表（全局权限），返回最新权限树' })
  @ApiResponse({
    status: 200,
    description: '同步成功',
    type: [PermissionTreeNodeDto],
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @AuditLog({ module: AuditModule.PERMISSION, event: 'SYNC_PERMISSIONS', description: '同步权限路由' })
  // @RequirePermission({ permCode: 'system:permission', permissionValue: 1n }) // ADD
  async syncPermissions(@Body() syncDto: SyncPermissionDto) {
    const result = await this.permissionService.syncPermissions(syncDto.routes);
    return ApiResponseUtil.success(result, '权限同步成功');
  }
}
