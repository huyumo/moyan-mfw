/**
 * @fileoverview 初始化模块
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallController } from './install.controller';
import { InstallService } from './install.service';
import { AppType } from '../app-type/entities/app-type.entity';
import { PermissionModule } from '../permission/permission.module';

/**
 * 初始化模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AppType]),
    PermissionModule,
  ],
  controllers: [InstallController],
  providers: [InstallService],
  exports: [InstallService],
})
export class InstallModule {}
