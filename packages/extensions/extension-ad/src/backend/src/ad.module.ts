/**
 * @fileoverview 广告管理完整模块
 * @description CoreModule + Controller，提供完整的 HTTP API
 */

import { Module } from '@nestjs/common'
import { AdCoreModule } from './ad-core.module'
import { AdPlacementController } from './controller/ad-placement.controller'
import { AdController } from './controller/ad.controller'

@Module({
  imports: [AdCoreModule],
  controllers: [AdPlacementController, AdController],
  exports: [AdCoreModule],
})
export class AdModule {}

/**
 * 广告模块路由前缀配置
 * @description 固化扩展包的接口路由前缀，业务层直接引用即可，无需关心具体值
 */
export const adModuleRoute = {
  path: 'ext/ad',
  module: AdModule,
} as const
