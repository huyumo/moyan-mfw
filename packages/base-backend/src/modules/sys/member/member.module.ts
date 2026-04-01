/**
 * @fileoverview 成员模块
 * @description 成员模块定义，包含成员服务和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppMember } from '../app/entities/app-member.entity';
import { App } from '../app/entities/app.entity';
import { Role } from '../role/entities/role.entity';
import { User } from '../user/entities/user.entity';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';

/**
 * 成员模块
 * @description 提供应用成员管理相关功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AppMember, App, Role, User]),
  ],
  providers: [MemberService],
  controllers: [MemberController],
  exports: [MemberService],
})
export class MemberModule {}
