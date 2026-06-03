/**
 * @fileoverview 配置管理模块
 * @description 注册路由前缀、实体和控制器
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouterModule } from '@nestjs/core';
import { Config } from './entities/config.entity';
import { ConfigController } from './controller/config.controller';
import { ConfigPubController } from './controller/config-pub.controller';
import { ConfigService } from './service/config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Config]),
    RouterModule.register([{ path: 'ext/config', module: ConfigModule }]),
  ],
  controllers: [ConfigController, ConfigPubController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
