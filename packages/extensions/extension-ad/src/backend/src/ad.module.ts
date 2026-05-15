/**
 * @fileoverview 广告管理完整模块
 * @description CoreModule + Controller，提供完整的 HTTP API
 */

import { Module } from '@nestjs/common'
import { AdCoreModule } from './ad-core.module'
import { AdPlacementTypeController } from './controller/ad-placement-type.controller'
import { AdPlacementController } from './controller/ad-placement.controller'
import { AdController } from './controller/ad.controller'

@Module({
  imports: [AdCoreModule],
  controllers: [AdPlacementTypeController, AdPlacementController, AdController],
  exports: [AdCoreModule],
})
export class AdModule {}
