/**
 * @fileoverview 应用模块
 * @description 应用模块定义，包含应用服务和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from './entities/app.entity';
import { AppService } from './app.service';
import { AppController } from './app.controller';

/**
 * 应用模块
 * @description 提供应用实例管理相关功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([App]),
  ],
  providers: [AppService],
  controllers: [AppController],
  exports: [AppService],
})
export class AppModule {}
