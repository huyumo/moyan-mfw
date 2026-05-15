/**
 * @fileoverview 应用类型模块
 * @description 应用类型模块定义，包含应用类型服务和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppType } from './entities/app-type.entity';
import { Role } from '../../role/entities/role.entity';
import { AppTypeService } from './app-type.service';
import { AppTypeController } from './app-type.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppType, Role]),
  ],
  providers: [AppTypeService],
  controllers: [AppTypeController],
  exports: [AppTypeService],
})
export class AppTypeModule {}
