/**
 * @fileoverview 广告管理核心模块
 */

import { Module } from '@nestjs/common'
import { AdPlacementTypeService } from './service/ad-placement-type.service'
import { AdPlacementService } from './service/ad-placement.service'
import { AdService } from './service/ad.service'

@Module({
  providers: [AdPlacementTypeService, AdPlacementService, AdService],
  exports: [AdPlacementTypeService, AdPlacementService, AdService],
})
export class AdCoreModule {}
