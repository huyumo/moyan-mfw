/**
 * @fileoverview 用户模块
 * @description 用户模块定义，包含用户服务和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../../role/entities/user-role.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';

/**
 * 用户模块
 * @description 提供用户管理相关功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
