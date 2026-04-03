/**
 * @fileoverview 健康检查模块
 * @description 提供服务健康检查功能
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}