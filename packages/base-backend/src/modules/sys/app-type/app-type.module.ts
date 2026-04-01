/**
 * @fileoverview 应用类型模块
 * @description 应用类型模块定义，包含应用类型服务和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppType } from './entities/app-type.entity';
import { AppTypeService } from './app-type.service';
import { AppTypeController } from './app-type.controller';

/**
 * 应用类型模块
 * @description 提供应用类型管理相关功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AppType]),
  ],
  providers: [AppTypeService],
  controllers: [AppTypeController],
  exports: [AppTypeService],
})
export class AppTypeModule {}
