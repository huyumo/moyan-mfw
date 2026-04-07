/**
 * @fileoverview 认证模块
 * @description 认证模块定义，包含认证服务和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../role/entities/user-role.entity';
import { Role } from '../role/entities/role.entity';
import { App } from '../app/entities/app.entity';
import { AppMember } from '../app/entities/app-member.entity';
import { AppType } from '../app-type/entities/app-type.entity';
import { AppTypePermissionEntity } from '../app-type/entities/app-type-permission.entity';
import { Permission } from '../permission/entities/permission.entity';
import { RolePermission } from '../permission/entities/role-permission.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

/**
 * 认证模块
 * @description 提供用户认证相关功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserRole,
      Role,
      App,
      AppMember,
      AppType,
      AppTypePermissionEntity,
      Permission,
      RolePermission,
    ]),
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
