/**
 * @fileoverview 成员控制器
 * @description 处理应用成员相关 HTTP 请求
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { MemberService } from './member.service';
import { AddMemberDto, UpdateMemberRolesDto, MemberResponseDto, AvailableRoleDto } from './dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuditLog, AuditModule } from '../../../common/decorators/audit-log.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { ApiResponseUtil } from '../../../common/types/api.types';

/**
 * 成员控制器
 * @description 处理应用成员相关的 CRUD 请求
 */
@ApiTags('member', '应用成员相关接口')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
@Controller('apps/:appId/members')
export class MemberController {
  constructor(private memberService: MemberService) {}

  /**
   * 添加应用成员
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '添加应用成员', description: '添加用户到应用成员列表' })
  @ApiParam({ name: 'appId', description: '应用 ID' })
  @ApiResponse({
    status: 201,
    description: '添加成功',
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '应用或用户不存在' })
  @ApiResponse({ status: 409, description: '成员已存在' })
  @AuditLog({ module: AuditModule.MEMBER, event: 'ADD_MEMBER', description: '添加应用成员' })
  @RequirePermission({ permCode: 'system:member', permissionValue: 1n }) // ADD
  async addMember(
    @Param('appId', ParseUUIDPipe) appId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    const result = await this.memberService.addMember(appId, addMemberDto);
    return ApiResponseUtil.success(result, '添加成功');
  }

  /**
   * 获取应用成员列表
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取应用成员列表', description: '获取应用的所有成员及其角色信息' })
  @ApiParam({ name: 'appId', description: '应用 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: [MemberResponseDto],
  })
  @ApiResponse({ status: 404, description: '应用不存在' })
  @RequirePermission({ permCode: 'system:member', permissionValue: 32n }) // VIEW
  async getMembers(@Param('appId', ParseUUIDPipe) appId: string) {
    const result = await this.memberService.getMembers(appId);
    return ApiResponseUtil.success(result, '查询成功');
  }

  /**
   * 更新成员角色
   */
  @Put(':userId/roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新成员角色', description: '更新成员在应用中的角色列表（全量替换）' })
  @ApiParam({ name: 'appId', description: '应用 ID' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '应用或成员不存在' })
  @AuditLog({ module: AuditModule.MEMBER, event: 'UPDATE_MEMBER_ROLES', description: '更新成员角色' })
  @RequirePermission({ permCode: 'system:member', permissionValue: 2n }) // EDIT
  async updateRoles(
    @Param('appId', ParseUUIDPipe) appId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateDto: UpdateMemberRolesDto,
  ) {
    await this.memberService.updateRoles(appId, userId, updateDto);
    return ApiResponseUtil.success(null, '更新成功');
  }

  /**
   * 移除应用成员
   */
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '移除应用成员', description: '从应用中移除成员及其角色' })
  @ApiParam({ name: 'appId', description: '应用 ID' })
  @ApiParam({ name: 'userId', description: '用户 ID' })
  @ApiResponse({ status: 204, description: '移除成功' })
  @ApiResponse({ status: 400, description: '不能移除拥有者' })
  @ApiResponse({ status: 404, description: '成员不存在' })
  @AuditLog({ module: AuditModule.MEMBER, event: 'REMOVE_MEMBER', description: '移除应用成员' })
  @RequirePermission({ permCode: 'system:member', permissionValue: 4n }) // DELETE
  async removeMember(
    @Param('appId', ParseUUIDPipe) appId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.memberService.removeMember(appId, userId);
    return ApiResponseUtil.success(null, '移除成功');
  }

  /**
   * 获取可选角色列表
   */
  @Get('/available-roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取可选角色列表', description: '获取应用可分配的角色列表' })
  @ApiParam({ name: 'appId', description: '应用 ID' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: [AvailableRoleDto],
  })
  @ApiResponse({ status: 404, description: '应用不存在' })
  @RequirePermission({ permCode: 'system:member', permissionValue: 32n }) // VIEW
  async getAvailableRoles(@Param('appId', ParseUUIDPipe) appId: string) {
    const result = await this.memberService.getAvailableRoles(appId);
    return ApiResponseUtil.success(result, '查询成功');
  }
}
