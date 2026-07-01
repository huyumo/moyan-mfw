/**
 * @fileoverview 路由同步控制器
 * @description 提供菜单树配置的 API 同步接口，仅开发者（isDeveloper === 1）可调用
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { User, UserDto, ApiResponseUtil } from '../../../common';
import type { AppTypeMenuConfig } from '@internal/base-shared';
import { RouteSyncService } from './route-sync.service';
import { CheckSyncResponseDto, SyncResultDto } from './dto/route-sync.dto';

/**
 * 路由同步控制器
 * @description 接收前端推送的菜单树配置，同步权限数据到数据库
 */
@ApiTags('route-sync', '路由同步接口')
@Controller('route-sync')
export class RouteSyncController {
  constructor(private routeSyncService: RouteSyncService) {}

  /**
   * 检查是否需要同步
   * @description 对比前端推送的菜单树哈希与数据库存储的哈希，判断是否需要同步
   */
  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '检查路由同步状态',
    description: '对比菜单树配置哈希，判断是否需要同步。仅开发者可调用。',
  })
  @ApiResponse({
    status: 200,
    description: '检查成功',
    type: CheckSyncResponseDto,
  })
  @ApiResponse({ status: 403, description: '权限不足（需要开发者权限）' })
  async check(@User() user: UserDto, @Body() body: AppTypeMenuConfig[]) {
    this.requireDeveloper(user);
    const needsSync = await this.routeSyncService.checkSyncNeeded(body);
    return ApiResponseUtil.success({ needsSync }, '检查成功');
  }

  /**
   * 执行路由同步
   * @description 将前端推送的菜单树配置同步到数据库（权限、权限池、角色权限）
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: '执行路由同步',
    description: '将菜单树配置同步到数据库。仅开发者可调用。',
  })
  @ApiResponse({
    status: 200,
    description: '同步成功',
    type: SyncResultDto,
  })
  @ApiResponse({ status: 403, description: '权限不足（需要开发者权限）' })
  async sync(@User() user: UserDto, @Body() body: AppTypeMenuConfig[]) {
    this.requireDeveloper(user);
    const result = await this.routeSyncService.syncMenuTrees(body);
    return ApiResponseUtil.success(result, '路由同步完成');
  }

  /**
   * 验证用户是否为开发者
   */
  private requireDeveloper(user: UserDto): void {
    if (user.isDeveloper !== 1) {
      throw new ForbiddenException('仅开发者可执行路由同步');
    }
  }
}
