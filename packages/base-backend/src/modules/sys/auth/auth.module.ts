/**
 * @fileoverview 认证模块
 * @description 认证模块定义，包含认证服务和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../role/entities/user-role.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

/**
 * 认证模块
 * @description 提供用户认证相关功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRole]),
    JwtModule.register({
      secret: 'test_jwt_secret_key_for_integration_testing_only',
      signOptions: {
        expiresIn: 7200,
      },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
