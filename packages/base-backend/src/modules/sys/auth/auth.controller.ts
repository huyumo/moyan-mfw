/**
 * @fileoverview 认证控制器
 * @description 处理用户认证相关请求
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, UserInfoDto } from './dto';
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
   * @param req - 请求对象（user 从 JWT 中解析）
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
  async getCurrentUser(@Request() req: any) {
    const userId = req.user.id;
    const result = await this.authService.getCurrentUser(userId);
    return ApiResponseUtil.success(result, '获取成功');
  }

  /**
   * 退出登录
   * @param req - 请求对象
   * @returns 退出结果
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: '退出登录', description: '使当前 Token 失效' })
  @ApiResponse({ status: 200, description: '退出成功' })
  async logout(@Request() req: any) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(token);
    return ApiResponseUtil.success(null, '退出成功');
  }
}
