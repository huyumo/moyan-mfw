/**
 * @fileoverview 用户控制器
 * @description 处理用户相关 HTTP 请求
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
  BadRequestException,
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
import { UserService } from './user.service';
import { CreateUserDto, AdminCreateUserDto, UpdateUserDto, QueryUserDto, ResetPasswordDto, UserResponseDto } from './dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuditLog, AuditModule } from '../../../common/decorators/audit-log.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { ApiResponseUtil } from '../../../common/types/api.types';
import { ApiPaginatedResponse } from '../../../common';

/**
 * 用户控制器
 * @description 处理用户相关的 CRUD 请求
 */
@ApiTags('user', '用户相关接口')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * 创建用户
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建用户', description: '创建新的系统用户' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '用户名已存在' })
  @AuditLog({ module: AuditModule.USER, event: 'CREATE_USER', description: '创建用户' })
  @RequirePermission({ permCode: 'pc_root:sys:user', permissionValue: ['添加'] })
  async create(@Body() createUserDto: CreateUserDto) {
    const result = await this.userService.create(createUserDto);
    return ApiResponseUtil.success(result, '创建成功');
  }

  @Post('admin-create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '管理员创建用户', description: '管理员创建用户，使用系统默认密码' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 409, description: '用户名已存在' })
  @AuditLog({ module: AuditModule.USER, event: 'ADMIN_CREATE_USER', description: '管理员创建用户' })
  @RequirePermission({ permCode: 'pc_root:sys:user', permissionValue: ['添加'] })
  async adminCreate(@Body() dto: AdminCreateUserDto) {
    const result = await this.userService.adminCreate(dto);
    return ApiResponseUtil.success(result, '创建成功');
  }

  /**
   * 查询用户列表
   */
  @Get()
  @ApiOperation({ summary: '查询用户列表', description: '分页查询用户列表' })
  @ApiPaginatedResponse(UserResponseDto)
  @RequirePermission({ permCode: 'pc_root:sys:user' })
  async findAll(@Query() query: QueryUserDto) {
    const result = await this.userService.findAll(query);
    return ApiResponseUtil.success(result, '查询成功');
  }

  @Get('find-one')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '精确查找用户', description: '根据用户名或手机号精确匹配查找单个用户' })
  @ApiQuery({ name: 'keyword', description: '搜索关键词' })
  @ApiQuery({ name: 'searchBy', description: '搜索方式: username | phone | both', enum: ['username', 'phone', 'both'], required: false })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: UserResponseDto,
  })
  @RequirePermission({ permCode: 'pc_root:sys:user' })
  async findOneByKeyword(
    @Query('keyword') keyword: string,
    @Query('searchBy') searchBy: 'username' | 'phone' | 'both' = 'both',
  ) {
    const result = await this.userService.findOneByKeyword(keyword, searchBy);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 根据 ID 查询用户
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '根据 ID 查询用户', description: '查询指定用户的详细信息' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @RequirePermission({ permCode: 'pc_root:sys:user' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.userService.findById(id);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 更新用户
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新用户', description: '更新指定用户的信息' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @AuditLog({ module: AuditModule.USER, event: 'UPDATE_USER', description: '更新用户' })
  @RequirePermission({ permCode: 'pc_root:sys:user', permissionValue: ['编辑'] })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const result = await this.userService.update(id, updateUserDto);
    return ApiResponseUtil.success(result, '更新成功');
  }

  /**
   * 删除用户
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除用户', description: '删除指定的用户（软删除）' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @AuditLog({ module: AuditModule.USER, event: 'DELETE_USER', description: '删除用户' })
  @RequirePermission({ permCode: 'pc_root:sys:user', permissionValue: ['删除'] })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.userService.delete(id);
    return ApiResponseUtil.success(null, '删除成功');
  }

  /**
   * 更新用户状态
   */
  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新用户状态', description: '启用或禁用指定用户' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiQuery({ name: 'status', description: '状态 (1:启用 0:禁用)', enum: [0, 1] })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UserResponseDto,
  })
  @AuditLog({ module: AuditModule.USER, event: 'UPDATE_USER_STATUS', description: '更新用户状态' })
  @RequirePermission({ permCode: 'pc_root:sys:user', permissionValue: ['编辑'] })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: number,
  ) {
    // 验证状态值有效性
    if (status === undefined || status === null) {
      throw new BadRequestException('状态值不能为空');
    }
    if (status !== 0 && status !== 1) {
      throw new BadRequestException('状态值必须是 0 或 1');
    }
    const result = await this.userService.updateStatus(id, status);
    return ApiResponseUtil.success(result, '更新成功');
  }

  /**
   * 重置用户密码
   */
  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置用户密码', description: '重置指定用户的密码' })
  @ApiResponse({ status: 200, description: '重置成功' })
  @ApiResponse({ status: 400, description: '密码格式错误' })
  @AuditLog({ module: AuditModule.USER, event: 'RESET_USER_PASSWORD', description: '重置用户密码' })
  @RequirePermission({ permCode: 'pc_root:sys:user', permissionValue: ['编辑'] })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ResetPasswordDto,
  ) {
    const { password } = body;
    await this.userService.resetPassword(id, password);
    return ApiResponseUtil.success(null, '重置成功');
  }
}
