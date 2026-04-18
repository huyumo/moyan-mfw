/**
 * @fileoverview 应用模块
 * @description 应用模块定义，包含应用服务和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from './entities/app.entity';
import { AppMember } from './entities/app-member.entity';

import { AppMemberService } from './service/app-member.service';
import { AppMemberController } from './controller/app-member.controller';
import { AppService } from './service/app.service';
import { AppController } from './controller/app.controller';
import { User } from '../user';
import { Role } from '../role';

/**
 * 应用模块
 * @description 提供应用实例管理相关功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([App, AppMember, User, Role]),
  ],
  providers: [AppService, AppMemberService],
  controllers: [AppController, AppMemberController],
  exports: [AppService, AppMemberService],
})
export class AppModule {}
