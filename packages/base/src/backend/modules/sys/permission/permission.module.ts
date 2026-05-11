/**
 * @fileoverview 权限模块
 * @description 权限模块定义，包含权限服务和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';

/**
 * 权限模块
 * @description 提供权限管理相关功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Permission]),
  ],
  providers: [PermissionService],
  controllers: [PermissionController],
  exports: [PermissionService],
})
export class PermissionModule {}
