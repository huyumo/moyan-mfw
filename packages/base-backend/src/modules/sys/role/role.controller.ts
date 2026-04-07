/**
 * @fileoverview 角色控制器
 * @description 处理角色相关 HTTP 请求
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
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto, RoleResponseDto } from './dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuditLog, AuditModule } from '../../../common/decorators/audit-log.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { ApiResponseUtil } from '../../../common/types/api.types';

/**
 * 角色控制器
 * @description 处理角色相关的 CRUD 请求
 */
@ApiTags('role', '角色相关接口')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
@Controller('roles')
export class RoleController {
  constructor(private roleService: RoleService) {}

  /**
   * 创建角色
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建角色', description: '创建新的系统角色' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '角色编码已存在' })
  @AuditLog({ module: AuditModule.ROLE, event: 'CREATE_ROLE', description: '创建角色' })
  @RequirePermission({ permCode: 'system:role', permissionValue: ['添加'] })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const result = await this.roleService.create(createRoleDto);
    return ApiResponseUtil.success(result, '创建成功');
  }

  /**
   * 查询角色列表
   */
  @Get()
  @ApiOperation({ summary: '查询角色列表', description: '分页查询角色列表' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'roleCode', required: false, type: String })
  @ApiQuery({ name: 'roleName', required: false, type: String })
  @ApiQuery({ name: 'roleStatus', required: false, type: Number })
  @RequirePermission({ permCode: 'system:role', permissionValue: ['查看'] })
  async findAll(@Query() query: any) {
    const result = await this.roleService.findAll(query);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 根据 ID 查询角色
   */
  @Get(':id')
  @ApiOperation({ summary: '根据 ID 查询角色', description: '查询指定角色的详细信息' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @RequirePermission({ permCode: 'system:role', permissionValue: ['查看'] })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.roleService.findById(id);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 更新角色
   */
  @Put(':id')
  @ApiOperation({ summary: '更新角色', description: '更新指定角色的信息' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @AuditLog({ module: AuditModule.ROLE, event: 'UPDATE_ROLE', description: '更新角色' })
  @RequirePermission({ permCode: 'system:role', permissionValue: ['编辑'] })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const result = await this.roleService.update(id, updateRoleDto);
    return ApiResponseUtil.success(result, '更新成功');
  }

  /**
   * 删除角色
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除角色', description: '删除指定的角色（软删除）' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @ApiResponse({ status: 409, description: '内置角色不允许删除' })
  @AuditLog({ module: AuditModule.ROLE, event: 'DELETE_ROLE', description: '删除角色' })
  @RequirePermission({ permCode: 'system:role', permissionValue: ['删除'] })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.roleService.delete(id);
    return ApiResponseUtil.success(null, '删除成功');
  }

  /**
   * 为角色分配权限
   */
  @Post(':id/permissions')
  @ApiOperation({ summary: '分配权限', description: '为指定角色分配权限' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiResponse({ status: 200, description: '分配成功' })
  @ApiResponse({ status: 404, description: '角色不存在' })
  @AuditLog({ module: AuditModule.ROLE, event: 'ASSIGN_PERMISSIONS', description: '分配权限' })
  @RequirePermission({ permCode: 'system:role', permissionValue: ['编辑'] })
  async assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    await this.roleService.assignPermissions(id, assignPermissionsDto.permissions);
    return ApiResponseUtil.success(null, '分配成功');
  }

  /**
   * 获取角色的权限列表
   */
  @Get(':id/permissions')
  @ApiOperation({ summary: '获取角色权限', description: '获取指定角色的权限列表' })
  @ApiParam({ name: 'id', description: '角色 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  @RequirePermission({ permCode: 'system:role', permissionValue: ['查看'] })
  async getRolePermissions(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.roleService.getRolePermissions(id);
    return ApiResponseUtil.success(result, '查询成功');
  }
}
