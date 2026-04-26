/**
 * @fileoverview 认证控制器
 * @description 处理用户认证相关请求
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { User, UserDto } from '../../../common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginResponseDto,
  UserInfoDto,
  AppInstanceItemDto,
  UserPermissionsDto,
  UserPermissionsResponseDto,
  RegisterDto,
  CheckAvailabilityDto,
  CheckAvailabilityResponseDto,
} from './dto';
import { Public } from '../../../common/decorators/public.decorator';
import { ApiResponseUtil } from '../../../common/types/api.types';

/**
 * 认证控制器
 * @description 处理用户登录、登出、Token 刷新等认证相关请求
 */
@ApiTags('auth', '认证相关接口')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 用户登录
   * @param loginDto - 登录请求参数
   * @returns 登录响应（包含 Token）
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录', description: '使用用户名和密码登录系统' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return ApiResponseUtil.success(result, '登录成功');
  }

  /**
   * 刷新 Token
   * @param refreshTokenDto - 刷新 Token 请求参数
   * @returns 新的 Token 对
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新 Token', description: '使用刷新 Token 获取新的访问 Token' })
  @ApiResponse({
    status: 200,
    description: '刷新成功',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '刷新 Token 无效或已过期' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    // 参数验证
    if (!refreshToken) {
      throw new BadRequestException('refreshToken 不能为空');
    }
    const result = await this.authService.refreshToken(refreshToken);
    return ApiResponseUtil.success(result, '刷新成功');
  }

  /**
   * 获取当前用户信息
   * @param user - 用户信息（从 JWT 中解析）
   * @returns 当前用户信息
   */
  @Post('userinfo')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: '获取当前用户信息', description: '获取已登录用户的详细信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: UserInfoDto,
  })
  async getCurrentUser(@User() user: UserDto) {
    const userId = user.id;
    const result = await this.authService.getCurrentUser(userId);
    return ApiResponseUtil.success(result, '获取成功');
  }

  /**
   * 退出登录
   * @param req - 请求对象
   * @returns 退出结果
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: '退出登录', description: '使当前 Token 失效（可选认证）' })
  @ApiResponse({ status: 200, description: '退出成功' })
  async logout(@Request() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token);
    return ApiResponseUtil.success(null, '退出成功');
  }

  /**
   * 获取用户可访问的应用实例列表
   * @param user - 用户信息（从 JWT 中解析）
   * @returns 用户可访问的应用实例列表
   */
  @Get('apps')
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '获取用户应用列表',
    description: '获取当前用户可访问的应用实例列表，包括作为拥有者和成员的应用',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [AppInstanceItemDto],
  })
  async getUserApps(@User() user: UserDto) {
    const userId = user.id;
    const apps = await this.authService.getUserApps(userId);
    return ApiResponseUtil.success(apps, '获取成功');
  }

  /**
   * 获取用户权限菜单
   * @param user - 用户信息（从 JWT 中解析）
   * @param query - 查询参数（appId）
   * @returns 用户权限菜单树
   */
  @Get('permissions')
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '获取用户权限菜单',
    description: '获取用户在指定应用实例下的权限菜单树，用于前端导航渲染',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: UserPermissionsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'appId 参数不能为空' })
  async getUserPermissions(
    @User() user: UserDto,
    @Query() query: UserPermissionsDto,
  ) {
    const userId = user.id;
    if (!query.appId) {
      throw new BadRequestException('appId 参数不能为空');
    }
    const result = await this.authService.getUserPermissions(userId, query.appId);
    return ApiResponseUtil.success(result, '获取成功');
  }

  /**
   * 用户自注册
   * @param registerDto - 注册请求参数
   * @returns 登录响应（包含 Token）
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户注册', description: '用户自注册，注册成功后自动登录' })
  @ApiResponse({
    status: 200,
    description: '注册成功',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 400, description: '用户名/邮箱/手机号已存在' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return ApiResponseUtil.success(result, '注册成功');
  }

  /**
   * 检查用户名/邮箱/手机号可用性
   * @param query - 检查参数
   * @returns 可用性检查结果
   */
  @Public()
  @Get('check-availability')
  @ApiOperation({
    summary: '检查可用性',
    description: '检查用户名、邮箱、手机号是否可注册',
  })
  @ApiResponse({
    status: 200,
    description: '检查成功',
    type: CheckAvailabilityResponseDto,
  })
  async checkAvailability(@Query() query: CheckAvailabilityDto) {
    const result = await this.authService.checkAvailability(query);
    return ApiResponseUtil.success(result, '检查成功');
  }

  /**
   * 修改密码
   * @param user - 用户信息
   * @param body - 请求体
   * @returns 修改结果
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: '修改密码', description: '用户修改自己的密码' })
  @ApiResponse({ status: 200, description: '修改成功' })
  @ApiResponse({ status: 400, description: '原密码错误' })
  @ApiResponse({ status: 401, description: '未登录' })
  async changePassword(
    @User() user: UserDto,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    if (!body.oldPassword || !body.newPassword) {
      throw new BadRequestException('原密码和新密码不能为空');
    }
    const userId = user.id;
    await this.authService.changePassword(userId, body.oldPassword, body.newPassword);
    return ApiResponseUtil.success(null, '密码修改成功');
  }

  /**
   * 同步用户权限
   * @param user - 用户信息
   * @param query - 查询参数
   * @returns 用户权限菜单树
   */
  @Post('sync-permissions')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '同步权限',
    description: '重新加载用户在指定应用实例下的权限',
  })
  @ApiResponse({
    status: 200,
    description: '同步成功',
    type: UserPermissionsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'appId 参数不能为空' })
  async syncPermissions(
    @User() user: UserDto,
    @Body() body: { appId: string },
  ) {
    const userId = user.id;
    if (!body.appId) {
      throw new BadRequestException('appId 参数不能为空');
    }
    const result = await this.authService.syncPermissions(userId, body.appId);
    return ApiResponseUtil.success(result, '权限同步成功');
  }
}
